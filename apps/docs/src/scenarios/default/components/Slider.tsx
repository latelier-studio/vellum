export type SliderProps = {
  /** Current value between 0 and max. */
  value?: number;
  /** Maximum value. */
  max?: number;
  /** Visible label. */
  label?: string;
  /** Tonal accent. */
  tone?: 'accent' | 'neutral';
};

export function Slider({ value = 40, max = 100, label = 'Volume', tone = 'accent' }: SliderProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = tone === 'accent' ? 'var(--vellum-color-accent)' : 'var(--vellum-color-fg)';
  return (
    <div style={{ display: 'grid', gap: 8, minWidth: 240 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: 'var(--vellum-color-muted-fg)',
        }}
      >
        <span>{label}</span>
        <span style={{ color: 'var(--vellum-color-fg)' }}>
          {value} / {max}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        style={{
          position: 'relative',
          height: 8,
          background: 'var(--vellum-color-muted)',
          borderRadius: 'var(--vellum-radius-sm)',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: fill }} />
      </div>
    </div>
  );
}

Slider.displayName = 'Slider';
