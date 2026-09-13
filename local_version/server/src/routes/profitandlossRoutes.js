import express from 'express';
import prisma from '../prismaClient.js'; 

const router = express.Router();

// ============================================================================
//  1. GET PROFIT AND LOSS (use aggregate queries, db does the calculations)
// ============================================================================
router.get('/', async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
  
      if (!startDate || !endDate) {
        return res.status(400).json({ error: "startDate and endDate required" });
      }
  
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
  
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
  
      const [
        salesAgg,
        incomeAgg,
        expenseAgg,
        cogsAgg
      ] = await Promise.all([
        prisma.salesOrderItem.aggregate({
          _sum: { amount: true },
          where: {
            salesOrder: {
              orderDate: { gte: start, lte: end }
            }
          }
        }),

        prisma.otherIncome.aggregate({
          _sum: { amount: true },
          where: {
            incomeDate: { gte: start, lte: end }
          }
        }),

        prisma.expense.aggregate({
          _sum: { autoMaint: true, fuelAndOil: true, salaries: true, homeMaint: true, sundry: true },
          where: {
            date: { gte: start, lte: end }
          }
        }),
  
        prisma.purchaseOrderItem.aggregate({
          _sum: { amount: true },
          where: {
            purchaseOrder: {
              invoiceDate: { gte: start, lte: end }
            }
          }
        })
      ]);
  
      const totalSales = Number(salesAgg._sum.amount || 0);
      const totalOtherIncome = Number(incomeAgg._sum.amount || 0);
      const totalExpenses =
        Number(expenseAgg._sum.autoMaint || 0) +
        Number(expenseAgg._sum.fuelAndOil || 0) +
        Number(expenseAgg._sum.salaries || 0) +
        Number(expenseAgg._sum.homeMaint || 0) +
        Number(expenseAgg._sum.sundry || 0);
      const totalCOGS = Number(cogsAgg._sum.amount || 0);
  
      const totalRevenue = totalSales + totalOtherIncome;
      const grossProfit = totalRevenue - totalCOGS;
      const netProfit = grossProfit - totalExpenses;
  
      res.json({
        totalSales,
        totalOtherIncome,
        totalRevenue,
        totalCOGS,
        grossProfit,
        totalExpenses,
        netProfit
      });
  
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

export default router;