// A supplier's balance, computed the same way a payer's is (see payerBalance.js): for each
// of their purchase orders, take that order's most recent Payment row — kept correct by
// refreshOrderLedger — and add those up. There's no Payment.supplierId; a purchase-order
// payment's supplier is only ever known through PurchaseOrder.supplierId, so this joins
// through the order rather than filtering Payment directly.

// Every supplier with a balance, for the dashboard. Suppliers with no purchase orders yet
// (or none with any payment activity) come back with zero balances, not omitted.
export async function listSupplierBalances(db) {
  const rows = await db.$queryRaw`
    SELECT s.id, s.name,
           COALESCE(SUM(latest."amountBalance"), 0) AS "totalBalance",
           COALESCE(SUM(latest."emptiesBal"), 0) AS "totalEmptiesBalance"
    FROM "Supplier" s
    LEFT JOIN LATERAL (
      SELECT DISTINCT ON (p."purchaseOrderId") p."amountBalance", p."emptiesBal"
      FROM "Payment" p
      JOIN "PurchaseOrder" po ON po.id = p."purchaseOrderId"
      WHERE po."supplierId" = s.id
      ORDER BY p."purchaseOrderId", p."paymentDate" DESC, p.id DESC
    ) AS latest ON true
    GROUP BY s.id, s.name
    ORDER BY s.name`;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    totalBalance: Number(row.totalBalance ?? 0),
    totalEmptiesBalance: Number(row.totalEmptiesBalance ?? 0),
  }));
}
