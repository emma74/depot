import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { customerService } from '../../services/customerService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';

const emptyForm = {
  businessName: '',
  contactPerson: '',
  phone: '',
  ghCard: '',
  location: '',
  date: '',
  userId: '',
};

export default function CustomerFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    customerService
      .get(id)
      .then((customer) =>
        setForm({ ...emptyForm, ...customer, date: customer.date ? customer.date.slice(0, 10) : '' })
      )
      .catch((err) => setError(err.response?.data?.error || err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = { ...form, userId: form.userId ? Number(form.userId) : undefined };
      if (isEdit) {
        await customerService.update(id, payload);
      } else {
        await customerService.create(payload);
      }
      navigate('/customers');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="form-page">
      <div className="page-header">
        <h1>{isEdit ? 'Edit Customer' : 'New Customer'}</h1>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit}>
        <FormField label="Business name" name="businessName" value={form.businessName || ''} onChange={handleChange} />
        <FormField label="Contact person" name="contactPerson" value={form.contactPerson} onChange={handleChange} required />
        <FormField label="Phone" name="phone" value={form.phone || ''} onChange={handleChange} />
        <FormField label="Gh Card" name="ghCard" value={form.ghCard || ''} onChange={handleChange} />
        <FormField label="Location" name="location" value={form.location} onChange={handleChange} required />
        <FormField label="Date" name="date" type="date" value={form.date} onChange={handleChange} required />
        {!isEdit && (
          <FormField
            label="Linked User ID"
            name="userId"
            type="number"
            value={form.userId}
            onChange={handleChange}
            required
            hint="The user account (created via registration) this customer logs in as."
          />
        )}

        <div className="form-page__actions">
          <Button type="submit" disabled={submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/customers')}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
