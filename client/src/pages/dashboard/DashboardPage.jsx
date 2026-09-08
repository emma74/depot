import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { reportService } from '../../services/reportService';
import { salesOrderService } from '../../services/salesOrderService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';
import { formatCurrency, formatQty } from '../../utils/format';

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

function AdminDashboard() {
  const { data, loading, error } = useApi(() =>
    reportService.profitAndLoss({ startDate: firstOfMonth(), endDate: today() })
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="detail-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-4)' }}>
        <h2 style={{ marginBottom: 0 }}>This month at a glance</h2>
        <Link to="/analytics">
          <Button variant="secondary">View Analytics</Button>
        </Link>
      </div>
      <dl className="detail-grid">
        <div><dt>Total Sales</dt><dd>{formatCurrency(data.totalSales)}</dd></div>
        <div><dt>Total Revenue</dt><dd>{formatCurrency(data.totalRevenue)}</dd></div>
        <div><dt>Gross Profit</dt><dd>{formatCurrency(data.grossProfit)}</dd></div>
        <div><dt>Net Profit</dt><dd>{formatCurrency(data.netProfit)}</dd></div>
      </dl>
    </div>
  );
}

function EmployeeDashboard({ userId }) {
  const { data, loading, error } = useApi(() => salesOrderService.userSummary(userId), [userId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="detail-section">
      <h2>Your account</h2>
      <dl className="detail-grid">
        <div><dt>Total Paid</dt><dd>{formatCurrency(data.totalPaid)}</dd></div>
        <div><dt>Balance</dt><dd>{formatCurrency(data.totalBalance)}</dd></div>
        <div><dt>Empties Balance</dt><dd>{formatQty(data.totalEmptiesBalance)}</dd></div>
        <div><dt>Status</dt><dd>{data.status}</dd></div>
      </dl>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>
      {isAdmin ? <AdminDashboard /> : <EmployeeDashboard userId={user.id} />}
    </div>
  );
}
