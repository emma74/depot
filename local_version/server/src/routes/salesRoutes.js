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
        let amountDue = 0;
        let emptiesDue = 0;
        for (const item of items) {
          amountDue += item.qty * item.unitPrice;
          if (item.product === '30cl' || item.product === '20cl') {
            emptiesDue += item.qty;
          }
        }

        const aggregate = await tx.payment.aggregate({
          where: { userId: payerId },
          _sum: { amountBalance: true, emptiesBal: true },
        });
        const prevAmountBal = Number(aggregate._sum.amountBalance || 0);
        const prevEmptiesBal = Number(aggregate._sum.emptiesBal || 0);

        await tx.payment.create({
          data: {
            paymentDate: new Date(orderDate),
            user: { connect: { id: payerId } },
            salesOrder: { connect: { id: newOrder.id } },
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
      payments: true,
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
router.get('/users/:id/summary', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { startDate, endDate } = req.query;

    // Build date filter if provided
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where = {
      userId,
      ...(startDate || endDate ? { paymentDate: dateFilter } : {}),
    };

    const aggregate = await prisma.payment.aggregate({
      where,
      _sum: { amountPaid: true, amountBalance: true, emptiesBal: true },
    });

    if (!aggregate._sum.amountPaid && !aggregate._sum.amountBalance) {
      return res.json({
        totalPaid: 0,
        totalBalance: 0,
        totalEmptiesBalance: 0,
        status: 'NO_PAYMENTS',
      });
    }

    const totalPaid = Number(aggregate._sum.amountPaid || 0);
    const totalBalance = Number(aggregate._sum.amountBalance || 0);
    const totalEmptiesBalance = Number(aggregate._sum.emptiesBal || 0);

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