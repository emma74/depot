import express from 'express';
import prisma from '../prismaClient.js';
import { HttpError, sendError } from '../utils/errors.js';
import { parseOrderItems, planItemChanges } from '../utils/orderItems.js';
import { refreshOrderLedger, reassignOrderPayer } from '../utils/orderPayment.js';
import { getPayerBalance } from '../utils/payerBalance.js';

const router = express.Router();


// ==============================
// 1. CREATE ORDER
// ==============================
router.post('/', async (req, res) => {
  try {
    const {
      orderNumber,
      orderDate,
      orderType,
      createdById,
      customerId,
      employeeId,
      items
    } = req.body;

    const order = await prisma.$transaction(async (tx) => {
      // Resolve userId of the party who owes on this order
      let payerId = null;
      if (customerId) {
        const customer = await tx.customer.findUnique({ where: { id: Number(customerId) } });
        payerId = customer?.userId ?? null;
      } else if (employeeId) {
        const employee = await tx.employee.findUnique({ where: { id: Number(employeeId) } });
        payerId = employee?.userId ?? null;
      }

      const newOrder = await tx.salesOrder.create({
        data: {
          orderNumber,
          orderDate: new Date(orderDate),
          orderType,
          createdById,
          customerId,
          employeeId,
          items: {
            create: items.map(item => ({
              product: item.product,
              qty: item.qty,
              unitPrice: item.unitPrice,
              amount: item.qty * item.unitPrice,
              saleOrderDate: new Date(orderDate)
            }))
          }
        },
        include: { items: true }
      });

      if (payerId) {
        // Opens this order's payment ledger with a $0-paid entry, so it shows up correctly
        // in the payer's balance (full amount owed, nothing paid yet) even before their
        // first real payment. refreshOrderLedger fills in the real amountDue/amountBalance.
        await tx.payment.create({
          data: {
            paymentDate: new Date(orderDate),
            user: { connect: { id: payerId } },
            salesOrder: { connect: { id: newOrder.id } },
            amountDue: 0,
            amountPaid: 0,
            amountBalance: 0,
            emptiesDue: 0,
            emptiesRec: 0,
            emptiesBal: 0,
          },
        });
        await refreshOrderLedger(tx, { salesOrderId: newOrder.id });
      }

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
    const { customerId, employeeId, status, startDate, endDate } = req.query;

    const ownershipWhere = req.user.role === 'admin' ? {} : {
      OR: [
        { createdById: req.user.id },
        { employee: { userId: req.user.id } },
      ],
    };

    const orders = await prisma.salesOrder.findMany({
      where: {
        ...ownershipWhere,
        ...(customerId && { customerId: Number(customerId) }),
        ...(employeeId && { employeeId: Number(employeeId) }),
        ...(status && { status }),
        ...(startDate || endDate ? {
          orderDate: {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          }
        } : {}),
      },
      include: {
        items: { include: { return: true } },
        payments: true,
        customer: { select: { id: true, userId: true, contactPerson: true, businessName: true } },
        employee: { select: { id: true, userId: true, firstName: true, lastName: true } },
      },
      orderBy: { orderDate: 'desc' }
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
    const order = await prisma.salesOrder.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        items: {
          include: {
            empty: true,
            return: true
          }
      },
      payments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] },
      employee: true
      }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (
      req.user.role !== 'admin' &&
      order.createdById !== req.user.id &&
      order.employee?.userId !== req.user.id
    ) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==============================
//  3b. UPDATE ORDER
// ==============================
// Items with an `id` are edited in place, items without one are added, and existing
// items left out of the request are removed. The order's payment ledger is re-derived
// from the new items (net of returns); every payment already recorded stays as its own
// entry, on its own date. Status is untouched.
//
// orderType (CUSTOMER vs EMPLOYEE) is fixed at creation and can't change here — it's a
// business decision made when the order is written up, not a detail to correct later.
// Which specific customer or employee it's billed to can be corrected, though; doing so
// moves every payment already recorded against this order to the new payer.
router.put('/:id', async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    if (!Number.isInteger(orderId)) throw new HttpError(400, 'Invalid order id');

    const { orderNumber, orderDate, orderType, customerId, employeeId } = req.body;

    const number = typeof orderNumber === 'string' ? orderNumber.trim() : '';
    if (!number) throw new HttpError(400, 'orderNumber is required');

    const date = orderDate ? new Date(orderDate) : null;
    if (!date || Number.isNaN(date.getTime())) throw new HttpError(400, 'A valid orderDate is required');

    if (orderType !== 'CUSTOMER' && orderType !== 'EMPLOYEE') {
      throw new HttpError(400, 'orderType must be CUSTOMER or EMPLOYEE');
    }
    const isCustomerOrder = orderType === 'CUSTOMER';
    const partyId = Number(isCustomerOrder ? customerId : employeeId);
    if (!Number.isInteger(partyId) || partyId <= 0) {
      throw new HttpError(400, `${isCustomerOrder ? 'customerId' : 'employeeId'} is required`);
    }

    const items = parseOrderItems(req.body.items);

    const order = await prisma.$transaction(async (tx) => {
      const existing = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: { items: { include: { return: true } } },
      });
      if (!existing) throw new HttpError(404, 'Order not found');
      if (orderType !== existing.orderType) {
        throw new HttpError(400, 'orderType cannot be changed once an order is created');
      }

      const party = isCustomerOrder
        ? await tx.customer.findUnique({ where: { id: partyId } })
        : await tx.employee.findUnique({ where: { id: partyId } });
      if (!party) throw new HttpError(404, isCustomerOrder ? 'Customer not found' : 'Employee not found');

      const currentPartyId = isCustomerOrder ? existing.customerId : existing.employeeId;
      const payerChanged = currentPartyId !== partyId;

      const { updates, creates, removals } = planItemChanges(existing.items, items);
      const returnedQty = (item) => item.return.reduce((sum, r) => sum + Number(r.qtyReturned), 0);

      for (const removed of removals) {
        if (removed.return.length > 0) {
          throw new HttpError(400, `Cannot remove ${removed.product}: it has returns recorded`);
        }
      }
      const existingById = new Map(existing.items.map((item) => [item.id, item]));
      for (const item of updates) {
        const returned = returnedQty(existingById.get(item.id));
        if (item.qty < returned) {
          throw new HttpError(400, `${item.product}: qty (${item.qty}) is less than the ${returned} already returned`);
        }
      }

      if (removals.length > 0) {
        await tx.salesOrderItem.deleteMany({ where: { id: { in: removals.map((r) => r.id) } } });
      }
      for (const item of updates) {
        await tx.salesOrderItem.update({
          where: { id: item.id },
          data: {
            product: item.product,
            qty: item.qty,
            unitPrice: item.unitPrice,
            amount: item.qty * item.unitPrice,
            saleOrderDate: date,
          },
        });
      }
      if (creates.length > 0) {
        await tx.salesOrderItem.createMany({
          data: creates.map((item) => ({
            salesOrderId: orderId,
            product: item.product,
            qty: item.qty,
            unitPrice: item.unitPrice,
            amount: item.qty * item.unitPrice,
            saleOrderDate: date,
          })),
        });
      }

      await tx.salesOrder.update({
        where: { id: orderId },
        data: {
          orderNumber: number,
          orderDate: date,
          orderType,
          customerId: isCustomerOrder ? partyId : null,
          employeeId: isCustomerOrder ? null : partyId,
        },
      });

      if (payerChanged) {
        await reassignOrderPayer(tx, { salesOrderId: orderId, userId: party.userId });
      }
      await refreshOrderLedger(tx, { salesOrderId: orderId });

      return tx.salesOrder.findUnique({
        where: { id: orderId },
        include: { items: true, payments: true },
      });
    });

    res.json(order);
  } catch (err) {
    sendError(res, err);
  }
});


