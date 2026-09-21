import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { salesOrderService } from '../../services/salesOrderService';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';
import ReturnEditModal from '../../components/returns/ReturnEditModal';
import { formatDate, formatQty } from '../../utils/format';

// Return records aren't exposed via a standalone "list all" endpoint — they come embedded
// on each sales order's items (GET /api/salesorders already scopes orders to the caller for
// non-admins), so we flatten them out here instead of adding a redundant backend route.
function flattenReturns(orders) {
  return (orders || []).flatMap((order) =>
    (order.items || []).flatMap((item) =>
      (item.return || []).map((r) => ({
        ...r,
        orderId: order.id,
        orderNumber: order.orderNumber,
        product: item.product,
      }))
    )
  );
}

export default function ReturnListPage() {
  const { isAdmin } = useAuth();
  const { data: orders, loading, error, reload } = useApi(salesOrderService.list);
  const [editingReturn, setEditingReturn] = useState(null);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  const returns = flattenReturns(orders).sort(
    (a, b) => new Date(b.returnDate) - new Date(a.returnDate)
  );

  return (
    <div>
      <div className="page-header">
        <h1>Returns</h1>
      </div>

      <DataTable
        columns={[
          { key: 'returnDate', label: 'Date', render: (row) => formatDate(row.returnDate) },
          { key: 'orderNumber', label: 'Order #' },
          { key: 'product', label: 'Product' },
          { key: 'qtyReturned', label: 'Qty Returned', render: (row) => formatQty(row.qtyReturned) },
          ...(isAdmin
            ? [
                {
                  key: 'actions',
                  label: '',
                  render: (row) => (
                    <Button
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingReturn(row);
                      }}
                    >
                      Edit
                    </Button>
                  ),
                },
              ]
            : []),
        ]}
        rows={returns}
        onRowClick={(row) => `/sales-orders/${row.orderId}`}
        emptyMessage="No returns recorded."
      />

      {editingReturn && (
        <ReturnEditModal
          ret={editingReturn}
          onClose={() => setEditingReturn(null)}
          onSaved={() => {
            setEditingReturn(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
