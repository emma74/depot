import { useState } from 'react';
import { paymentService } from '../../services/paymentService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import DataTable from '../../components/common/DataTable';
import { formatCurrency, formatDate } from '../../utils/format';

export default function PaymentListPage() {
  // --- Look up a user's payment history ---
  const [lookupUserId, setLookupUserId] = useState('');
  const [payments, setPayments] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupLoading(true);
    setLookupError(null);
    try {
      const result = await paymentService.userSummary(lookupUserId);
      setPayments(Array.isArray(result) ? result : []);
    } catch (err) {
      setLookupError(err.response?.data?.error || err.message);
    } finally {
      setLookupLoading(false);
    }
  };

  // --- Reconcile a payment against an order ---
  const [orderKind, setOrderKind] = useState('salesOrderId');
  const [orderId, setOrderId] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [emptiesRec, setEmptiesRec] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [loadNumber, setLoadNumber] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [reconcileError, setReconcileError] = useState(null);
  const [reconcileResult, setReconcileResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleReconcile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setReconcileError(null);
    setReconcileResult(null);
    try {
      const result = await paymentService.update({
        [orderKind]: Number(orderId),
        amountPaid: Number(amountPaid),
        emptiesRec: emptiesRec ? Number(emptiesRec) : 0,
        checkNumber: checkNumber ? Number(checkNumber) : undefined,
        loadNumber: loadNumber || undefined,
        carNumber: carNumber || undefined,
      });
      setReconcileResult(result.message || 'Payment updated.');
    } catch (err) {
      setReconcileError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Payments</h1>
      </div>

      <div className="detail-section">
        <h2>Reconcile a payment</h2>
        {reconcileError && <ErrorMessage message={reconcileError} />}
        {reconcileResult && <p style={{ color: 'var(--color-success)' }}>{reconcileResult}</p>}
        <form onSubmit={handleReconcile}>
          <FormField as="select" label="Order type" name="orderKind" value={orderKind} onChange={(e) => setOrderKind(e.target.value)}>
            <option value="salesOrderId">Sales Order</option>
            <option value="purchaseOrderId">Purchase Order</option>
          </FormField>
          <FormField label="Order ID" name="orderId" type="number" value={orderId} onChange={(e) => setOrderId(e.target.value)} required />
          <FormField label="Amount paid" name="amountPaid" type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} required />
          <FormField label="Empties received" name="emptiesRec" type="number" step="0.001" value={emptiesRec} onChange={(e) => setEmptiesRec(e.target.value)} />
          <FormField label="Check number" name="checkNumber" type="number" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />
          <FormField label="Load number" name="loadNumber" value={loadNumber} onChange={(e) => setLoadNumber(e.target.value)} />
          <FormField label="Car number" name="carNumber" value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Reconcile Payment'}</Button>
        </form>
      </div>

      <div className="detail-section">
        <h2>User payment history</h2>
        <form onSubmit={handleLookup} className="page-filters">
          <FormField label="User ID" name="lookupUserId" type="number" value={lookupUserId} onChange={(e) => setLookupUserId(e.target.value)} required />
          <Button type="submit" disabled={lookupLoading}>{lookupLoading ? 'Loading…' : 'Look up'}</Button>
        </form>
        {lookupError && <ErrorMessage message={lookupError} />}
        {payments && (
          <DataTable
            columns={[
              { key: 'paymentDate', label: 'Date', render: (row) => formatDate(row.paymentDate) },
              { key: 'amountDue', label: 'Due', render: (row) => formatCurrency(row.amountDue) },
              { key: 'amountPaid', label: 'Paid', render: (row) => formatCurrency(row.amountPaid) },
              { key: 'amountBalance', label: 'Balance', render: (row) => formatCurrency(row.amountBalance) },
            ]}
            rows={payments}
            emptyMessage="No payments found for this user."
          />
        )}
      </div>
    </div>
  );
}
