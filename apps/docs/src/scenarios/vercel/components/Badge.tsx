import type { ReactNode } from 'react';

export type BadgeProps = {
  /** Status the badge represents. */
  status?: 'production' | 'preview' | 'building' | 'error';
  /** Label override. */
  children?: ReactNode;
};

const STATUS: Record<NonNullable<BadgeProps['status']>, { bg: string; fg: string; dot: string; label: string }> = {
  production: { bg: 'var(--vellum-color-muted)', fg: 'var(--vellum-color-fg)', dot: '#0070f3', label: 'Production' },
  preview: { bg: 'var(--vellum-color-muted)', fg: 'var(--vellum-color-fg)', dot: '#f5a623', label: 'Preview' },
  building: { bg: 'var(--vellum-color-muted)', fg: 'var(--vellum-color-fg)', dot: '#888888', label: 'Building' },
  error: { bg: 'var(--vellum-color-muted)', fg: 'var(--vellum-color-fg)', dot: '#ee0000', label: 'Error' },
};

export function Badge({ status = 'production', children }: BadgeProps) {
  const s = STATUS[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: s.bg,
        color: s.fg,
        border: '1px solid var(--vellum-color-border)',
        borderRadius: 999,
        fontFamily: 'var(--vellum-font-body)',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      <span aria-hidden style={{ width: 7, height: 7, borderRadius: '50%', background: s.dot }} />
      {children ?? s.label}
    </span>
  );
}

Badge.displayName = 'Badge';
