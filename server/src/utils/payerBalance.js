// A payer's current balance, computed fresh from the payment ledger rather than a cached
// running total: for each order they're on, take that order's most recent Payment row (its
// `amountBalance`/`emptiesBal` already reflect every payment made on that order, kept
// correct by refreshOrderLedger), and add those up across orders. There's nothing to keep
// in sync — the number is always exactly what the ledger says.
//
// Works with either a plain PrismaClient or a transaction client. Returns zeros for a payer
// with no orders at all.
export async function getPayerBalance(db, userId) {
  const rows = await db.$queryRaw`
    SELECT SUM("amountBalance") AS "totalBalance", SUM(COALESCE("emptiesBal", 0)) AS "totalEmptiesBalance"
    FROM (
      SELECT DISTINCT ON (COALESCE("salesOrderId", -"purchaseOrderId"))
             "amountBalance", "emptiesBal"
      FROM "Payment"
      WHERE "userId" = ${userId}
      ORDER BY COALESCE("salesOrderId", -"purchaseOrderId"), "paymentDate" DESC, id DESC
    ) AS latest`;

  const row = rows[0];
  return {
    totalBalance: Number(row?.totalBalance ?? 0),
    totalEmptiesBalance: Number(row?.totalEmptiesBalance ?? 0),
  };
}
