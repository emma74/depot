import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { supplierService } from '../../services/supplierService';
import DataTable from '../../components/common/DataTable';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatCurrency, formatQty } from '../../utils/format';

export default function SupplierListPage() {
  const { data: suppliers, loading, error, reload } = useApi(supplierService.list);

  const [name, setName] = useState('');
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const resetForm = () => {
    setName('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    try {
      if (editingId) {
        await supplierService.update(editingId, name);
      } else {
        await supplierService.create(name);
      }
      resetForm();
      reload();
    } catch (err) {
      setFormError(err.response?.data?.message || err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setName(row.name);
  };

  return (
    <div>
      <div className="page-header">
        <h1>Suppliers</h1>
      </div>

      <div className="detail-section">
        <h2>{editingId ? 'Rename supplier' : 'Add a supplier'}</h2>
        {formError && <ErrorMessage message={formError} />}
        <form onSubmit={handleSubmit} className="page-filters">
          <FormField label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Add Supplier'}
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
        <DataTable
          columns={[
            { key: 'name', label: 'Supplier' },
            { key: 'totalBalance', label: 'Balance', render: (row) => formatCurrency(row.totalBalance) },
            { key: 'totalEmptiesBalance', label: 'Empties Balance', render: (row) => formatQty(row.totalEmptiesBalance) },
            {
              key: 'actions',
              label: '',
              render: (row) => (
                <Button variant="secondary" onClick={() => handleEdit(row)}>Edit</Button>
              ),
            },
          ]}
          rows={suppliers}
          emptyMessage="No suppliers recorded yet."
        />
      )}
    </div>
  );
}
