import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { employeeService } from '../../services/employeeService';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';
import './EmployeeListPage.css';

export default function EmployeeListPage() {
  const { isAdmin } = useAuth();
  const { data: employees, loading, error } = useApi(employeeService.list);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="employee-list-page">
      <div className="page-header">
        <h1>Employees</h1>
        {isAdmin && (
          <Link to="/employees/new">
            <Button>+ New Employee</Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={[
          { key: 'name', label: 'Name', render: (row) => `${row.firstName} ${row.lastName}` },
          { key: 'position', label: 'Position', render: (row) => row.position || '—' },
          { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
          { key: 'address', label: 'Address' },
          { key: 'salary', label: 'Salary' },
          { key: 'isActive', label: 'Status', render: (row) => (row.isActive ? 'Active' : 'Inactive') },
        ]}
        rows={employees}
        onRowClick={isAdmin ? (row) => `/employees/${row.id}/edit` : undefined}
        emptyMessage="No employee records found."
      />
    </div>
  );
}
