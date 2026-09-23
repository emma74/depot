import { useState } from 'react';
import { paymentService } from '../../services/paymentService';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';

function today() {
  return new Date().toISOString().slice(0, 10);
}

// Records a new payment against an order, or edits one specific payment already recorded.
// Pass `orderRef` ({ salesOrderId } or { purchaseOrderId }) to record a new one, or
// `payment` (an existing Payment row) to edit it — never both. Each payment is its own
// entry; editing one never touches any other payment on the same order.
export default function PaymentFormModal({ orderRef, payment, onClose, onSaved }) {
  const isEdit = !!payment;

  const [paymentDate, setPaymentDate] = useState(payment ? payment.paymentDate.slice(0, 10) : today());
  const [amountPaid, setAmountPaid] = useState(payment ? String(payment.amountPaid) : '');
  const [emptiesRec, setEmptiesRec] = useState(payment ? String(payment.emptiesRec ?? '') : '');
  const [checkDate, setCheckDate] = useState(payment?.checkDate ? payment.checkDate.slice(0, 10) : '');
  const [checkNumber, setCheckNumber] = useState(payment ? String(payment.checkNumber ?? '') : '');
  const [loadNumber, setLoadNumber] = useState(payment?.loadNumber ?? '');
  const [carNumber, setCarNumber] = useState(payment?.carNumber ?? '');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const data = {
        paymentDate,
        amountPaid: Number(amountPaid),
        emptiesRec: emptiesRec ? Number(emptiesRec) : 0,
        // null (not undefined) so a cleared field actually clears the stored value
        checkDate: checkDate || null,
        checkNumber: checkNumber ? Number(checkNumber) : null,
        loadNumber: loadNumber || null,
        carNumber: carNumber || null,
      };
      if (isEdit) {
        await paymentService.update(payment.id, data);
      } else {
        await paymentService.create({ ...orderRef, ...data });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={isEdit ? 'Edit payment' : 'Record a payment'} onClose={onClose}>
      {error && <ErrorMessage message={error} />}
      <form onSubmit={handleSubmit}>
        <FormField label="Payment date" name="paymentDate" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
        <FormField label="Amount paid" name="amountPaid" type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} required />
        <FormField label="Empties received" name="emptiesRec" type="number" step="0.001" value={emptiesRec} onChange={(e) => setEmptiesRec(e.target.value)} />
        <FormField label="Check date" name="checkDate" type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
        <FormField label="Check number" name="checkNumber" type="number" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />
        <FormField label="Load number" name="loadNumber" value={loadNumber} onChange={(e) => setLoadNumber(e.target.value)} />
        <FormField label="Car number" name="carNumber" value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
        <div className="form-page__actions">
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Record Payment'}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
