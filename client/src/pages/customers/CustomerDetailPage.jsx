import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { customerService } from '../../services/customerService';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { formatDate } from '../../utils/format';

export default function CustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customer, loading, error } = useApi(() => customerService.get(id), [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!customer) return null;

  const handleDelete = async () => {
    if (!window.confirm('Delete this customer? This cannot be undone.')) return;
    try {
      await customerService.remove(id);
      navigate('/customers');
    } catch (err) {
      window.alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>{customer.businessName || customer.contactPerson}</h1>
        <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
          <Link to={`/customers/${id}/edit`}><Button variant="secondary">Edit</Button></Link>
          <Button variant="danger" onClick={handleDelete}>Delete</Button>
        </div>
      </div>

      <div className="detail-section">
        <dl className="detail-grid">
          <div><dt>Contact person</dt><dd>{customer.contactPerson}</dd></div>
          <div><dt>Phone</dt><dd>{customer.phone || '—'}</dd></div>
          <div><dt>Location</dt><dd>{customer.location}</dd></div>
          <div><dt>Gh Card</dt><dd>{customer.ghCard || '—'}</dd></div>
          <div><dt>Since</dt><dd>{formatDate(customer.date)}</dd></div>
        </dl>
      </div>

      <div className="detail-section">
        <h2>Orders</h2>
        <DataTable
          columns={[
            { key: 'orderNumber', label: 'Order #' },
            { key: 'orderDate', label: 'Date', render: (row) => formatDate(row.orderDate) },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
          rows={customer.orders}
          onRowClick={(row) => `/sales-orders/${row.id}`}
          emptyMessage="No orders yet."
        />
      </div>
    </div>
  );
}
