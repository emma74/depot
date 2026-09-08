import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { otherIncomeService } from '../../services/otherIncomeService';
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

export default function OtherIncomeListPage() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data, loading, error, reload } = useApi(
    () => otherIncomeService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      await otherIncomeService.create({ description, amount, incomeDate, userId: user.id });
      setDescription('');
      setAmount('');
      setIncomeDate('');
      reload();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income entry?')) return;
    await otherIncomeService.remove(id);
    reload();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Other Income</h1>
      </div>

      <div className="page-filters">
        <FormField label="From" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className="detail-section">
        <h2>Record other income</h2>
        {formError && <ErrorMessage message={formError} />}
        <form onSubmit={handleSubmit} className="page-filters">
          <FormField label="Description" name="description" value={description} onChange={(e) => setDescription(e.target.value)} required />
          <FormField label="Amount" name="amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          <FormField label="Date" name="incomeDate" type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} required />
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Add Income'}</Button>
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
              filename={`other-income_${startDate}_to_${endDate}.csv`}
              rows={data.income}
              columns={[
                { key: 'incomeDate', label: 'Date', value: (row) => formatDate(row.incomeDate) },
                { key: 'description', label: 'Description' },
                { key: 'amount', label: 'Amount' },
              ]}
              summary={{ Total: data.totalAmount }}
            />
          </div>

          <DataTable
            columns={[
              { key: 'incomeDate', label: 'Date', render: (row) => formatDate(row.incomeDate) },
              { key: 'description', label: 'Description' },
              { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
              { key: 'actions', label: '', render: (row) => <Button variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button> },
            ]}
            rows={data.income}
            emptyMessage="No other income recorded in this date range."
          />
        </>
      )}
    </div>
  );
}
