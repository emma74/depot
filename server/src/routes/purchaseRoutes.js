import express from 'express';
import prisma from '../prismaClient.js';
//import { calculateSummary } from '../utils/calculateSummary.js';

const router = express.Router();


// ==============================
// 1. CREATE ORDER
// ==============================
router.post('/', async (req, res) => {
  try {
    const {
      invoiceNumber,
      invoiceDate,
      items,
      userId
    } = req.body;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.purchaseOrder.create({
        data: {
          invoiceNumber,
          invoiceDate: new Date(invoiceDate),
          user: { connect: { id: Number(userId) } },
          items: {
            create: items.map(item => ({
              product: item.product,
              qty: item.qty,
              unitPrice: item.unitPrice,
              amount: item.qty * item.unitPrice,
              orderDate: new Date(invoiceDate)
            }))
          }
        },
        include: { items: true }
      });

      let amountDue = 0;
      let emptiesDue = 0;
      for (const item of items) {
        amountDue += item.qty * item.unitPrice;
        if (item.product === '30cl' || item.product === '20cl') {
          emptiesDue += item.qty;
        }
      }

      const aggregate = await tx.payment.aggregate({
        where: { userId: Number(userId) },
        _sum: { amountBalance: true, emptiesBal: true },
      });
      const prevAmountBal = Number(aggregate._sum.amountBalance || 0);
      const prevEmptiesBal = Number(aggregate._sum.emptiesBal || 0);

      await tx.payment.create({
        data: {
          paymentDate: new Date(invoiceDate),
          user: { connect: { id: Number(userId) } },
          purchaseOrder: { connect: { id: newOrder.id } },
          amountDue,
          amountPaid: 0,
          amountBalance: amountDue,
          emptiesDue,
          emptiesRec: 0,
          emptiesBal: emptiesDue,
          totalAmountBal: prevAmountBal + amountDue,
          totalEmptiesBal: prevEmptiesBal + emptiesDue,
        },
      });

      return newOrder;
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  2. GET ALL ORDERS (with filters)
// ==============================
router.get('/', async (req, res) => {
  try {
    const userId = req.query.userId;
    const { startDate, endDate } = req.query;

    // Build date filter if provided
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const orders = await prisma.purchaseOrder.findMany({
      where: {
        ...(userId && { userId: Number(userId) }),
        ...(startDate || endDate ? { invoiceDate: dateFilter } : {})
      },
      include: {
        items: true,
        payments: true,
        user: { select: { id: true, username: true } },
      },
      orderBy: { invoiceDate: 'desc' }
    });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  3. GET SINGLE ORDER
// ==============================
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        items: {
          include: {
            empty: true
          }
        },
        payments: true
      }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router

