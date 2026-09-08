# API Route Review — server/src/routes

Reviewed all 15 route files against `server/prisma/schema.prisma`, cross-checking every
Prisma call's field/relation names against the actual model definitions. Findings below
were each verified directly against the current source, not just inferred.

## Critical — endpoint always fails

| # | File | Issue | Status |
|---|------|-------|--------|
| 1 | `depositRoutes.js:22` (POST `/`) | Tries to `connect` a `user` relation on `Deposit`, but the `Deposit` model has no `user`/`userId` field at all. Every deposit creation throws a Prisma validation error → 500, deposits can never be created. | **Fixed** — removed the invalid `user` connect; Deposit records have no owner by design. Also gave `cash` the same `= 0` default `check` already had, so check-only deposits (the common case) no longer compute `NaN`. |
| 2 | `depositRoutes.js:89` (DELETE `/:id`) | Sets `isActive`/`deletedAt` on delete, but `Deposit` has neither column (only `Employee` does). Deposits can never be deleted — always 500. | **Fixed** — Deposit has no soft-delete columns, so this is now a real `prisma.deposit.delete()` with a 404 if the id doesn't exist. The client's existing Delete button on `DepositListPage.jsx` (already wired to `DELETE /api/deposits/:id`) now works end-to-end. |
| 3 | `debitRoutes.js:24` & `:56` (POST/PUT) | Sends `checkNumber: null` when it's omitted, but the schema defines `checkNumber Int` as required (no `?`). Any debit created/updated without a check number fails the NOT-NULL constraint. | **Fixed** — debits are check payments only, so `checkNumber` is now required on POST (400 with a clear message if missing) instead of silently becoming `null`. PUT no longer nulls it out either — if omitted it just leaves the existing value untouched. The client form's "Check number" field is now marked required to match. |
| 4 | `prodtotalRoutes.js:46-47` | The `type=sales` branch filters `salesOrder.invoiceDate` / `salesOrder.userId`, but `SalesOrder`'s actual fields are `orderDate` / `createdById`. `GET /total-products?type=sales` always 500s — only the purchase branch works. | **Fixed** — split into explicit purchase/sales branches. Sales now filters on `orderDate` and, when a `userId` is given, ties it to `employee.userId` (the employee the invoice was actually issued to) rather than `createdById` (whoever recorded it). |

## Data integrity / logic bugs

| # | File | Issue | Status |
|---|------|-------|--------|
| 5 | `salesRoutes.js:72-86` + `:218` | A `Payment` row is created for every customer/employee order immediately at creation (even with `amountPaid: 0`). The delete guard blocks deletion whenever `payments.length > 0` — so in practice, no customer/employee order can ever be deleted, not just ones with real payments received. | **Not a bug — by design.** Confirmed with the team: the Payment row is deliberately created up front so the customer/employee is debited accurately once they return product/settle up at the end of the day. Leaving the delete guard as-is. |
| 6 | `paymentRoutes.js:75-84` | Running totals (`totalAmountBal`/`totalEmptiesBal`) are computed by reading the current aggregate and writing back a new total, with no row locking. Two concurrent `PATCH /api/payments` for the same user's different orders can race and silently lose an update (classic read-modify-write bug under Postgres's default isolation level). | **Fixed** — the transaction now runs `SELECT ... FOR UPDATE` on every Payment row for that user before reading the aggregate, so a concurrent PATCH for the same user's other order blocks until this one commits instead of racing. |
| 7 | `depositRoutes.js:67-79` (PUT `/:id`) | Unlike POST, PUT doesn't recompute `amount` from `cash + check`, so it can drift out of sync with what's actually stored. Also does `new Date(date)` unconditionally — if `date` is omitted, that's an Invalid Date and the update throws (debitRoutes' PUT correctly guards this with `date ? new Date(date) : undefined`). | **Fixed** — PUT now recomputes `amount` from cash+check the same way POST does, and `date` is only touched if sent. |
| 8 | `authRoutes.js` login vs. register | Register checks username uniqueness case-insensitively, but login (`findUnique({ where: { username } })`) is still case-sensitive. Someone who registered as "Bob" typing "bob" to log in gets "Invalid credentials" even though the account exists. | **Fixed** — login now does the same case-insensitive lookup as registration. |
| 9 | `employeeRoutes.js:52-81` | GET `/:id` and GET `/` never filter out soft-deleted employees, even though DELETE sets `isActive: false` / `deletedAt`. A deleted employee still shows up in listings and lookups (including for their own linked user account). | **Fixed** — both endpoints now filter `isActive: true`. |
| 10 | `returnRoutes.js:9-40` | `qtyReturned` is accepted with no validation — not checked to be positive, not checked against the item's remaining unreturned quantity. A bad value can drive `amountDue` negative in `paymentRoutes.js`'s calculation downstream. | **Fixed** — rejects non-positive `qtyReturned` and any amount that would exceed the item's remaining unreturned quantity, with a clear 400 message either way. |

## Priority

All ten findings are now resolved — 5 was determined to be intentional design rather
than a bug; the rest have been fixed.
