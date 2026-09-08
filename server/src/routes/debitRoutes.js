import express from 'express';
import prisma from '../prismaClient.js'; 

const router = express.Router();

// ==============================
//  1. ADD DEBIT
// ==============================
router.post('/', async (req, res) => {
  try {
    const { date, description, checkNumber, amount } = req.body;

    // Debits are check payments only — checkNumber is required, never null.
    if (!date || !description || !amount || !checkNumber) {
      return res.status(400).json({
        error: "date, description, checkNumber and amount are required"
      });
    }

    const debit = await prisma.debit.create({
      data: {
        date: new Date(date),
        description,
        checkNumber: Number(checkNumber),
        amount: Number(amount),
      },
    });

    res.status(201).json(debit);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//===========================================
// UPDATE
//===========================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, description, checkNumber, amount } = req.body;

    // Validate ID
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const updatedDebit = await prisma.debit.update({
      where: {
        id: Number(id)
      },
      data: {
        date: date ? new Date(date) : undefined,
        description,
        // Debits are check payments only — never overwrite checkNumber with null just
        // because this PUT didn't include it; leave it untouched instead.
        checkNumber: checkNumber ? Number(checkNumber) : undefined,
        amount: amount ? Number(amount) : undefined
      }
    });

    res.status(200).json(updatedDebit);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//====================================================
// GET DEBITS
//===================================================
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate, description } = req.query;

    const where = {};

    // Date range filter
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [debits, aggregate] = await Promise.all([
      prisma.debit.findMany({ where, orderBy: { date: 'desc' } }),
      prisma.debit.aggregate({ where, _sum: { amount: true } }),
    ]);

    res.status(200).json({
      debits,
      totalAmount: Number(aggregate._sum.amount || 0),
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//==================================================
// DELETE DEBIT
//================================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    // Check if record exists
    const existing = await prisma.debit.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return res.status(404).json({ error: "Debit not found" });
    }

    // Delete record
    await prisma.debit.delete({
      where: { id: Number(id) }
    });

    res.status(200).json({
      message: "Debit deleted successfully"
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

