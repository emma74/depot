const EMPTIES_PRODUCTS = ['30cl', '20cl'];

// Amount and empties still owed on an order once returns are netted out — the same
// figures PATCH /api/payments recomputes.
function calculateDue(items) {
  let amountDue = 0;
  let emptiesDue = 0;

  for (const item of items) {
    const returned = (item.return || []).reduce((sum, r) => sum + Number(r.qtyReturned), 0);
    const qty = Number(item.qty) - returned;
    amountDue += qty * Number(item.unitPrice);
    if (EMPTIES_PRODUCTS.includes(item.product)) emptiesDue += qty;
  }

  return { amountDue, emptiesDue };
}

// Recomputes the running totals (totalAmountBal / totalEmptiesBal) on every payment of a
// user: each row holds the sum of the balances of that user's payments up to and including
// itself, in creation order, so the last row is the user's overall balance. Creating an order
// sets its row this way; call this after anything that changes an earlier row's balance so
// the rows after it don't go stale. Must run inside a transaction.
export async function refreshRunningTotals(tx, userId) {
  await tx.$executeRaw`
    UPDATE "Payment" AS p
    SET "totalAmountBal" = t."runningAmount",
        "totalEmptiesBal" = t."runningEmpties"
    FROM (
      SELECT id,
             SUM("amountBalance") OVER (ORDER BY id) AS "runningAmount",
             SUM(COALESCE("emptiesBal", 0)) OVER (ORDER BY id) AS "runningEmpties"
      FROM "Payment"
      WHERE "userId" = ${userId}
    ) AS t
    WHERE p.id = t.id`;
}

// Re-derives an order's Payment row after the order (or its returns) changed. What was
// already paid/received is kept; due and balance are recomputed, then the running totals of
// the payer (and the previous payer, if it changed) are refreshed.
//
//   salesOrderId | purchaseOrderId  which order's payment to sync
//   userId        optional — the payer, when it may have changed (sales order party swap)
//   paymentDate   optional — new payment date (payments are dated with their order)
//
// Must run inside a transaction. Returns null when the order has no payer and no payment.
export async function syncOrderPayment(tx, { salesOrderId, purchaseOrderId, userId, paymentDate }) {
  const isSales = salesOrderId !== undefined;
  const orderFilter = isSales ? { salesOrderId } : { purchaseOrderId };

  const items = isSales
    ? await tx.salesOrderItem.findMany({ where: { salesOrderId }, include: { return: true } })
    : await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId } });
  const { amountDue, emptiesDue } = calculateDue(items);

  const current = await tx.payment.findFirst({ where: orderFilter });
  const payerId = userId ?? current?.userId;
  if (!payerId) return null;

  // Lock the payer's payment rows (the old payer's too, if it changed) so concurrent edits
  // queue up instead of racing on the totals. Locking in ascending id order keeps two
  // swapping edits from deadlocking.
  const affectedUserIds = [...new Set([current?.userId, payerId].filter(Boolean))].sort((a, b) => a - b);
  for (const lockId of affectedUserIds) {
    await tx.$queryRaw`SELECT id FROM "Payment" WHERE "userId" = ${lockId} FOR UPDATE`;
  }

  // Re-read now that we hold the lock, so amountPaid/emptiesRec can't be stale.
  const existing = await tx.payment.findFirst({ where: orderFilter });

  const amountPaid = Number(existing?.amountPaid ?? 0);
  const emptiesRec = Number(existing?.emptiesRec ?? 0);

  const data = {
    userId: payerId,
    amountDue,
    emptiesDue,
    amountBalance: amountDue - amountPaid,
    emptiesBal: emptiesDue - emptiesRec,
    ...(paymentDate && { paymentDate }),
  };

  if (existing) {
    await tx.payment.update({ where: { id: existing.id }, data });
  } else {
    await tx.payment.create({
      data: {
        ...data,
        ...orderFilter,
        paymentDate: paymentDate ?? new Date(),
        amountPaid: 0,
        emptiesRec: 0,
      },
    });
  }

  for (const affectedId of affectedUserIds) {
    await refreshRunningTotals(tx, affectedId);
  }

  return tx.payment.findFirst({ where: orderFilter });
}
