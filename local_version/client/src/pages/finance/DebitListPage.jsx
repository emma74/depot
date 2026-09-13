import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { debitService } from '../../services/debitService';
import DataTable from '../../components/common/DataTable';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import DownloadButton from '../../components/common/DownloadButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatCurrency, formatDate } from '../../utils/format';

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function DebitListPage() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data, loading, error, reload } = useApi(
    () => debitService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await debitService.create({ date, description, checkNumber, amount });
      setDate('');
      setDescription('');
      setCheckNumber('');
      setAmount('');
      reload();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this debit?')) return;
    await debitService.remove(id);
    reload();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Check Debits</h1>
      </div>

      <div className="page-filters">
        <FormField label="From" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className="detail-section">
        <h2>Record a debit</h2>
        {formError && <ErrorMessage message={formError} />}
        <form onSubmit={handleSubmit} className="page-filters">
          <FormField label="Date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <FormField label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <FormField label="Check number" name="checkNumber" type="number" value={checkNumber} onChange={(e) => setCheckNumber(e.target.value)} required />
          <FormField label="Amount" name="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Add Debit'}</Button>
        </form>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <div className="detail-section">
            <dl className="detail-grid">
              <div><dt>Total</dt><dd>{formatCurrency(data.totalAmount)}</dd></div>
            </dl>
          </div>

          <div className="page-filters">
            <DownloadButton
              filename={`debits_${startDate}_to_${endDate}.csv`}
              rows={data.debits}
              columns={[
                { key: 'date', label: 'Date', value: (row) => formatDate(row.date) },
                { key: 'description', label: 'Description' },
                { key: 'checkNumber', label: 'Check #' },
                { key: 'amount', label: 'Amount' },
              ]}
              summary={{ Total: data.totalAmount }}
            />
          </div>

          <DataTable
            columns={[
              { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
              { key: 'description', label: 'Description' },
              { key: 'checkNumber', label: 'Check #', render: (row) => row.checkNumber ?? '—' },
              { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
              { key: 'actions', label: '', render: (row) => <Button variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button> },
            ]}
            rows={data.debits}
            emptyMessage="No debits recorded in this date range."
          />
        </>
      )}
    </div>
  );
}
