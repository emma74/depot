import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import DataTable from '../../components/common/DataTable';
import FormField from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';
import { formatCurrency, formatDate } from '../../utils/format';

function orderTotal(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.amount), 0);
}

export default function PurchaseOrderListPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: orders, loading, error } = useApi(
    () => purchaseOrderService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  return (
    <div>
      <div className="page-header">
        <h1>Purchase Orders</h1>
        <Link to="/purchase-orders/new">
          <Button>+ New Purchase Order</Button>
        </Link>
      </div>

      <div className="page-filters">
        <FormField label="From" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <DataTable
          columns={[
            { key: 'invoiceNumber', label: 'Invoice #' },
            { key: 'invoiceDate', label: 'Date', render: (row) => formatDate(row.invoiceDate) },
            { key: 'user', label: 'Recorded by', render: (row) => row.user?.username || '—' },
            { key: 'total', label: 'Total', render: (row) => formatCurrency(orderTotal(row)) },
          ]}
          rows={orders}
          onRowClick={(row) => `/purchase-orders/${row.id}`}
          emptyMessage="No purchase orders found in this date range."
        />
      )}
    </div>
  );
}
