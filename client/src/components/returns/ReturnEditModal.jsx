import { useState } from 'react';
import { returnService } from '../../services/returnService';
import Modal from '../common/Modal';
import FormField from '../common/FormField';
import Button from '../common/Button';
import ErrorMessage from '../common/ErrorMessage';

// `ret` is a return row flattened with its order context (orderNumber, product).
export default function ReturnEditModal({ ret, onClose, onSaved }) {
  const [qtyReturned, setQtyReturned] = useState(String(ret.qtyReturned));
  const [returnDate, setReturnDate] = useState(ret.returnDate.slice(0, 10));
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await returnService.update(ret.id, { qtyReturned: Number(qtyReturned), returnDate });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal title={`Edit return — ${ret.product}, order ${ret.orderNumber}`} onClose={onClose}>
      {error && <ErrorMessage message={error} />}
      <form onSubmit={handleSubmit}>
        <FormField
          label="Quantity returned"
          name="qtyReturned"
          type="number"
          step="0.001"
          value={qtyReturned}
          onChange={(e) => setQtyReturned(e.target.value)}
          required
        />
        <FormField label="Return date" name="returnDate" type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} required />
        <div className="form-page__actions">
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save Changes'}</Button>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
