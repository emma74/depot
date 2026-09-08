import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import FormField from '../../components/common/FormField';
import ProductInput from '../../components/common/ProductInput';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';

const emptyItem = { product: '', qty: '', unitPrice: '' };

export default function PurchaseOrderFormPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
      await purchaseOrderService.create({
        invoiceNumber,
        invoiceDate,
        userId: user.id,
        items: items.map((item) => ({
          product: item.product,
          qty: Number(item.qty),
          unitPrice: Number(item.unitPrice),
        })),
      });
      navigate('/purchase-orders');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page">
      <div className="page-header">
        <h1>New Purchase Order</h1>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit}>
        <FormField label="Invoice number" name="invoiceNumber" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
        <FormField label="Invoice date" name="invoiceDate" type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />

        <h2 style={{ fontSize: '1em', margin: '1.5rem 0 0.75rem' }}>Items</h2>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-3)', alignItems: 'flex-start' }}>
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
            {items.length > 1 && (
              <Button type="button" variant="secondary" onClick={() => removeItem(i)} style={{ marginTop: '1.4rem' }}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={addItem}>+ Add item</Button>

        <div className="form-page__actions">
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Create Order'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/purchase-orders')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
