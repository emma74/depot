import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employeeService } from '../../services/employeeService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { POSITIONS } from '../../constants/positions';

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  ghCard: '',
  license: '',
  email: '',
  address: '',
  salary: '',
  position: '',
  isAdmin: false,
  date: '',
  userId: '',
};

export default function EmployeeFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    employeeService
      .get(id)
      .then((employee) =>
        setForm({
          ...emptyForm,
          ...employee,
          date: employee.date ? employee.date.slice(0, 10) : '',
        })
      )
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...form,
        salary: Number(form.salary),
        userId: form.userId ? Number(form.userId) : undefined,
      };
      if (isEdit) {
        await employeeService.update(id, payload);
      } else {
        await employeeService.create(payload);
      }
      navigate('/employees');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="form-page">
      <div className="page-header">
        <h1>{isEdit ? 'Edit Employee' : 'New Employee'}</h1>
      </div>

      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit}>
        <FormField label="First name" name="firstName" value={form.firstName} onChange={handleChange} required />
        <FormField label="Last name" name="lastName" value={form.lastName} onChange={handleChange} required />
        <FormField label="Phone" name="phone" value={form.phone || ''} onChange={handleChange} />
        <FormField label="Gh Card" name="ghCard" value={form.ghCard || ''} onChange={handleChange} />
        <FormField label="License" name="license" value={form.license || ''} onChange={handleChange} />
        <FormField label="Email" name="email" type="email" value={form.email || ''} onChange={handleChange} />
        <FormField label="Address" name="address" value={form.address} onChange={handleChange} required />
        <FormField label="Salary" name="salary" type="number" step="0.01" value={form.salary} onChange={handleChange} required />
        <FormField as="select" label="Position" name="position" value={form.position || ''} onChange={handleChange} required>
          <option value="" disabled>Select a position</option>
          {POSITIONS.map((position) => (
            <option key={position} value={position}>{position}</option>
          ))}
        </FormField>
        <FormField label="Start date" name="date" type="date" value={form.date} onChange={handleChange} required />
        {!isEdit && (
          <FormField
            label="Linked User ID"
            name="userId"
            type="number"
            value={form.userId}
            onChange={handleChange}
            required
            hint="The user account (created via registration) this employee logs in as."
          />
        )}
        <FormField as="select" label="Admin employee" name="isAdmin" value={form.isAdmin ? 'true' : 'false'}
          onChange={(e) => setForm((prev) => ({ ...prev, isAdmin: e.target.value === 'true' }))}>
          <option value="false">No</option>
          <option value="true">Yes</option>
        </FormField>

        <div className="form-page__actions">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
