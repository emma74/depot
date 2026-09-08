import express from 'express';
import prisma from '../prismaClient.js';

const router = express.Router();

// ==============================
//  1. ADD EXPENSE
// ==============================
router.post('/', async (req, res) => {
  try {
    const { autoMaint, fuelAndOil, salaries, homeMaint, sundry, date, userId: userId } = req.body;
    const expense = await prisma.expense.create({
      data: { autoMaint, fuelAndOil, salaries, homeMaint, sundry, date: new Date(date), userId: Number(userId) }
    });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  2. GET ALL EXPENSES with filters
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

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==============================
//  3. UPDATE EXPENSE             
// ==============================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { autoMaint, fuelAndOil, salaries, homeMaint, sundry, date } = req.body;
    const expense = await prisma.expense.update({
      where: { id: Number(id) },
      data: { autoMaint, fuelAndOil, salaries, homeMaint, sundry, date: new Date(date) }
    });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==============================
//  4. DELETE EXPENSE       
// ==============================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expense.delete({
      where: { id: Number(id) },
    });
      res.status(200).json({ message: 'Expense deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
export default router;