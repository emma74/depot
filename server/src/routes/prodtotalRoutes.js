import express from 'express';
import prisma from '../prismaClient.js';

const router = express.Router();

// ==============================
//  1. GET PRODUCT TOTAL
// ==============================
router.get('/total-products', async (req, res) => {
  try {
    const { type, startDate, endDate, product, userId } = req.query;

    if (!type || !startDate || !endDate || !product) {
      return res.status(400).json({
        error: "type, startDate, endDate, and product are required"
      });
    }

    // Validate type (allowed values: purchase, sales)
    if (!['purchase', 'sales'].includes(type)) {
      return res.status(400).json({
        error: "type must be 'purchase' or 'sales'"
      });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    // Purchase and sales orders don't share field names (invoiceDate/userId vs.
    // orderDate/employee.userId), so each type gets its own query rather than
    // forcing them through one shared shape.
    let result;
    if (type === 'purchase') {
      result = await prisma.purchaseOrderItem.aggregate({
        _sum: { qty: true },
        where: {
          product,
          purchaseOrder: {
            invoiceDate: { gte: start, lte: end },
            ...(userId && { userId: Number(userId) }),
          },
        },
      });
    } else {
      result = await prisma.salesOrderItem.aggregate({
        _sum: { qty: true },
        where: {
          product,
          salesOrder: {
            orderDate: { gte: start, lte: end },
            // Tied to the employee the invoice was actually issued to, not whoever
            // recorded the order (createdById) — sales orders route through Employee.
            ...(userId && { employee: { userId: Number(userId) } }),
          },
        },
      });
    }

    const totalQty = Number(result._sum.qty || 0);

    res.json({
      type,
      product,
      totalQty
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
