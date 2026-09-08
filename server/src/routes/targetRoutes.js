import express from 'express';
import prisma from '../prismaClient.js'; 

const router = express.Router();

// ==============================
//  1. GET TARGET PROGRESS
// ==============================
router.get('/', async (req, res) => {
    try {
      const { startDate, endDate, targetValue } = req.query;
  
      if (!startDate || !endDate || !targetValue) {
        return res.status(400).json({
          error: "startDate, endDate and targetValue required"
        });
      }
  
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
  
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
  
      const result = await prisma.purchaseOrderItem.aggregate({
        _sum: { qty: true },
        where: {
          purchaseOrder: {
            invoiceDate: { gte: start, lte: end }
          }
        }
      });
  
      const totalQty = Number(result._sum.qty || 0);
      const target = Number(targetValue);
  
      const progress = target
        ? (totalQty / target) * 100
        : 0;
  
      res.json({
        totalQty,
        target,
        progress: Number(progress.toFixed(2))
      });
  
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

export default router;