import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { userService } from '../../services/userService';
import DataTable from '../../components/common/DataTable';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { validatePassword, PASSWORD_HINT } from '../../utils/validation';
import { formatDate } from '../../utils/format';

function linkedTo(user) {
  if (user.employee) return `Employee: ${user.employee.firstName} ${user.employee.lastName}`;
  if (user.customer) return `Customer: ${user.customer.businessName || user.customer.contactPerson}`;
  return '—';
}

export default function UserAdminPage() {
  const { data: users, loading, error: listError, reload } = useApi(userService.list);

  // --- Reset password ---
  const [resetUserId, setResetUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState(null);
  const [resetError, setResetError] = useState(null);
  const [resetResult, setResetResult] = useState(null);
  const [resetting, setResetting] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setResetError(null);
    setResetResult(null);

    const message = validatePassword(newPassword);
    setPasswordError(message);
    if (message) return;

    setResetting(true);
    try {
      const result = await userService.resetPassword(resetUserId, newPassword);
      setResetResult(`Password reset for ${result.username} (user #${result.id}).`);
      setNewPassword('');
    } catch (err) {
      setResetError(err.response?.data?.message || err.response?.data?.error || err.message);
    } finally {
      setResetting(false);
    }
  };

  // --- Change role ---
  const [roleUserId, setRoleUserId] = useState('');
  const [role, setRole] = useState('user');
  const [roleError, setRoleError] = useState(null);
  const [roleResult, setRoleResult] = useState(null);
  const [changingRole, setChangingRole] = useState(false);

  const handleRoleChange = async (e) => {
    e.preventDefault();
    setChangingRole(true);
    setRoleError(null);
    setRoleResult(null);
    try {
      const result = await userService.updateRole(roleUserId, role);
      setRoleResult(`${result.username} (user #${result.id}) is now ${result.role}.`);
      reload();
    } catch (err) {
      setRoleError(err.response?.data?.message || err.response?.data?.error || err.message);
    } finally {
      setChangingRole(false);
    }
  };

  // Selecting a row fills both forms below, since resetting a password and changing a
  // role are usually done for whichever user you just looked up.
  const selectUser = (user) => {
    setResetUserId(String(user.id));
    setRoleUserId(String(user.id));
    setRole(user.role);
  };

  return (
    <div>
      <div className="page-header">
        <h1>User Accounts</h1>
      </div>

      <div className="detail-section">
        <h2>Registered users</h2>
        {loading ? (
          <LoadingSpinner />
        ) : listError ? (
          <ErrorMessage message={listError} />
        ) : (
          <DataTable
            columns={[
              { key: 'id', label: 'ID' },
              { key: 'username', label: 'Username' },
              { key: 'role', label: 'Role', render: (row) => <span style={{ textTransform: 'capitalize' }}>{row.role}</span> },
              { key: 'linked', label: 'Linked to', render: (row) => linkedTo(row) },
              { key: 'createdAt', label: 'Created', render: (row) => formatDate(row.createdAt) },
              {
                key: 'actions',
                label: '',
                render: (row) => (
                  <Button variant="secondary" onClick={() => selectUser(row)}>Use</Button>
                ),
              },
            ]}
            rows={users}
            emptyMessage="No registered users."
          />
        )}
      </div>

      <div className="detail-section">
        <h2>Reset a user&apos;s password</h2>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85em', marginBottom: 'var(--spacing-4)' }}>
          For a user who forgot their password and has no self-service recovery option. Pick a
          user above with "Use", or enter their ID directly.
        </p>
        {resetError && <ErrorMessage message={resetError} />}
        {resetResult && <p style={{ color: 'var(--color-success)' }}>{resetResult}</p>}
        <form onSubmit={handleReset} className="page-filters">
          <FormField label="User ID" name="resetUserId" type="number" value={resetUserId} onChange={(e) => setResetUserId(e.target.value)} required />
          <FormField
            label="New password"
            name="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            hint={PASSWORD_HINT}
            error={passwordError}
            required
          />
          <Button type="submit" disabled={resetting}>{resetting ? 'Resetting…' : 'Reset Password'}</Button>
        </form>
      </div>

      <div className="detail-section">
        <h2>Change a user&apos;s role</h2>
        {roleError && <ErrorMessage message={roleError} />}
        {roleResult && <p style={{ color: 'var(--color-success)' }}>{roleResult}</p>}
        <form onSubmit={handleRoleChange} className="page-filters">
          <FormField label="User ID" name="roleUserId" type="number" value={roleUserId} onChange={(e) => setRoleUserId(e.target.value)} required />
          <FormField as="select" label="Role" name="role" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </FormField>
          <Button type="submit" disabled={changingRole}>{changingRole ? 'Saving…' : 'Update Role'}</Button>
        </form>
      </div>
    </div>
  );
}
