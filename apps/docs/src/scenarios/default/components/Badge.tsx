import type { ReactNode } from 'react';

export type BadgeProps = {
  /** Visual tone. */
  tone?: 'neutral' | 'accent' | 'danger' | 'success';
  /** Content of the badge. */
  children?: ReactNode;
};

const TONE_STYLES: Record<NonNullable<BadgeProps['tone']>, React.CSSProperties> = {
  neutral: {
    background: 'var(--vellum-color-muted)',
    color: 'var(--vellum-color-fg)',
  },
  accent: {
    background: 'var(--vellum-color-accent)',
    color: 'var(--vellum-color-accent-fg)',
  },
  danger: {
    background: 'oklch(0.55 0.21 25)',
    color: '#fff',
  },
  success: {
    background: 'oklch(0.55 0.18 145)',
    color: '#fff',
  },
};

export function Badge({ tone = 'neutral', children = 'BADGE' }: BadgeProps) {
  return (
    <span
      style={{
        ...TONE_STYLES[tone],
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'calc(var(--vellum-radius-sm) + 2px)',
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}
    >
      {children}
    </span>
  );
}

Badge.displayName = 'Badge';
