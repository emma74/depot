import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { targetService } from '../../services/targetService';
import { expenseService } from '../../services/expenseService';
import { purchaseOrderService } from '../../services/purchaseOrderService';
import { salesOrderService } from '../../services/salesOrderService';
import { depositService } from '../../services/depositService';
import { debitService } from '../../services/debitService';
import { reportService } from '../../services/reportService';
import FormField from '../../components/common/FormField';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage';
import Meter from '../../components/charts/Meter';
import BarChart from '../../components/charts/BarChart';
import LineChart from '../../components/charts/LineChart';
import { formatCurrency } from '../../utils/format';
import './AnalyticsDashboardPage.css';

function firstOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function today() {
  return new Date().toISOString().slice(0, 10);
}

const EXPENSE_CATEGORIES = [
  { key: 'autoMaint', label: 'Auto Maintenance' },
  { key: 'fuelAndOil', label: 'Fuel & Oil' },
  { key: 'salaries', label: 'Salaries' },
  { key: 'homeMaint', label: 'Home Maintenance' },
  { key: 'sundry', label: 'Sundry' },
];

function monthLabel(date) {
  return new Date(date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

// Cap a sorted-descending [{label, value}] list to the top N, folding the rest into "Other".
function foldTop(sorted, cap = 8) {
  if (sorted.length <= cap) return sorted;
  const top = sorted.slice(0, cap);
  const otherTotal = sorted.slice(cap).reduce((sum, d) => sum + d.value, 0);
  return [...top, { label: 'Other', value: otherTotal }];
}

// A sales order's "party" — the customer it was placed for, or (failing that) the
// employee who processed it. Orders can legitimately have both set at once.
function customerLabel(order) {
  return order.customer?.businessName || order.customer?.contactPerson || `Customer #${order.customerId}`;
}
function employeeLabel(order) {
  return order.employee ? `${order.employee.firstName} ${order.employee.lastName}` : `Employee #${order.employeeId}`;
}
function orderTotal(order) {
  return (order.items || []).reduce((sum, item) => sum + Number(item.amount), 0);
}
function orderBalance(order) {
  return (order.payments || []).reduce((sum, p) => sum + Number(p.amountBalance || 0), 0);
}
function orderEmptiesBalance(order) {
  return (order.payments || []).reduce((sum, p) => sum + Number(p.emptiesBal || 0), 0);
}

// --- Target progress ---
function TargetProgressCard() {
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
    <div className="analytics-card">
      <form onSubmit={handleSubmit} className="page-filters">
        <FormField label="From" name="targetStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        <FormField label="To" name="targetEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        <FormField label="Target quantity" name="targetValue" type="number" value={targetValue} onChange={(e) => setTargetValue(e.target.value)} required />
        <Button type="submit" disabled={loading}>{loading ? 'Calculating…' : 'Calculate'}</Button>
      </form>
      {error && <ErrorMessage message={error} />}
      {result ? (
        <Meter
          title="Purchases vs. Target"
          subtitle={`${startDate} to ${endDate}`}
          value={result.totalQty}
          target={result.target}
          progress={result.progress}
        />
      ) : (
        !error && <div className="chart chart__empty">Enter a date range and target quantity to see progress.</div>
      )}
    </div>
  );
}

// --- Expenses by category + over time ---
function ExpensesSection() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data: expenses, loading, error } = useApi(
    () => expenseService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  const byCategory = (expenses || []).length
    ? EXPENSE_CATEGORIES.map(({ key, label }) => ({
        label,
        value: expenses.reduce((sum, e) => sum + Number(e[key] || 0), 0),
      })).sort((a, b) => b.value - a.value)
    : [];

  const byMonth = (() => {
    const totals = new Map();
    for (const e of expenses || []) {
      const monthKey = new Date(e.date).toISOString().slice(0, 7);
      const total = EXPENSE_CATEGORIES.reduce((sum, { key }) => sum + Number(e[key] || 0), 0);
      totals.set(monthKey, (totals.get(monthKey) || 0) + total);
    }
    return [...totals.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, value]) => ({ label: monthLabel(monthKey + '-01'), value }));
  })();

  return (
    <>
      <div className="page-filters">
        <FormField label="From" name="expStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="expEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="analytics-grid">
          <BarChart
            title="Expenses by category"
            subtitle={`${startDate} to ${endDate}`}
            data={byCategory}
            formatValue={formatCurrency}
          />
          <LineChart
            title="Expenses over time"
            subtitle="Monthly total within the selected range"
            data={byMonth}
            formatValue={formatCurrency}
          />
        </div>
      )}
    </>
  );
}

