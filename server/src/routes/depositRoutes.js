import express from 'express';
import prisma from '../prismaClient.js';

const router = express.Router();

// ==============================
//  1. ADD DEPOSIT
// ==============================
// Deposits have no user/owner — they're a company-level record of cash/check paid
// into the bank, not tied to a specific account. Most deposits are check-only, so
// `cash` defaults to 0 just like `check` already did.
router.post('/', async (req, res) => {
  try {
    const { cash = 0, check = 0, date } = req.body;

    const total = Number(cash) + Number(check);

    const deposit = await prisma.deposit.create({
      data: {
        cash: Number(cash),
        check: Number(check),
        amount: total,
        date: new Date(date),
      }
    });

    res.status(201).json(deposit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  2. GET ALL DEPOSITS with filters
// ==============================
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [deposits, aggregate] = await Promise.all([
      prisma.deposit.findMany({ where, orderBy: { date: 'desc' } }),
      prisma.deposit.aggregate({ where, _sum: { amount: true, cash: true, check: true } }),
    ]);

    res.json({
      deposits,
      totalAmount: Number(aggregate._sum.amount || 0),
      totalCash: Number(aggregate._sum.cash || 0),
      totalCheck: Number(aggregate._sum.check || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  3. UPDATE DEPOSIT
// ==============================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { cash, check, date } = req.body;

    const existing = await prisma.deposit.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Recompute amount from cash + check, same as creation, so it can never drift —
    // fields not sent in the request keep their current value.
    const newCash = cash !== undefined ? Number(cash) : Number(existing.cash);
    const newCheck = check !== undefined ? Number(check) : Number(existing.check);

    const deposit = await prisma.deposit.update({
      where: { id: Number(id) },
      data: {
        cash: newCash,
        check: newCheck,
        amount: newCash + newCheck,
        date: date ? new Date(date) : undefined,
      }
    });
    res.json(deposit);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  4. DELETE DEPOSIT
// ==============================
// Deposit has no isActive/deletedAt columns (unlike Employee), so this is a real delete.
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.deposit.findUnique({ where: { id: Number(id) } });
    if (!existing) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    await prisma.deposit.delete({ where: { id: Number(id) } });
    res.json({ message: 'Deposit deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
