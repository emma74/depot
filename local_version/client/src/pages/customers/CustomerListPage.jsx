import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { customerService } from '../../services/customerService';
import DataTable from '../../components/common/DataTable';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Button from '../../components/common/Button';

export default function CustomerListPage() {
  const { data: customers, loading, error } = useApi(customerService.list);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div>
      <div className="page-header">
        <h1>Customers</h1>
        <Link to="/customers/new">
          <Button>+ New Customer</Button>
        </Link>
      </div>

      <DataTable
        columns={[
          { key: 'businessName', label: 'Business', render: (row) => row.businessName || '—' },
          { key: 'contactPerson', label: 'Contact' },
          { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
          { key: 'location', label: 'Location' },
        ]}
        rows={customers}
        onRowClick={(row) => `/customers/${row.id}`}
        emptyMessage="No customers found."
      />
    </div>
  );
}
