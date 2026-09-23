import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';
import PaymentFormModal from '../../components/payments/PaymentFormModal';
import { formatCurrency, formatDate, formatQty } from '../../utils/format';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams();
  const { data: order, loading, error, reload } = useApi(() => purchaseOrderService.get(id), [id]);
  const [addingPayment, setAddingPayment] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!order) return null;

  return (
    <div>
      <div className="page-header">
        <h1>Invoice {order.invoiceNumber}</h1>
        <Link to={`/purchase-orders/${order.id}/edit`}>
          <Button variant="secondary">Edit</Button>
        </Link>
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
        <div className="page-header">
          <h2>Payments</h2>
          <Button variant="secondary" onClick={() => setAddingPayment(true)}>+ Add Payment</Button>
        </div>
        <DataTable
          columns={[
            { key: 'paymentDate', label: 'Date', render: (row) => formatDate(row.paymentDate) },
            { key: 'amountDue', label: 'Due', render: (row) => formatCurrency(row.amountDue) },
            { key: 'amountPaid', label: 'Paid', render: (row) => formatCurrency(row.amountPaid) },
            { key: 'amountBalance', label: 'Balance', render: (row) => formatCurrency(row.amountBalance) },
            {
              key: 'actions',
              label: '',
              render: (row) => (
                <Button variant="secondary" onClick={() => setEditingPayment(row)}>Edit</Button>
              ),
            },
          ]}
          rows={order.payments}
          emptyMessage="No payments recorded."
        />
      </div>

      {addingPayment && (
        <PaymentFormModal
          orderRef={{ purchaseOrderId: order.id }}
          onClose={() => setAddingPayment(false)}
          onSaved={() => {
            setAddingPayment(false);
            reload();
          }}
        />
      )}
      {editingPayment && (
        <PaymentFormModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSaved={() => {
            setEditingPayment(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
