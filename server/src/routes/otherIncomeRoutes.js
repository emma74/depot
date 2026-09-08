import express from 'express';
import prisma from '../prismaClient.js';

const router = express.Router();

// ==============================
//  1. ADD OTHER INCOME
// ==============================
router.post('/', async (req, res) => {
  try {
    const { description, amount, incomeDate, userId } = req.body;
    const otherIncome = await prisma.otherIncome.create({
      data: { 
        description, 
        amount, 
        incomeDate: new Date(incomeDate), 
        userId: Number(userId) 
      }
    });
    res.status(201).json(otherIncome);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  2. GET ALL OTHER INCOMES with filters
// ==============================
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {
      incomeDate: (startDate || endDate)
        ? {
            ...(startDate && { gte: new Date(startDate) }),
            ...(endDate && { lte: new Date(endDate) }),
          }
        : undefined,
    };

    const [income, aggregate] = await Promise.all([
      prisma.otherIncome.findMany({ where, orderBy: { incomeDate: 'desc' } }),
      prisma.otherIncome.aggregate({ where, _sum: { amount: true } }),
    ]);

    res.json({
      income,
      totalAmount: Number(aggregate._sum.amount || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ==============================
//  3. UPDATE OTHER INCOME
// ==============================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { description, amount, incomeDate } = req.body;
    const income = await prisma.otherIncome.update({
      where: { id: Number(id) },
      data: { description, amount, incomeDate: new Date(incomeDate) }
    });
    res.status(200).json(income);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  4. DELETE OTHER INCOME
// ==============================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.otherIncome.delete({
      where: { id: Number(id) },
    });
    res.status(200).json({ message: 'Other income deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;