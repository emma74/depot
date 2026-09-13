import { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { reportService } from '../../services/reportService';
import FormField from '../../components/common/FormField';
import DownloadButton from '../../components/common/DownloadButton';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import { formatCurrency } from '../../utils/format';

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProfitAndLossPage() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data, loading, error } = useApi(
    () => reportService.profitAndLoss({ startDate, endDate }),
    [startDate, endDate]
  );

  return (
    <div>
      <div className="page-header">
        <h1>Profit &amp; Loss</h1>
      </div>

      <div className="page-filters">
        <FormField label="From" name="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <>
          <div className="detail-section">
            <dl className="detail-grid">
              <div><dt>Total Sales</dt><dd>{formatCurrency(data.totalSales)}</dd></div>
              <div><dt>Other Income</dt><dd>{formatCurrency(data.totalOtherIncome)}</dd></div>
              <div><dt>Total Revenue</dt><dd>{formatCurrency(data.totalRevenue)}</dd></div>
              <div><dt>Cost of Goods Sold</dt><dd>{formatCurrency(data.totalCOGS)}</dd></div>
              <div><dt>Gross Profit</dt><dd>{formatCurrency(data.grossProfit)}</dd></div>
              <div><dt>Expenses</dt><dd>{formatCurrency(data.totalExpenses)}</dd></div>
              <div><dt>Net Profit</dt><dd>{formatCurrency(data.netProfit)}</dd></div>
            </dl>
          </div>

          <div className="page-filters">
            <DownloadButton
              filename={`profit-and-loss_${startDate}_to_${endDate}.csv`}
              rows={[data]}
              columns={[
                { key: 'totalSales', label: 'Total Sales' },
                { key: 'totalOtherIncome', label: 'Other Income' },
                { key: 'totalRevenue', label: 'Total Revenue' },
                { key: 'totalCOGS', label: 'Cost of Goods Sold' },
                { key: 'grossProfit', label: 'Gross Profit' },
                { key: 'totalExpenses', label: 'Expenses' },
                { key: 'netProfit', label: 'Net Profit' },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
