import { useState } from 'react';
import { productTotalService } from '../../services/productTotalService';
import FormField from '../../components/common/FormField';
import ProductInput from '../../components/common/ProductInput';
import Button from '../../components/common/Button';
import DownloadButton from '../../components/common/DownloadButton';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatQty } from '../../utils/format';

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProductTotalPage() {
  const [type, setType] = useState('sales');
  const [product, setProduct] = useState('');
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = await productTotalService.getTotal({ type, product, startDate, endDate });
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
        <h1>Product Totals</h1>
      </div>

      <form onSubmit={handleSubmit} className="page-filters">
        <FormField as="select" label="Type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="sales">Sales</option>
          <option value="purchase">Purchase</option>
        </FormField>
        <ProductInput
          label="Product"
          name="product"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          hint="Pick from the list or type your own"
          required
        />
        <FormField label="From" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <FormField label="To" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        <Button type="submit" disabled={loading}>{loading ? 'Calculating…' : 'Calculate'}</Button>
      </form>

      {error && <ErrorMessage message={error} />}

      {result && (
        <>
          <div className="detail-section">
            <dl className="detail-grid">
              <div><dt>Type</dt><dd style={{ textTransform: 'capitalize' }}>{result.type}</dd></div>
              <div><dt>Product</dt><dd>{result.product}</dd></div>
              <div><dt>Total quantity</dt><dd>{formatQty(result.totalQty)}</dd></div>
            </dl>
          </div>

          <div className="page-filters">
            <DownloadButton
              filename={`product-total_${result.type}_${result.product}_${startDate}_to_${endDate}.csv`}
              rows={[{ ...result, startDate, endDate }]}
              columns={[
                { key: 'type', label: 'Type' },
                { key: 'product', label: 'Product' },
                { key: 'startDate', label: 'From' },
                { key: 'endDate', label: 'To' },
                { key: 'totalQty', label: 'Total quantity' },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
