import { useNavigate } from 'react-router-dom';
import './DataTable.css';

// columns: [{ key, label, render?: (row) => node }]
// rows: array of data objects
// onRowClick: (row) => path string to navigate to, or omit for non-clickable rows
export default function DataTable({ columns, rows, onRowClick, emptyMessage = 'No records found.' }) {
  const navigate = useNavigate();

  if (!rows || rows.length === 0) {
    return <div className="data-table__empty">{emptyMessage}</div>;
  }

  return (
    <div className="data-table__wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={onRowClick ? 'data-table__row--clickable' : ''}
              onClick={onRowClick ? () => navigate(onRowClick(row)) : undefined}
            >
              {columns.map((col) => (
                <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
