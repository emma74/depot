import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { expenseService } from '../../services/expenseService';
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

export default function ExpenseListPage() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data: expenses, loading, error, reload } = useApi(
    () => expenseService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  const emptyForm = { autoMaint: '', fuelAndOil: '', salaries: '', homeMaint: '', sundry: '', date: '' };
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingId) {
        await expenseService.update(editingId, form);
      } else {
        await expenseService.create({ ...form, userId: user.id });
      }
      resetForm();
      reload();
    } catch (err) {
      setFormError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setForm({
      autoMaint: row.autoMaint ?? '',
      fuelAndOil: row.fuelAndOil ?? '',
      salaries: row.salaries ?? '',
      homeMaint: row.homeMaint ?? '',
      sundry: row.sundry ?? '',
      date: row.date.slice(0, 10),
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    if (editingId === id) resetForm();
    await expenseService.remove(id);
    reload();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Expenses</h1>
      </div>

      <div className="page-filters">
        <FormField label="From" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className="detail-section">
        <h2>{editingId ? 'Edit expense' : 'Record an expense'}</h2>
        {formError && <ErrorMessage message={formError} />}
        <form onSubmit={handleSubmit} className="page-filters">
          <FormField label="Auto maint." name="autoMaint" type="number" step="0.01" value={form.autoMaint} onChange={(e) => setForm({ ...form, autoMaint: e.target.value })} />
          <FormField label="Fuel & oil" name="fuelAndOil" type="number" step="0.01" value={form.fuelAndOil} onChange={(e) => setForm({ ...form, fuelAndOil: e.target.value })} />
          <FormField label="Salaries" name="salaries" type="number" step="0.01" value={form.salaries} onChange={(e) => setForm({ ...form, salaries: e.target.value })} />
          <FormField label="Home maint." name="homeMaint" type="number" step="0.01" value={form.homeMaint} onChange={(e) => setForm({ ...form, homeMaint: e.target.value })} />
          <FormField label="Sundry" name="sundry" type="number" step="0.01" value={form.sundry} onChange={(e) => setForm({ ...form, sundry: e.target.value })} />
          <FormField label="Date" name="date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Add Expense'}
          </Button>
          {editingId && (
            <Button type="button" variant="secondary" onClick={resetForm}>Cancel</Button>
          )}
        </form>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <div className="page-filters">
            <DownloadButton
              filename={`expenses_${startDate}_to_${endDate}.csv`}
              rows={expenses}
              columns={[
                { key: 'date', label: 'Date', value: (row) => formatDate(row.date) },
                { key: 'autoMaint', label: 'Auto maint.' },
                { key: 'fuelAndOil', label: 'Fuel & oil' },
                { key: 'salaries', label: 'Salaries' },
                { key: 'homeMaint', label: 'Home maint.' },
                { key: 'sundry', label: 'Sundry' },
              ]}
            />
          </div>
          <DataTable
            columns={[
              { key: 'date', label: 'Date', render: (row) => formatDate(row.date) },
              { key: 'autoMaint', label: 'Auto maint.', render: (row) => formatCurrency(row.autoMaint) },
              { key: 'fuelAndOil', label: 'Fuel & oil', render: (row) => formatCurrency(row.fuelAndOil) },
              { key: 'salaries', label: 'Salaries', render: (row) => formatCurrency(row.salaries) },
              { key: 'homeMaint', label: 'Home maint.', render: (row) => formatCurrency(row.homeMaint) },
              { key: 'sundry', label: 'Sundry', render: (row) => formatCurrency(row.sundry) },
              {
                key: 'actions',
                label: '',
                render: (row) => (
                  <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                    <Button variant="secondary" onClick={() => handleEdit(row)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(row.id)}>Delete</Button>
                  </div>
                ),
              },
            ]}
            rows={expenses}
            emptyMessage="No expenses in this date range."
          />
        </>
      )}
    </div>
  );
}
