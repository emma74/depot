import express from 'express';
import prisma from '../prismaClient.js';

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

    // Create return
    const returnItem = await prisma.return.create({
      data: {
        salesOrderItemId,
        qtyReturned: qty,
        userId,
        returnDate: new Date()
      }
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

export default router;