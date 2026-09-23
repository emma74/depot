import express from 'express';
import prisma from '../prismaClient.js';
import { HttpError, sendError } from '../utils/errors.js';
import { refreshOrderLedger } from '../utils/orderPayment.js';

const router = express.Router();

// Shared validation for both recording and editing a payment. `requireAmount` is true for
// a new payment (amountPaid required, emptiesRec/paymentDate default in) and false for an
// edit (amountPaid still required — a payment always has an amount — but the rest are only
// changed if sent).
function parsePaymentInput(body, { requireAmount }) {
  const amountPaid = Number(body.amountPaid);
  if (!Number.isFinite(amountPaid) || amountPaid <= 0) {
    throw new HttpError(400, 'amountPaid must be a positive number');
  }

  const emptiesRecRaw = body.emptiesRec;
  const emptiesRec = emptiesRecRaw === undefined || emptiesRecRaw === null || emptiesRecRaw === ''
    ? (requireAmount ? 0 : undefined)
    : Number(emptiesRecRaw);
  if (emptiesRec !== undefined && (!Number.isFinite(emptiesRec) || emptiesRec < 0)) {
    throw new HttpError(400, 'emptiesRec must be zero or more');
  }

  let paymentDate;
  if (body.paymentDate) {
    paymentDate = new Date(body.paymentDate);
    if (Number.isNaN(paymentDate.getTime())) throw new HttpError(400, 'paymentDate is not a valid date');
  } else if (requireAmount) {
    paymentDate = new Date();
  }

  let checkDate;
  if (body.checkDate) {
    checkDate = new Date(body.checkDate);
    if (Number.isNaN(checkDate.getTime())) throw new HttpError(400, 'checkDate is not a valid date');
  } else if (body.checkDate === null) {
    checkDate = null;
  }

  return {
    amountPaid,
    emptiesRec,
    paymentDate,
    checkDate,
    checkNumber: body.checkNumber === undefined ? undefined : (body.checkNumber === null ? null : Number(body.checkNumber)),
    loadNumber: body.loadNumber === undefined ? undefined : (body.loadNumber || null),
    carNumber: body.carNumber === undefined ? undefined : (body.carNumber || null),
  };
}

// Resolves who owes on an order, straight from the order itself — never from the request
// body, so a payment can't be recorded against the wrong person by mistake or on purpose.
async function resolveOrderPayer(tx, { salesOrderId, purchaseOrderId }) {
  if (salesOrderId) {
    const order = await tx.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: { customer: true, employee: true },
    });
    if (!order) throw new HttpError(404, 'Sales order not found');
    const party = order.orderType === 'CUSTOMER' ? order.customer : order.employee;
    if (!party) throw new HttpError(400, 'This order has no customer or employee to bill');
    return party.userId;
  }

  const order = await tx.purchaseOrder.findUnique({ where: { id: purchaseOrderId } });
  if (!order) throw new HttpError(404, 'Purchase order not found');
  return order.userId;
}

// ==============================
//  1. RECORD A PAYMENT
// ==============================
// Every payment is its own row — recording a second payment against an order that's
// already had one does not touch the first; both remain in the order's history. The
// order's `amountDue`/`amountBalance` are re-derived from its items across every payment
// on it (see refreshOrderLedger), so `amountPaid` here is just this payment's amount, not
// a running total.
router.post('/', async (req, res) => {
  try {
    const { salesOrderId, purchaseOrderId } = req.body;
    if (!salesOrderId && !purchaseOrderId) {
      throw new HttpError(400, 'Provide either salesOrderId or purchaseOrderId');
    }
    if (salesOrderId && purchaseOrderId) {
      throw new HttpError(400, 'Provide only one of salesOrderId or purchaseOrderId');
    }
    const orderRef = salesOrderId
      ? { salesOrderId: Number(salesOrderId) }
      : { purchaseOrderId: Number(purchaseOrderId) };

    const input = parsePaymentInput(req.body, { requireAmount: true });

    const payment = await prisma.$transaction(async (tx) => {
      const userId = await resolveOrderPayer(tx, orderRef);

      const created = await tx.payment.create({
        data: {
          ...orderRef,
          userId,
          paymentDate: input.paymentDate,
          amountDue: 0,
          amountPaid: input.amountPaid,
          amountBalance: 0,
          emptiesDue: 0,
          emptiesRec: input.emptiesRec,
          emptiesBal: 0,
          checkDate: input.checkDate ?? null,
          checkNumber: input.checkNumber ?? null,
          loadNumber: input.loadNumber ?? null,
          carNumber: input.carNumber ?? null,
        },
      });

      await refreshOrderLedger(tx, orderRef);

      if (salesOrderId) {
        await tx.salesOrder.update({ where: { id: Number(salesOrderId) }, data: { status: 'completed' } });
      }

      return tx.payment.findUnique({ where: { id: created.id } });
    });

    res.status(201).json({ message: 'Payment recorded successfully', payment });
  } catch (err) {
    sendError(res, err);
  }
});

// ==============================
//  2. EDIT A PAYMENT
// ==============================
// Edits one specific payment's own details. It can't be moved to a different order —
// that isn't an edit, it's a mistaken entry; delete/re-enter is the path for that today.
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) throw new HttpError(400, 'Invalid payment id');

    const input = parsePaymentInput(req.body, { requireAmount: false });

    const payment = await prisma.$transaction(async (tx) => {
      const existing = await tx.payment.findUnique({ where: { id } });
      if (!existing) throw new HttpError(404, 'Payment not found');

      await tx.payment.update({
        where: { id },
        data: {
          amountPaid: input.amountPaid,
          ...(input.emptiesRec !== undefined && { emptiesRec: input.emptiesRec }),
          ...(input.paymentDate && { paymentDate: input.paymentDate }),
          ...(input.checkDate !== undefined && { checkDate: input.checkDate }),
          ...(input.checkNumber !== undefined && { checkNumber: input.checkNumber }),
          ...(input.loadNumber !== undefined && { loadNumber: input.loadNumber }),
          ...(input.carNumber !== undefined && { carNumber: input.carNumber }),
        },
      });

      const orderRef = existing.salesOrderId
        ? { salesOrderId: existing.salesOrderId }
        : { purchaseOrderId: existing.purchaseOrderId };
      await refreshOrderLedger(tx, orderRef);

      return tx.payment.findUnique({ where: { id } });
    });

    res.json({ message: 'Payment updated successfully', payment });
  } catch (err) {
    sendError(res, err);
  }
});

// ==============================
//  3. PAYMENT HISTORY FOR A USER
// ==============================
// Every payment recorded against any order this user is the payer on, most recent first —
// a real transaction ledger now that a payment is never overwritten.
router.get('/:id/summary', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const payments = await prisma.payment.findMany({
      where: {
        userId,
        ...(startDate || endDate ? { paymentDate: dateFilter } : {}),
      },
      orderBy: { paymentDate: 'desc' },
    });

    if (!payments.length) {
      return res.json({
        totalBalance: 0,
        totalEmptiesBalance: 0,
        status: 'NO_PAYMENTS',
      });
    }

    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
