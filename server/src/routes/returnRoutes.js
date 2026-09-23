import express from 'express';
import prisma from '../prismaClient.js';
import { HttpError, sendError } from '../utils/errors.js';
import { refreshOrderLedger } from '../utils/orderPayment.js';

const router = express.Router();

// ==============================
//  1. ADD RETURN
// ==============================
router.post('/:id', async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const { salesOrderItemId, qtyReturned, userId } = req.body;

    // Check that item belongs to this order
    const item = await prisma.salesOrderItem.findUnique({
      where: { id: salesOrderItemId },
      include: { return: true }
    });

    if (!item || item.salesOrderId !== orderId) {
      return res.status(400).json({
        message: "Item does not belong to this order"
      });
    }

    const qty = Number(qtyReturned);
    if (!qty || qty <= 0) {
      return res.status(400).json({ message: "qtyReturned must be a positive number" });
    }

    const alreadyReturned = item.return.reduce((sum, r) => sum + Number(r.qtyReturned), 0);
    const remaining = Number(item.qty) - alreadyReturned;
    if (qty > remaining) {
      return res.status(400).json({
        message: `qtyReturned (${qty}) exceeds the remaining unreturned quantity (${remaining})`
      });
    }

    // Create the return, then re-derive the order's payment ledger — a return lowers
    // what's owed, so every payment already recorded against this order needs its
    // due/balance recomputed, the same as when a return is edited.
    const returnItem = await prisma.$transaction(async (tx) => {
      const created = await tx.return.create({
        data: {
          salesOrderItemId,
          qtyReturned: qty,
          userId,
          returnDate: new Date()
        }
      });
      await refreshOrderLedger(tx, { salesOrderId: orderId });
      return created;
    });

    res.json(returnItem);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  2. GET RETURNS FOR ORDER
// ==============================
router.get('/:id', async (req, res) => {
  try {
    const returns = await prisma.return.findMany({
      where: {
        salesOrderItem: {
          salesOrderId: Number(req.params.id)
        },
        ...(req.user.role !== 'admin' ? { userId: req.user.id } : {})
      }
    });

    res.json(returns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  3. UPDATE A RETURN
// ==============================
// Note: unlike the other two routes, `:id` here is the return's own id, not an order id.
// The order's payment is re-derived afterwards, since returns reduce what is owed.
router.put('/:id', async (req, res) => {
  try {
    const returnId = Number(req.params.id);
    if (!Number.isInteger(returnId)) throw new HttpError(400, 'Invalid return id');

    const qty = Number(req.body.qtyReturned);
    if (!Number.isFinite(qty) || qty <= 0) {
      throw new HttpError(400, 'qtyReturned must be a positive number');
    }

    let returnDate;
    if (req.body.returnDate) {
      returnDate = new Date(req.body.returnDate);
      if (Number.isNaN(returnDate.getTime())) throw new HttpError(400, 'returnDate is not a valid date');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.return.findUnique({
        where: { id: returnId },
        include: { salesOrderItem: { include: { return: true } } },
      });
      if (!existing) throw new HttpError(404, 'Return not found');

      const item = existing.salesOrderItem;
      const otherReturned = item.return
        .filter((r) => r.id !== returnId)
        .reduce((sum, r) => sum + Number(r.qtyReturned), 0);
      const remaining = Number(item.qty) - otherReturned;
      if (qty > remaining) {
        throw new HttpError(
          400,
          `qtyReturned (${qty}) exceeds the remaining unreturned quantity (${remaining})`
        );
      }

      const result = await tx.return.update({
        where: { id: returnId },
        data: { qtyReturned: qty, ...(returnDate && { returnDate }) },
      });

      await refreshOrderLedger(tx, { salesOrderId: item.salesOrderId });

      return result;
    });

    res.json(updated);
  } catch (err) {
    sendError(res, err);
  }
});

export default router;