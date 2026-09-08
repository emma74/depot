import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { salesOrderService } from '../../services/salesOrderService';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import FormField from '../../components/common/FormField';
import { formatCurrency, formatDate, formatQty } from '../../utils/format';

const STATUS_OPTIONS = ['pending', 'completed', 'cancelled'];

export default function SalesOrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: order, loading, error, reload } = useApi(() => salesOrderService.get(id), [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!order) return null;

  const handleStatusChange = async (e) => {
    await salesOrderService.updateStatus(id, e.target.value);
    reload();
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this sales order? This cannot be undone.')) return;
    try {
      await salesOrderService.remove(id);
      navigate('/sales-orders');
    } catch (err) {
      window.alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Order {order.orderNumber}</h1>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
            <Link to={`/returns/new?salesOrderId=${order.id}`}>
              <Button variant="secondary">Record Return</Button>
            </Link>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </div>
        )}
      </div>

      <div className="detail-section">
        <dl className="detail-grid">
          <div><dt>Date</dt><dd>{formatDate(order.orderDate)}</dd></div>
          <div><dt>Type</dt><dd>{order.orderType}</dd></div>
          <div>
            <dt>Customer / Employee</dt>
            <dd>
              {order.customer?.businessName || order.customer?.contactPerson ||
                (order.employee && `${order.employee.firstName} ${order.employee.lastName}`) || '—'}
            </dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              {isAdmin ? (
                <FormField
                  as="select"
                  name="status"
                  label=""
                  value={order.status}
                  onChange={handleStatusChange}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </FormField>
              ) : (
                <StatusBadge status={order.status} />
              )}
            </dd>
          </div>
        </dl>
      </div>

      <div className="detail-section">
        <h2>Items</h2>
        <DataTable
          columns={[
            { key: 'product', label: 'Product' },
            { key: 'qty', label: 'Qty', render: (row) => formatQty(row.qty) },
            { key: 'unitPrice', label: 'Unit Price', render: (row) => formatCurrency(row.unitPrice) },
            { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
            {
              key: 'returned',
              label: 'Returned',
              render: (row) => formatQty((row.return || []).reduce((s, r) => s + Number(r.qtyReturned), 0)),
            },
          ]}
          rows={order.items}
          emptyMessage="No items on this order."
        />
      </div>

      <div className="detail-section">
        <h2>Payments</h2>
        <DataTable
          columns={[
            { key: 'paymentDate', label: 'Date', render: (row) => formatDate(row.paymentDate) },
            { key: 'amountDue', label: 'Due', render: (row) => formatCurrency(row.amountDue) },
            { key: 'amountPaid', label: 'Paid', render: (row) => formatCurrency(row.amountPaid) },
            { key: 'amountBalance', label: 'Balance', render: (row) => formatCurrency(row.amountBalance) },
          ]}
          rows={order.payments}
          emptyMessage="No payments recorded."
        />
      </div>
    </div>
  );
}
