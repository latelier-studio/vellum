export type MetricProps = {
  /** Metric label. */
  label?: string;
  /** Current value. */
  value?: string | number;
  /** Delta vs. prior period. */
  delta?: string;
  /** Direction of the delta. */
  trend?: 'up' | 'down' | 'flat';
  /** Optional unit suffix. */
  unit?: string;
};

export function Metric({ label = 'Active sessions', value = '1,284', delta = '+12.4%', trend = 'up', unit }: MetricProps) {
  const color =
    trend === 'up' ? 'var(--vellum-color-accent)' : trend === 'down' ? '#d14b4b' : 'var(--vellum-color-muted-fg)';
  const arrow = trend === 'up' ? '▲' : trend === 'down' ? '▼' : '·';
  return (
    <div
      style={{
        display: 'grid',
        gap: 4,
        padding: '10px 14px',
        background: 'var(--vellum-color-bg)',
        border: '1px solid var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-sm)',
        minWidth: 180,
        fontFamily: 'var(--vellum-font-body)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--vellum-color-muted-fg)',
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--vellum-font-display)', fontSize: 22, fontWeight: 600, color: 'var(--vellum-color-fg)' }}>
          {value}
        </span>
        {unit ? <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 11, color: 'var(--vellum-color-muted-fg)' }}>{unit}</span> : null}
      </div>
      <div style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 11, color }}>
        {arrow} {delta}
      </div>
    </div>
  );
}

Metric.displayName = 'Metric';
