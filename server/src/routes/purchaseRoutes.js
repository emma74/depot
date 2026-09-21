import express from 'express';
import prisma from '../prismaClient.js';
import { HttpError, sendError } from '../utils/errors.js';
import { parseOrderItems, planItemChanges } from '../utils/orderItems.js';
import { syncOrderPayment } from '../utils/orderPayment.js';
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

// ==============================
//  4. UPDATE ORDER
// ==============================
// Items with an `id` are edited in place, items without one are added, and existing
// items left out of the request are removed. The order's payment is re-derived from
// the new items; what was already paid is kept.
router.put('/:id', async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) throw new HttpError(400, 'Invalid order id');

    const { invoiceNumber, invoiceDate } = req.body;
    const number = typeof invoiceNumber === 'string' ? invoiceNumber.trim() : '';
    if (!number) throw new HttpError(400, 'invoiceNumber is required');

    const date = invoiceDate ? new Date(invoiceDate) : null;
    if (!date || Number.isNaN(date.getTime())) throw new HttpError(400, 'A valid invoiceDate is required');

    const items = parseOrderItems(req.body.items);

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.purchaseOrder.findUnique({
        where: { id: orderId },
        include: { items: { include: { empty: true } } },
      });
      if (!existing) throw new HttpError(404, 'Order not found');

      const { updates, creates, removals } = planItemChanges(existing.items, items);

      for (const removed of removals) {
        if (removed.empty.length > 0) {
          throw new HttpError(400, `Cannot remove ${removed.product}: it has empties recorded`);
        }
      }

      if (removals.length > 0) {
        await tx.purchaseOrderItem.deleteMany({ where: { id: { in: removals.map((r) => r.id) } } });
      }
      for (const item of updates) {
        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: {
            product: item.product,
            qty: item.qty,
            unitPrice: item.unitPrice,
            amount: item.qty * item.unitPrice,
            orderDate: date,
          },
        });
      }
      if (creates.length > 0) {
        await tx.purchaseOrderItem.createMany({
          data: creates.map((item) => ({
            purchaseOrderId: orderId,
            product: item.product,
            qty: item.qty,
            unitPrice: item.unitPrice,
            amount: item.qty * item.unitPrice,
            orderDate: date,
          })),
        });
      }

      await tx.purchaseOrder.update({
        where: { id: orderId },
        data: { invoiceNumber: number, invoiceDate: date },
      });

      await syncOrderPayment(tx, { purchaseOrderId: orderId, paymentDate: date });

      return tx.purchaseOrder.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true },
      });
    });

    res.json(order);
  } catch (err) {
    sendError(res, err);
  }
});

export default router

