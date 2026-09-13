import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { salesOrderService } from '../../services/salesOrderService';
import { returnService } from '../../services/returnService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function ReturnFormPage() {
  const [searchParams] = useSearchParams();
  const salesOrderId = searchParams.get('salesOrderId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: order, loading, error: loadError } = useApi(
    () => salesOrderService.get(salesOrderId),
    [salesOrderId]
  );

  const [salesOrderItemId, setSalesOrderItemId] = useState('');
  const [qtyReturned, setQtyReturned] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!salesOrderId) return <ErrorMessage message="Missing salesOrderId — open this page from a sales order." />;
  if (loading) return <LoadingSpinner />;
  if (loadError) return <ErrorMessage message={loadError} />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await returnService.create(salesOrderId, {
        salesOrderItemId: Number(salesOrderItemId),
        qtyReturned: Number(qtyReturned),
        userId: user.id,
      });
      navigate(`/sales-orders/${salesOrderId}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page">
      <div className="page-header">
        <h1>Record Return — Order {order?.orderNumber}</h1>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit}>
        <FormField
          as="select"
          label="Item"
          name="salesOrderItemId"
          value={salesOrderItemId}
          onChange={(e) => setSalesOrderItemId(e.target.value)}
          required
        >
          <option value="" disabled>Select an item…</option>
          {order.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.product} — qty {String(item.qty)}
            </option>
          ))}
        </FormField>

        <FormField
          label="Quantity returned"
          name="qtyReturned"
          type="number"
          step="0.001"
          value={qtyReturned}
          onChange={(e) => setQtyReturned(e.target.value)}
          required
        />

        <div className="form-page__actions">
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Record Return'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate(`/sales-orders/${salesOrderId}`)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
