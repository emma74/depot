import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { salesOrderService } from '../../services/salesOrderService';
import FormField from '../../components/common/FormField';
import ProductInput from '../../components/common/ProductInput';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const emptyItem = { product: '', qty: '', unitPrice: '' };

export default function SalesOrderFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orderNumber, setOrderNumber] = useState('SO-');
  const [orderDate, setOrderDate] = useState('');
  const [orderType, setOrderType] = useState('CUSTOMER');
  const [customerId, setCustomerId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    salesOrderService
      .get(id)
      .then((order) => {
        setOrderNumber(order.orderNumber);
        setOrderDate(order.orderDate.slice(0, 10));
        setOrderType(order.orderType);
        setCustomerId(order.customerId != null ? String(order.customerId) : '');
        setEmployeeId(order.employeeId != null ? String(order.employeeId) : '');
        setItems(
          order.items.map((item) => ({
            id: item.id,
            product: item.product,
            qty: String(item.qty),
            unitPrice: String(item.unitPrice),
            hasReturns: (item.return || []).length > 0,
          }))
        );
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        orderNumber,
        orderDate,
        orderType,
        customerId: orderType === 'CUSTOMER' ? Number(customerId) : undefined,
        employeeId: orderType === 'EMPLOYEE' ? Number(employeeId) : undefined,
        items: items.map((item) => ({
          id: item.id,
          product: item.product,
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
        })),
      };
      if (isEdit) {
        await salesOrderService.update(id, payload);
        navigate(`/sales-orders/${id}`);
      } else {
        await salesOrderService.create({ ...payload, createdById: user.id });
        navigate('/sales-orders');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelPath = isEdit ? `/sales-orders/${id}` : '/sales-orders';

  if (loading) return <LoadingSpinner />;

  return (
    <div className="form-page">
      <div className="page-header">
        <h1>{isEdit ? 'Edit Sales Order' : 'New Sales Order'}</h1>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit}>
        <FormField label="Order number" name="orderNumber" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required />
        <FormField label="Order date" name="orderDate" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} required />
        <FormField as="select" label="Order type" name="orderType" value={orderType} onChange={(e) => setOrderType(e.target.value)}>
          <option value="CUSTOMER">Customer</option>
          <option value="EMPLOYEE">Employee</option>
        </FormField>

        {orderType === 'CUSTOMER' ? (
          <FormField label="Customer ID" name="customerId" type="number" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required />
        ) : (
          <FormField label="Employee ID" name="employeeId" type="number" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} required />
        )}

        <h2 style={{ fontSize: '1em', margin: '1.5rem 0 0.75rem' }}>Items</h2>
        {items.map((item, i) => (
          <div key={item.id ?? `new-${i}`} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-3)', alignItems: 'flex-start' }}>
            <ProductInput
              label="Product"
              name={`product-${i}`}
              value={item.product}
              onChange={(e) => updateItem(i, 'product', e.target.value)}
              hint="Pick from the list or type your own"
              required
            />
            <FormField label="Qty" name={`qty-${i}`} type="number" step="0.001" value={item.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} required />
            <FormField label="Unit Price" name={`unitPrice-${i}`} type="number" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} required />
            {items.length > 1 && !item.hasReturns && (
              <Button type="button" variant="secondary" onClick={() => removeItem(i)} style={{ marginTop: '1.4rem' }}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addItem}>+ Add item</Button>

        <div className="form-page__actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Order'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate(cancelPath)}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
