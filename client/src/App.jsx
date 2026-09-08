import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import RequireAdmin from './components/common/RequireAdmin';
import AppLayout from './components/layout/AppLayout';

import LandingPage from './pages/landing/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';

import EmployeeListPage from './pages/employees/EmployeeListPage';
import EmployeeFormPage from './pages/employees/EmployeeFormPage';

import SalesOrderListPage from './pages/sales/SalesOrderListPage';
import SalesOrderDetailPage from './pages/sales/SalesOrderDetailPage';
import SalesOrderFormPage from './pages/sales/SalesOrderFormPage';

import ReturnListPage from './pages/returns/ReturnListPage';
import ReturnFormPage from './pages/returns/ReturnFormPage';

import CustomerListPage from './pages/customers/CustomerListPage';
import CustomerDetailPage from './pages/customers/CustomerDetailPage';
import CustomerFormPage from './pages/customers/CustomerFormPage';

import PurchaseOrderListPage from './pages/purchases/PurchaseOrderListPage';
import PurchaseOrderDetailPage from './pages/purchases/PurchaseOrderDetailPage';
import PurchaseOrderFormPage from './pages/purchases/PurchaseOrderFormPage';

import PaymentListPage from './pages/payments/PaymentListPage';

import UserAdminPage from './pages/admin/UserAdminPage';
import AnalyticsDashboardPage from './pages/admin/AnalyticsDashboardPage';

import DepositListPage from './pages/finance/DepositListPage';
import ExpenseListPage from './pages/finance/ExpenseListPage';
import OtherIncomeListPage from './pages/finance/OtherIncomeListPage';
import DebitListPage from './pages/finance/DebitListPage';
import ProfitAndLossPage from './pages/finance/ProfitAndLossPage';
import TargetsPage from './pages/finance/TargetsPage';
import ProductTotalPage from './pages/finance/ProductTotalPage';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="dashboard" element={<DashboardPage />} />

                {/* Shared-read: every authenticated user, scoped server-side for non-admins */}
                <Route path="employees" element={<EmployeeListPage />} />
                <Route path="sales-orders" element={<SalesOrderListPage />} />
                <Route path="sales-orders/:id" element={<SalesOrderDetailPage />} />
                <Route path="returns" element={<ReturnListPage />} />

                {/* Admin-only */}
                <Route element={<RequireAdmin />}>
                  <Route path="employees/new" element={<EmployeeFormPage />} />
                  <Route path="employees/:id/edit" element={<EmployeeFormPage />} />

                  <Route path="sales-orders/new" element={<SalesOrderFormPage />} />

                  <Route path="returns/new" element={<ReturnFormPage />} />

                  <Route path="customers" element={<CustomerListPage />} />
                  <Route path="customers/new" element={<CustomerFormPage />} />
                  <Route path="customers/:id" element={<CustomerDetailPage />} />
                  <Route path="customers/:id/edit" element={<CustomerFormPage />} />

                  <Route path="purchase-orders" element={<PurchaseOrderListPage />} />
                  <Route path="purchase-orders/new" element={<PurchaseOrderFormPage />} />
                  <Route path="purchase-orders/:id" element={<PurchaseOrderDetailPage />} />

                  <Route path="payments" element={<PaymentListPage />} />

                  <Route path="admin/users" element={<UserAdminPage />} />
                  <Route path="analytics" element={<AnalyticsDashboardPage />} />

                  <Route path="finance/deposits" element={<DepositListPage />} />
                  <Route path="finance/expenses" element={<ExpenseListPage />} />
                  <Route path="finance/other-income" element={<OtherIncomeListPage />} />
                  <Route path="finance/debits" element={<DebitListPage />} />
                  <Route path="finance/profit-and-loss" element={<ProfitAndLossPage />} />
                  <Route path="finance/targets" element={<TargetsPage />} />
                  <Route path="finance/product-totals" element={<ProductTotalPage />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
