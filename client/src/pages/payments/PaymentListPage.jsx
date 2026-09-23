import { useState } from 'react';
import { paymentService } from '../../services/paymentService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import DataTable from '../../components/common/DataTable';
import PaymentFormModal from '../../components/payments/PaymentFormModal';
import { formatCurrency, formatDate } from '../../utils/format';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function PaymentListPage() {
  // --- Look up a user's payment history ---
  const [lookupUserId, setLookupUserId] = useState('');
  const [payments, setPayments] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [editingPayment, setEditingPayment] = useState(null);

  const runLookup = async () => {
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

  const handleLookup = (e) => {
    e.preventDefault();
    runLookup();
  };

  // --- Record a new payment against an order ---
  const [orderKind, setOrderKind] = useState('salesOrderId');
  const [orderId, setOrderId] = useState('');
  const [paymentDate, setPaymentDate] = useState(today());
  const [amountPaid, setAmountPaid] = useState('');
  const [emptiesRec, setEmptiesRec] = useState('');
  const [checkDate, setCheckDate] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [loadNumber, setLoadNumber] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [recordError, setRecordError] = useState(null);
  const [recordResult, setRecordResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const resetRecordForm = () => {
    setOrderId('');
    setPaymentDate(today());
    setAmountPaid('');
    setEmptiesRec('');
    setCheckDate('');
    setCheckNumber('');
    setLoadNumber('');
    setCarNumber('');
  };

  const handleRecord = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setRecordError(null);
    setRecordResult(null);
    try {
      await paymentService.create({
        [orderKind]: Number(orderId),
        paymentDate,
        amountPaid: Number(amountPaid),
        emptiesRec: emptiesRec ? Number(emptiesRec) : 0,
        checkDate: checkDate || null,
        checkNumber: checkNumber ? Number(checkNumber) : null,
        loadNumber: loadNumber || null,
        carNumber: carNumber || null,
      });
      setRecordResult('Payment recorded.');
      resetRecordForm();
      if (payments) runLookup();
    } catch (err) {
      setRecordError(err.response?.data?.error || err.response?.data?.message || err.message);
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
        <h2>Record a payment</h2>
        {recordError && <ErrorMessage message={recordError} />}
        {recordResult && <p style={{ color: 'var(--color-success)' }}>{recordResult}</p>}
        <form onSubmit={handleRecord}>
          <FormField as="select" label="Order type" name="orderKind" value={orderKind} onChange={(e) => setOrderKind(e.target.value)}>
            <option value="salesOrderId">Sales Order</option>
            <option value="purchaseOrderId">Purchase Order</option>
          </FormField>
          <FormField label="Order ID" name="orderId" type="number" value={orderId} onChange={(e) => setOrderId(e.target.value)} required />
          <FormField label="Payment date" name="paymentDate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
          <FormField label="Amount paid" name="amountPaid" type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} required />
          <FormField label="Empties received" name="emptiesRec" type="number" step="0.001" value={emptiesRec} onChange={(e) => setEmptiesRec(e.target.value)} />
          <FormField label="Check date" name="checkDate" type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
          <FormField label="Check number" name="checkNumber" type="number" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />
          <FormField label="Load number" name="loadNumber" value={loadNumber} onChange={(e) => setLoadNumber(e.target.value)} />
          <FormField label="Car number" name="carNumber" value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Record Payment'}</Button>
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
              {
                key: 'order',
                label: 'Order',
                render: (row) =>
                  row.salesOrderId ? `Sales #${row.salesOrderId}` : `Purchase #${row.purchaseOrderId}`,
              },
              {
                key: 'actions',
                label: '',
                render: (row) => (
                  <Button variant="secondary" onClick={() => setEditingPayment(row)}>Edit</Button>
                ),
              },
            ]}
            rows={payments}
            emptyMessage="No payments found for this user."
          />
        )}
      </div>

      {editingPayment && (
        <PaymentFormModal
          payment={editingPayment}
          onClose={() => setEditingPayment(null)}
          onSaved={() => {
            setEditingPayment(null);
            runLookup();
          }}
        />
      )}
    </div>
  );
}