// --- Purchases by product ---
function PurchasesByProductCard() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data: orders, loading, error } = useApi(
    () => purchaseOrderService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  const byProduct = (() => {
    const totals = new Map();
    for (const order of orders || []) {
      for (const item of order.items || []) {
        totals.set(item.product, (totals.get(item.product) || 0) + Number(item.qty));
      }
    }
    const sorted = [...totals.entries()].sort(([, a], [, b]) => b - a).map(([label, value]) => ({ label, value }));
    return foldTop(sorted);
  })();

  return (
    <>
      <div className="page-filters">
        <FormField label="From" name="purStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="purEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <BarChart
          title="Purchases by product"
          subtitle={`Quantity purchased, ${startDate} to ${endDate}`}
          data={byProduct}
          formatValue={(v) => v.toLocaleString()}
        />
      )}
    </>
  );
}

// --- Sales by product ---
function SalesByProductCard() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data: orders, loading, error } = useApi(
    () => salesOrderService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  const byProduct = (() => {
    const totals = new Map();
    for (const order of orders || []) {
      for (const item of order.items || []) {
        totals.set(item.product, (totals.get(item.product) || 0) + Number(item.qty));
      }
    }
    const sorted = [...totals.entries()].sort(([, a], [, b]) => b - a).map(([label, value]) => ({ label, value }));
    return foldTop(sorted);
  })();

  return (
    <>
      <div className="page-filters">
        <FormField label="From" name="salesProdStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="salesProdEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <BarChart
          title="Sales by product"
          subtitle={`Quantity sold, ${startDate} to ${endDate}`}
          data={byProduct}
          formatValue={(v) => v.toLocaleString()}
        />
      )}
    </>
  );
}

// --- Top customers ---
function TopCustomersCard() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data: orders, loading, error } = useApi(
    () => salesOrderService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  const byCustomer = (() => {
    const totals = new Map();
    for (const order of orders || []) {
      if (!order.customerId) continue;
      const key = order.customerId;
      const existing = totals.get(key);
      const value = orderTotal(order);
      if (existing) existing.value += value;
      else totals.set(key, { label: customerLabel(order), value });
    }
    return foldTop([...totals.values()].sort((a, b) => b.value - a.value));
  })();

  return (
    <>
      <div className="page-filters">
        <FormField label="From" name="topCustStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="topCustEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <BarChart
          title="Top customers"
          subtitle={`Revenue, ${startDate} to ${endDate}`}
          data={byCustomer}
          formatValue={formatCurrency}
          emptyMessage="No customer orders in this range."
        />
      )}
    </>
  );
}

// --- Employee performance ---
function EmployeePerformanceCard() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data: orders, loading, error } = useApi(
    () => salesOrderService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  const byEmployee = (() => {
    const totals = new Map();
    for (const order of orders || []) {
      if (!order.employeeId) continue;
      const key = order.employeeId;
      const existing = totals.get(key);
      const value = orderTotal(order);
      if (existing) existing.value += value;
      else totals.set(key, { label: employeeLabel(order), value });
    }
    return foldTop([...totals.values()].sort((a, b) => b.value - a.value));
  })();

  return (
    <>
      <div className="page-filters">
        <FormField label="From" name="empPerfStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="empPerfEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <BarChart
          title="Sales revenue by employee"
          subtitle={`Orders processed, ${startDate} to ${endDate}`}
          data={byEmployee}
          formatValue={formatCurrency}
          emptyMessage="No employee-processed orders in this range."
        />
      )}
    </>
  );
}

// --- Outstanding balances (collections) + empties balance ---
function CollectionsSection() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data: orders, loading, error } = useApi(
    () => salesOrderService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  // Group by the order's party — customer if the order has one, otherwise the
  // processing employee — since either can be the payer on a Payment record.
  function byParty(valueFn) {
    const totals = new Map();
    for (const order of orders || []) {
      const key = order.customerId ? `c${order.customerId}` : order.employeeId ? `e${order.employeeId}` : null;
      if (!key) continue;
      const label = order.customerId ? customerLabel(order) : employeeLabel(order);
      const value = valueFn(order);
      const existing = totals.get(key);
      if (existing) existing.value += value;
      else totals.set(key, { label, value });
    }
    return foldTop([...totals.values()].filter((d) => d.value > 0).sort((a, b) => b.value - a.value));
  }

  const outstandingBalance = byParty(orderBalance);
  const emptiesBalance = byParty(orderEmptiesBalance);

  return (
    <>
      <div className="page-filters">
        <FormField label="From" name="collectStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="collectEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <div className="analytics-grid">
          <BarChart
            title="Outstanding balances"
            subtitle="Who still owes money, from orders in this range"
            data={outstandingBalance}
            formatValue={formatCurrency}
            emptyMessage="No outstanding balances in this range."
          />
          <BarChart
            title="Empties balance"
            subtitle="Returnable bottles still owed, from orders in this range"
            data={emptiesBalance}
            formatValue={(v) => v.toLocaleString()}
            emptyMessage="No outstanding empties in this range."
          />
        </div>
      )}
    </>
  );
}

