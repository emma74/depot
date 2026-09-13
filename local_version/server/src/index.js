// src/index.js
import 'dotenv/config';  // ensures DATABASE_URL is loaded before anything else
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js'
import userRoutes from './routes/userRoutes.js'
import saleRoutes from './routes/salesRoutes.js'
import returnRoutes from './routes/returnRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import purchaseRoutes from './routes/purchaseRoutes.js' 
import depositRoutes from './routes/depositRoutes.js'
import otherIncomeRoutes from './routes/otherIncomeRoutes.js';
import expensesRoutes from './routes/expensesRoutes.js';
import profitandlossRoutes from './routes/profitandlossRoutes.js';
import targetRoutes from './routes/targetRoutes.js';
import prodtotalRoutes from './routes/prodtotalRoutes.js';
import debitRoutes from './routes/debitRoutes.js';
import { authMiddleware, requireAdmin, requireAdminForWrite } from './middleware/authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/api/customers', authMiddleware, requireAdmin, customerRoutes);
app.use('/api/users', authMiddleware, userRoutes )
app.use('/api/employees', authMiddleware, requireAdminForWrite, employeeRoutes);
app.use('/api/salesorders', authMiddleware, requireAdminForWrite, saleRoutes)
app.use('/api/returns', authMiddleware, requireAdminForWrite, returnRoutes)
app.use('/api/payments', authMiddleware, requireAdmin, paymentRoutes)
app.use('/api/purchases', authMiddleware, requireAdmin, purchaseRoutes)
app.use('/api/deposits', authMiddleware, requireAdmin, depositRoutes)
app.use('/api/other-incomes', authMiddleware, requireAdmin, otherIncomeRoutes)
app.use('/api/expenses', authMiddleware, requireAdmin, expensesRoutes)
app.use('/api/profit-and-loss', authMiddleware, requireAdmin, profitandlossRoutes)
app.use('/api/target', authMiddleware, requireAdmin, targetRoutes)
app.use('/api/product-total', authMiddleware, requireAdmin, prodtotalRoutes)
app.use('/api/checkdebit', authMiddleware, requireAdmin, debitRoutes)
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