// ==============================
//  4. UPDATE ORDER STATUS
// ==============================
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const order = await prisma.salesOrder.update({
      where: { id: Number(req.params.id) },
      data: { status }
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==============================
//  5. DELETE ORDER
// ==============================
router.delete('/:id', async (req, res) => {
  try {
    const orderId = Number(req.params.id);

    const order = await prisma.salesOrder.findUnique({
      where: { id: orderId },
      include: {
        payments: true,
        items: {
          include: { return: true }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    //Block deletion if payments exist
    if (order.payments.length > 0) {
      return res.status(400).json({
        message: "Cannot delete order with payments"
      });
    }

    //Block deletion if returns exist
    const hasReturns = order.items.some(item => item.return?.length > 0);
    if (hasReturns) {
      return res.status(400).json({
        message: "Cannot delete order with returns"
      });
    }

    //Safe to delete
    await prisma.salesOrder.delete({
      where: { id: orderId }
    });

    res.json({ message: "Order deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==============================
//  6. ORDER SUMMARY
// ==============================
// GET /users/:id/summary
// totalPaid is "how much this payer paid in this date range" — a plain sum over their
// payment history, which stays correct now that a payer can have several payments per
// order. totalBalance/totalEmptiesBalance are "what they owe right now" — a balance is a
// snapshot, not a date-range total, so it's computed live and ignores startDate/endDate.
router.get('/users/:id/summary', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const [paidAggregate, { totalBalance, totalEmptiesBalance }] = await Promise.all([
      prisma.payment.aggregate({
        where: { userId, ...(startDate || endDate ? { paymentDate: dateFilter } : {}) },
        _sum: { amountPaid: true },
      }),
      getPayerBalance(prisma, userId),
    ]);
    const totalPaid = Number(paidAggregate._sum.amountPaid || 0);

    if (!totalPaid && !totalBalance && !totalEmptiesBalance) {
      return res.json({
        totalPaid: 0,
        totalBalance: 0,
        totalEmptiesBalance: 0,
        status: 'NO_PAYMENTS',
      });
    }

    const status =
      totalBalance > 0
        ? 'OWING'
        : totalBalance < 0
        ? 'CREDIT'
        : 'PAID';

    res.json({
      totalPaid,
      totalBalance,
      totalEmptiesBalance,
      status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

export default router;