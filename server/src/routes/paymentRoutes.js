import express from 'express';
import prisma from '../prismaClient.js';

const router = express.Router();

// ==============================
//  1. UPDATE PAYMENT FOR ORDER
// ==============================
router.patch('/', async (req, res) => {
  try {
    const {
      salesOrderId,
      purchaseOrderId,
      amountPaid,
      emptiesRec = 0,
      checkDate,
      checkNumber,
      loadNumber,
      carNumber,
    } = req.body;

    if (!salesOrderId && !purchaseOrderId) {
      return res.status(400).json({ message: 'Provide either salesOrderId or purchaseOrderId' });
    }

    // Recompute amountDue and emptiesDue from order items minus returns
    let amountDue = 0;
    let emptiesDue = 0;

    if (salesOrderId) {
      const order = await prisma.salesOrder.findUnique({
        where: { id: Number(salesOrderId) },
        include: { items: { include: { return: true } } },
      });
      if (!order) return res.status(404).json({ message: 'Sales order not found' });

      order.items.forEach(item => {
        const totalReturned = item.return?.reduce((sum, r) => sum + Number(r.qtyReturned), 0) || 0;
        const remainingQty = Number(item.qty) - totalReturned;
        amountDue += remainingQty * Number(item.unitPrice);
        if (item.product === '30cl' || item.product === '20cl') {
          emptiesDue += remainingQty;
        }
      });
    } else {
      const order = await prisma.purchaseOrder.findUnique({
        where: { id: Number(purchaseOrderId) },
        include: { items: true },
      });
      if (!order) return res.status(404).json({ message: 'Purchase order not found' });

      order.items.forEach(item => {
        amountDue += Number(item.qty) * Number(item.unitPrice);
        if (item.product === '30cl' || item.product === '20cl') {
          emptiesDue += Number(item.qty);
        }
      });
    }

    const payment = await prisma.$transaction(async (tx) => {
      const orderFilter = salesOrderId
        ? { salesOrderId: Number(salesOrderId) }
        : { purchaseOrderId: Number(purchaseOrderId) };

      const existing = await tx.payment.findFirst({ where: orderFilter });

      if (!existing) {
        throw new Error('Payment record not found for this order');
      }

      // Lock every Payment row for this user before reading the aggregate below, so a
      // concurrent PATCH for a different order of the same user blocks until this
      // transaction commits instead of racing on the read-then-write of the running
      // totals (Postgres's default Read Committed isolation would otherwise let both
      // transactions read the same pre-update aggregate and lose one update).
      await tx.$queryRaw`SELECT id FROM "Payment" WHERE "userId" = ${existing.userId} FOR UPDATE`;

      const newAmountBalance = amountDue - Number(amountPaid);
      const newEmptiesBal = emptiesDue - Number(emptiesRec);

      // Aggregate all balances for this user, then replace this record's old contribution with the new one
      const aggregate = await tx.payment.aggregate({
        where: { userId: existing.userId },
        _sum: { amountBalance: true, emptiesBal: true },
      });

      const newTotalAmountBal =
        Number(aggregate._sum.amountBalance || 0) - Number(existing.amountBalance) + newAmountBalance;
      const newTotalEmptiesBal =
        Number(aggregate._sum.emptiesBal || 0) - Number(existing.emptiesBal || 0) + newEmptiesBal;

      const updated = await tx.payment.update({
        where: { id: existing.id },
        data: {
          amountDue,
          emptiesDue,
          amountPaid,
          emptiesRec,
          amountBalance: newAmountBalance,
          emptiesBal: newEmptiesBal,
          totalAmountBal: newTotalAmountBal,
          totalEmptiesBal: newTotalEmptiesBal,
          checkDate: checkDate ? new Date(checkDate) : null,
          checkNumber,
          loadNumber,
          carNumber,
        },
      });

      if (salesOrderId) {
        await tx.salesOrder.update({
          where: { id: Number(salesOrderId) },
          data: { status: 'completed' },
        });
      }

      return updated;
    });

    res.json({ message: 'Payment updated successfully', payment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
// ==============================
// 2. GET ORDER PAYMENTS
// ==============================
router.get('/:id/summary', async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { startDate, endDate } = req.query;

    // Build date filter if provided
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    // Fetch payments in the range (or all if no range)
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
