import { useRef, useState } from 'react';
import './charts.css';
import './LineChart.css';

const WIDTH = 640;
const HEIGHT = 220;
const PAD_LEFT = 56;
const PAD_RIGHT = 16;
const PAD_TOP = 16;
const PAD_BOTTOM = 32;

// data: [{ label, value }] — a single series over time. Line + crosshair/tooltip
// (single series needs no legend; the chart title already names what's plotted).
export default function LineChart({ title, subtitle, data, formatValue = (v) => v.toLocaleString(), emptyMessage = 'No data for this range.' }) {
  const svgRef = useRef(null);
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="chart">
        <div className="chart__title">{title}</div>
        {subtitle && <div className="chart__subtitle">{subtitle}</div>}
        <div className="chart__empty">{emptyMessage}</div>
      </div>
    );
  }

  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const maxValue = Math.max(...data.map((d) => d.value), 0.0001);

  const x = (i) => PAD_LEFT + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v) => PAD_TOP + innerH - (v / maxValue) * innerH;

  const points = data.map((d, i) => ({ ...d, x: x(i), y: y(d.value) }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => PAD_TOP + innerH * (1 - f));

  const handleMove = (e) => {
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - mouseX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div className="chart">
      <div className="chart__title">{title}</div>
      {subtitle && <div className="chart__subtitle">{subtitle}</div>}

      <div className="line-chart" style={{ position: 'relative' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="line-chart__svg"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {gridLines.map((gy, i) => (
            <line key={i} x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={gy} y2={gy} className="line-chart__grid" />
          ))}
          <line x1={PAD_LEFT} x2={PAD_LEFT} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} className="line-chart__axis" />
          <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={HEIGHT - PAD_BOTTOM} y2={HEIGHT - PAD_BOTTOM} className="line-chart__axis" />

          {gridLines.map((gy, i) => (
            <text key={i} x={PAD_LEFT - 8} y={gy + 4} className="line-chart__tick" textAnchor="end">
              {formatValue(maxValue * (1 - i / 4))}
            </text>
          ))}

          {points.map((p, i) => (
            <text key={i} x={p.x} y={HEIGHT - PAD_BOTTOM + 18} className="line-chart__tick" textAnchor="middle">
              {p.label}
            </text>
          ))}

          {hovered && (
            <line x1={hovered.x} x2={hovered.x} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} className="line-chart__crosshair" />
          )}

          <path d={pathD} className="line-chart__path" fill="none" />

          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 5 : 4}
              className="line-chart__dot"
            />
          ))}

          {/* value at the end, per mark spec (label selectively) */}
          <text x={points[points.length - 1].x} y={points[points.length - 1].y - 10} className="line-chart__end-label" textAnchor="end">
            {formatValue(points[points.length - 1].value)}
          </text>
        </svg>

        {hovered && (
          <div
            className="chart__tooltip"
            style={{
              left: `${(hovered.x / WIDTH) * 100}%`,
              top: `${(hovered.y / HEIGHT) * 100}%`,
            }}
          >
            <span className="chart__tooltip-value">{formatValue(hovered.value)}</span>
            <span className="chart__tooltip-label">{hovered.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
