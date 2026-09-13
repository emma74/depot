import './StatusBadge.css';

export default function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();
  return <span className={`status-badge status-badge--${normalized}`}>{status}</span>;
}
