import { useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatCurrency, formatDate, formatQty } from '../../utils/format';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const { data: order, loading, error } = useApi(() => purchaseOrderService.get(id), [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!order) return null;

  return (
    <div>
      <div className="page-header">
        <h1>Invoice {order.invoiceNumber}</h1>
      </div>

      <div className="detail-section">
        <dl className="detail-grid">
          <div><dt>Date</dt><dd>{formatDate(order.invoiceDate)}</dd></div>
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
