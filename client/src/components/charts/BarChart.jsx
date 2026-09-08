import { useState } from 'react';
import './charts.css';
import './BarChart.css';

// data: [{ label, value }] — horizontal bars, single sequential hue (magnitude
// comparison, not identity), sorted by the caller. Horizontal reads better than
// columns here since labels (names, product SKUs) run long and lists run 8-9 deep.
export default function BarChart({ title, subtitle, data, formatValue = (v) => v.toLocaleString(), emptyMessage = 'No data for this range.' }) {
  const [hovered, setHovered] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart">
        <div className="chart__title">{title}</div>
        {subtitle && <div className="chart__subtitle">{subtitle}</div>}
        <div className="chart__empty">{emptyMessage}</div>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 0.0001);

  return (
    <div className="chart">
      <div className="chart__title">{title}</div>
      {subtitle && <div className="chart__subtitle">{subtitle}</div>}

      <div className="bar-chart">
        {data.map((d) => {
          const pct = (d.value / max) * 100;
          return (
            <div
              className="bar-chart__row"
              key={d.label}
              onMouseEnter={() => setHovered(d.label)}
              onMouseLeave={() => setHovered((h) => (h === d.label ? null : h))}
              onFocus={() => setHovered(d.label)}
              onBlur={() => setHovered((h) => (h === d.label ? null : h))}
              tabIndex={0}
            >
              <div className="bar-chart__label" title={d.label}>{d.label}</div>
              <div className="bar-chart__track">
                <div
                  className={'bar-chart__bar' + (hovered === d.label ? ' bar-chart__bar--hover' : '')}
                  style={{ width: `${pct}%` }}
                />
                <span className="bar-chart__value">{formatValue(d.value)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