// --- Returns by employee ---
function ReturnsByEmployeeCard() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data: orders, loading, error } = useApi(
    () => salesOrderService.list({ startDate, endDate }),
    [startDate, endDate]
  );

  // Returns are almost entirely on employee-processed orders (few customer orders,
  // no purchase returns at all) — so this focuses on employees, not products/customers.
  const byEmployee = (() => {
    const totals = new Map();
    for (const order of orders || []) {
      if (!order.employeeId) continue;
      const key = order.employeeId;
      let ordered = 0;
      let returned = 0;
      for (const item of order.items || []) {
        ordered += Number(item.qty);
        returned += (item.return || []).reduce((sum, r) => sum + Number(r.qtyReturned), 0);
      }
      const existing = totals.get(key);
      if (existing) {
        existing.ordered += ordered;
        existing.returned += returned;
      } else {
        totals.set(key, { label: employeeLabel(order), ordered, returned });
      }
    }
    return [...totals.values()]
      .filter((d) => d.ordered > 0)
      .map((d) => ({ label: d.label, value: Number(((d.returned / d.ordered) * 100).toFixed(1)) }))
      .sort((a, b) => b.value - a.value);
  })();

  return (
    <>
      <div className="page-filters">
        <FormField label="From" name="retEmpStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="retEmpEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <BarChart
          title="Return rate by employee"
          subtitle={`Qty returned as % of qty ordered, ${startDate} to ${endDate}`}
          data={byEmployee}
          formatValue={(v) => `${v}%`}
          emptyMessage="No employee orders in this range."
        />
      )}
    </>
  );
}

// --- Deposits vs debits ---
function CashReconciliationCard() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data, loading, error } = useApi(async () => {
    const [deposits, debits] = await Promise.all([
      depositService.list({ startDate, endDate }),
      debitService.list({ startDate, endDate }),
    ]);
    return [
      { label: 'Deposits', value: deposits.totalAmount },
      { label: 'Debits', value: debits.totalAmount },
    ];
  }, [startDate, endDate]);

  return (
    <>
      <div className="page-filters">
        <FormField label="From" name="cashStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="cashEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <BarChart
          title="Deposits vs. debits"
          subtitle={`${startDate} to ${endDate}`}
          data={data}
          formatValue={formatCurrency}
        />
      )}
    </>
  );
}

// --- Profit & loss summary ---
function ProfitAndLossCard() {
  const [startDate, setStartDate] = useState(firstOfMonth());
  const [endDate, setEndDate] = useState(today());

  const { data, loading, error } = useApi(
    () => reportService.profitAndLoss({ startDate, endDate }),
    [startDate, endDate]
  );

  const breakdown = data
    ? [
        { label: 'Revenue', value: data.totalRevenue },
        { label: 'COGS', value: data.totalCOGS },
        { label: 'Expenses', value: data.totalExpenses },
        { label: 'Net Profit', value: Math.max(data.netProfit, 0) },
      ]
    : [];

  return (
    <>
      <div className="page-filters">
        <FormField label="From" name="plStart" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <FormField label="To" name="plEnd" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <Link to="/finance/profit-and-loss">
          <Button variant="secondary">Open full Profit &amp; Loss page</Button>
        </Link>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} />
      ) : (
        <BarChart
          title="Profit & Loss breakdown"
          subtitle={`${startDate} to ${endDate}`}
          data={breakdown}
          formatValue={formatCurrency}
        />
      )}
    </>
  );
}

export default function AnalyticsDashboardPage() {
  return (
    <div className="analytics-dashboard">
      <div className="page-header">
        <h1>Analytics</h1>
      </div>

      <section className="analytics-section">
        <h2>Target progress</h2>
        <TargetProgressCard />
      </section>

      <section className="analytics-section">
        <h2>Expenses</h2>
        <ExpensesSection />
      </section>

      <section className="analytics-section">
        <h2>Purchases</h2>
        <PurchasesByProductCard />
      </section>

      <section className="analytics-section">
        <h2>Sales by product</h2>
        <SalesByProductCard />
      </section>

      <section className="analytics-section">
        <h2>Top customers</h2>
        <TopCustomersCard />
      </section>

      <section className="analytics-section">
        <h2>Employee performance</h2>
        <EmployeePerformanceCard />
      </section>

      <section className="analytics-section">
        <h2>Collections</h2>
        <CollectionsSection />
      </section>

      <section className="analytics-section">
        <h2>Returns</h2>
        <ReturnsByEmployeeCard />
      </section>

      <section className="analytics-section">
        <h2>Cash reconciliation</h2>
        <CashReconciliationCard />
      </section>

      <section className="analytics-section">
        <h2>Profit &amp; Loss</h2>
        <ProfitAndLossCard />
      </section>
    </div>
  );
}
