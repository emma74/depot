const EMPTIES_PRODUCTS = ['30cl', '20cl'];

// Amount and empties still owed on an order once returns are netted out.
export function calculateDue(items) {
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

// An order's Payment rows form a ledger: one row per payment actually received, in the
// order they were recorded. Call this after anything that can change what's owed on an
// order — a new or edited payment, an order edit, a return — to keep every row's stored
// `amountDue`/`amountBalance` (and the empties equivalents) correct. `amountDue` is a
// property of the order, so every row ends up with the same (current) due amount;
// `amountBalance` is a running balance — what's still owed immediately after that row's
// payment — so only the most recent row reflects the order's balance right now.
//
// Must run inside a transaction. No-ops (returns null) if the order has no Payment rows yet.
export async function refreshOrderLedger(tx, { salesOrderId, purchaseOrderId }) {
  const isSales = salesOrderId !== undefined;
  const orderFilter = isSales ? { salesOrderId } : { purchaseOrderId };
  const orderColumn = isSales ? 'salesOrderId' : 'purchaseOrderId';
  const orderId = isSales ? salesOrderId : purchaseOrderId;

  const items = isSales
    ? await tx.salesOrderItem.findMany({ where: { salesOrderId }, include: { return: true } })
    : await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId } });
  const { amountDue, emptiesDue } = calculateDue(items);

  // Lock this order's rows before recomputing, so a concurrent payment on the same order
  // queues up instead of racing on the running balance.
  await tx.$queryRawUnsafe(
    `SELECT id FROM "Payment" WHERE "${orderColumn}" = $1 FOR UPDATE`,
    orderId
  );

  const hasRows = (await tx.payment.count({ where: orderFilter })) > 0;
  if (!hasRows) return null;

  await tx.$executeRawUnsafe(
    `UPDATE "Payment" AS p
     SET "amountDue" = $2,
         "emptiesDue" = $3,
         "amountBalance" = $2 - t."runningPaid",
         "emptiesBal" = $3 - t."runningRec"
     FROM (
       SELECT id,
              SUM("amountPaid") OVER (ORDER BY "paymentDate", id) AS "runningPaid",
              SUM(COALESCE("emptiesRec", 0)) OVER (ORDER BY "paymentDate", id) AS "runningRec"
       FROM "Payment"
       WHERE "${orderColumn}" = $1
     ) AS t
     WHERE p.id = t.id`,
    orderId, amountDue, emptiesDue
  );

  return tx.payment.findFirst({ where: orderFilter, orderBy: [{ paymentDate: 'desc' }, { id: 'desc' }] });
}

// Moves every payment already recorded against a sales order to a different payer (used
// when an order is reassigned from one customer to another, or one employee to another).
// Must run inside a transaction.
export async function reassignOrderPayer(tx, { salesOrderId, userId }) {
  await tx.payment.updateMany({ where: { salesOrderId }, data: { userId } });
}
