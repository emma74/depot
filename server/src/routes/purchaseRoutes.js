import express from 'express';
import prisma from '../prismaClient.js';
import { HttpError, sendError } from '../utils/errors.js';
import { parseOrderItems, planItemChanges } from '../utils/orderItems.js';
import { refreshOrderLedger } from '../utils/orderPayment.js';
import { resolveSupplier } from '../utils/supplier.js';

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
      userId,
      supplierId,
      supplierName,
    } = req.body;

    const order = await prisma.$transaction(async (tx) => {
      const supplier = await resolveSupplier(tx, { supplierId, supplierName });

      const newOrder = await tx.purchaseOrder.create({
        data: {
          invoiceNumber,
          invoiceDate: new Date(invoiceDate),
          user: { connect: { id: Number(userId) } },
          supplier: { connect: { id: supplier.id } },
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

      // Opens this order's payment ledger with a $0-paid entry, so it shows up correctly
      // in the supplier's balance (full amount owed, nothing paid yet) even before the
      // first real payment. refreshOrderLedger fills in the real amountDue/amountBalance.
      // No userId here — a purchase-order payment's counterparty is the supplier, found
      // through PurchaseOrder.supplierId, not a User.
      await tx.payment.create({
        data: {
          paymentDate: new Date(invoiceDate),
          purchaseOrder: { connect: { id: newOrder.id } },
          amountDue: 0,
          amountPaid: 0,
          amountBalance: 0,
          emptiesDue: 0,
          emptiesRec: 0,
          emptiesBal: 0,
        },
      });
      await refreshOrderLedger(tx, { purchaseOrderId: newOrder.id });

      return newOrder;
    });

    res.json(order);
  } catch (err) {
    sendError(res, err);
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
        supplier: true,
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
        payments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] },
        supplier: true,
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
//
// A supplier (supplierId or supplierName) is required on every edit, same as on create —
// this is also how an order created before suppliers existed gets one assigned: any edit
// to it now has to include one.
router.put('/:id', async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) throw new HttpError(400, 'Invalid order id');

    const { invoiceNumber, invoiceDate, supplierId, supplierName } = req.body;
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

      const supplier = await resolveSupplier(tx, { supplierId, supplierName });

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
        data: { invoiceNumber: number, invoiceDate: date, supplierId: supplier.id },
      });

      await refreshOrderLedger(tx, { purchaseOrderId: orderId });

      return tx.purchaseOrder.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true, supplier: true },
      });
    });

    res.json(order);
  } catch (err) {
    sendError(res, err);
  }
});

// ==============================
//  5. DELETE ORDER
// ==============================
// Same reasoning as sales order delete: every order has a $0 opening ledger entry from
// creation, so the guard checks whether any real money or empties have moved, not just
// whether a Payment row exists.
router.delete('/:id', async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) throw new HttpError(400, 'Invalid order id');

    await prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id: orderId },
        include: {
          payments: true,
          items: { include: { empty: true } },
        },
      });
      if (!order) throw new HttpError(404, 'Order not found');

      const hasRealPayments = order.payments.some(
        (p) => Number(p.amountPaid) > 0 || Number(p.emptiesRec || 0) > 0
      );
      if (hasRealPayments) throw new HttpError(400, 'Cannot delete an order with payments');

      const hasEmpties = order.items.some((item) => item.empty.length > 0);
      if (hasEmpties) throw new HttpError(400, 'Cannot delete an order with empties recorded');

      // Payment rows aren't cascade-deleted with the order (they'd be orphaned with a null
      // purchaseOrderId) — since they're confirmed all still $0, remove them explicitly.
      // Items cascade automatically.
      await tx.payment.deleteMany({ where: { purchaseOrderId: orderId } });
      await tx.purchaseOrder.delete({ where: { id: orderId } });
    });

    res.json({ message: 'Order deleted successfully' });
  } catch (err) {
    sendError(res, err);
  }
});

export default router

