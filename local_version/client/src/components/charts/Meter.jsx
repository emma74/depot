import './charts.css';
import './Meter.css';

// A single ratio against a limit (e.g. purchases-vs-target). Not a bar chart —
// per dataviz guidance a lone value+limit is a meter, track = lighter step of the fill hue.
export default function Meter({ title, subtitle, value, target, progress, unit = '' }) {
  const pct = Math.max(0, Math.min(progress, 100));
  const met = progress >= 100;

  return (
    <div className="chart">
      <div className="chart__title">{title}</div>
      {subtitle && <div className="chart__subtitle">{subtitle}</div>}

      <div className="meter">
        <div className="meter__track">
          <div
            className={'meter__fill' + (met ? ' meter__fill--met' : '')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="meter__figures">
          <span className="meter__value">{Number(value).toLocaleString()}{unit}</span>
          <span className="meter__of"> of {Number(target).toLocaleString()}{unit} target</span>
        </div>
        <div className={'meter__percent' + (met ? ' meter__percent--met' : '')}>
          {progress}%
        </div>
      </div>
    </div>
  );
}
