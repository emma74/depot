import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { salesOrderService } from '../../services/salesOrderService';
import DataTable from '../../components/common/DataTable';
import FormField from '../../components/common/FormField';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/format';

function orderTotal(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.amount), 0);
}

export default function SalesOrderListPage() {
  const { isAdmin } = useAuth();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: orders, loading, error } = useApi(
    () => salesOrderService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  return (
    <div>
      <div className="page-header">
        <h1>Sales Orders</h1>
        {isAdmin && (
          <Link to="/sales-orders/new">
            <Button>+ New Sales Order</Button>
          </Link>
        )}
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
            { key: 'orderNumber', label: 'Order #' },
            { key: 'orderDate', label: 'Date', render: (row) => formatDate(row.orderDate) },
            { key: 'orderType', label: 'Type' },
            {
              key: 'party',
              label: 'Customer / Employee',
              render: (row) =>
                row.customer?.businessName || row.customer?.contactPerson ||
                (row.employee && `${row.employee.firstName} ${row.employee.lastName}`) || '—',
            },
            { key: 'total', label: 'Total', render: (row) => formatCurrency(orderTotal(row)) },
            { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          ]}
          rows={orders}
          onRowClick={(row) => `/sales-orders/${row.id}`}
          emptyMessage="No sales orders found in this date range."
        />
      )}
    </div>
  );
}
