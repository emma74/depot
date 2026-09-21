import { useState } from 'react';
import { paymentService } from '../../services/paymentService';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';

// Edits what has been paid/received against an order's payment. `payment` is a Payment row
// (it carries salesOrderId or purchaseOrderId); amount due is recomputed by the server.
export default function PaymentEditModal({ payment, onClose, onSaved }) {
  const [amountPaid, setAmountPaid] = useState(String(payment.amountPaid ?? ''));
  const [emptiesRec, setEmptiesRec] = useState(String(payment.emptiesRec ?? ''));
  const [checkDate, setCheckDate] = useState(payment.checkDate ? payment.checkDate.slice(0, 10) : '');
  const [checkNumber, setCheckNumber] = useState(String(payment.checkNumber ?? ''));
  const [loadNumber, setLoadNumber] = useState(payment.loadNumber ?? '');
  const [carNumber, setCarNumber] = useState(payment.carNumber ?? '');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await paymentService.update({
        ...(payment.salesOrderId
          ? { salesOrderId: payment.salesOrderId }
          : { purchaseOrderId: payment.purchaseOrderId }),
        amountPaid: Number(amountPaid),
        emptiesRec: emptiesRec ? Number(emptiesRec) : 0,
        // null (not undefined) so a cleared field actually clears the stored value
        checkDate: checkDate || null,
        checkNumber: checkNumber ? Number(checkNumber) : null,
        loadNumber: loadNumber || null,
        carNumber: carNumber || null,
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title="Edit payment" onClose={onClose}>
      {error && <ErrorMessage message={error} />}
      <form onSubmit={handleSubmit}>
        <FormField label="Amount paid" name="amountPaid" type="number" step="0.01" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} required />
        <FormField label="Empties received" name="emptiesRec" type="number" step="0.001" value={emptiesRec} onChange={(e) => setEmptiesRec(e.target.value)} />
        <FormField label="Check date" name="checkDate" type="date" value={checkDate} onChange={(e) => setCheckDate(e.target.value)} />
        <FormField label="Check number" name="checkNumber" type="number" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} />
        <FormField label="Load number" name="loadNumber" value={loadNumber} onChange={(e) => setLoadNumber(e.target.value)} />
        <FormField label="Car number" name="carNumber" value={carNumber} onChange={(e) => setCarNumber(e.target.value)} />
        <div className="form-page__actions">
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
