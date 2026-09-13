import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { depositService } from '../../services/depositService';
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

export default function DepositListPage() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data, loading, error, reload } = useApi(
    () => depositService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  const [cash, setCash] = useState('');
  const [check, setCheck] = useState('');
  const [date, setDate] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await depositService.create({ cash, check, date });
      setCash('');
      setCheck('');
      setDate('');
      reload();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deposit?')) return;
    await depositService.remove(id);
    reload();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Deposits</h1>
      </div>

      <div className="page-filters">
        <FormField label="From" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className="detail-section">
        <h2>Record a deposit</h2>
        {formError && <ErrorMessage message={formError} />}
        <form onSubmit={handleSubmit} className="page-filters">
          <FormField label="Cash" name="cash" type="number" step="0.01" value={cash} onChange={(e) => setCash(e.target.value)} required />
          <FormField label="Check" name="check" type="number" step="0.01" value={check} onChange={(e) => setCheck(e.target.value)} />
          <FormField label="Date" name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Add Deposit'}</Button>
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
              <div><dt>Total cash</dt><dd>{formatCurrency(data.totalCash)}</dd></div>
              <div><dt>Total check</dt><dd>{formatCurrency(data.totalCheck)}</dd></div>
            </dl>
          </div>

          <div className="page-filters">
            <DownloadButton
              filename={`deposits_${startDate}_to_${endDate}.csv`}
              rows={data.deposits}
              columns={[
                { key: 'date', label: 'Date', value: (row) => formatDate(row.date) },
                { key: 'cash', label: 'Cash', value: (row) => row.cash },
                { key: 'check', label: 'Check', value: (row) => row.check },
                { key: 'amount', label: 'Total', value: (row) => row.amount },
              ]}
              summary={{ 'Total cash': data.totalCash, 'Total check': data.totalCheck, 'Total': data.totalAmount }}
            />
          </div>

          <DataTable
            columns={[
              { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
              { key: 'cash', label: 'Cash', render: (row) => formatCurrency(row.cash) },
              { key: 'check', label: 'Check', render: (row) => formatCurrency(row.check) },
              { key: 'amount', label: 'Total', render: (row) => formatCurrency(row.amount) },
              {
                key: 'actions',
                label: '',
                render: (row) => (
                  <Button variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
                ),
              },
            ]}
            rows={data.deposits}
            emptyMessage="No deposits recorded in this date range."
          />
        </>
      )}
    </div>
  );
}
