import { useState } from 'react';
import { targetService } from '../../services/targetService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatQty } from '../../utils/format';

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function TargetsPage() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [targetValue, setTargetValue] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await targetService.getProgress({ startDate, endDate, targetValue });
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Targets</h1>
      </div>

      <form onSubmit={handleSubmit} className="page-filters">
        <FormField label="From" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <FormField label="To" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        <FormField label="Target quantity" name="targetValue" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} required />
        <Button type="submit" disabled={loading}>{loading ? 'Calculating…' : 'Calculate'}</Button>
      </form>

      {error && <ErrorMessage message={error} />}

      {result && (
        <div className="detail-section">
          <dl className="detail-grid">
            <div><dt>Purchased Qty</dt><dd>{formatQty(result.totalQty)}</dd></div>
            <div><dt>Target</dt><dd>{formatQty(result.target)}</dd></div>
            <div><dt>Progress</dt><dd>{result.progress}%</dd></div>
          </dl>
        </div>
      )}
    </div>
  );
}
