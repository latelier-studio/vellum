import type { ReactNode } from 'react';

export type CalloutProps = {
  /** Visual tone. */
  tone?: 'info' | 'warning' | 'success' | 'quote';
  /** Emoji rendered as the callout icon. */
  emoji?: string;
  children?: ReactNode;
};

const TONE: Record<NonNullable<CalloutProps['tone']>, { bg: string; border: string }> = {
  info: { bg: 'var(--vellum-color-muted)', border: 'var(--vellum-color-border)' },
  warning: { bg: 'color-mix(in oklab, var(--vellum-color-accent) 12%, var(--vellum-color-bg))', border: 'var(--vellum-color-accent)' },
  success: { bg: 'color-mix(in oklab, oklch(0.6 0.18 145) 12%, var(--vellum-color-bg))', border: 'oklch(0.6 0.18 145)' },
  quote: { bg: 'var(--vellum-color-bg)', border: 'var(--vellum-color-fg)' },
};

export function Callout({ tone = 'info', emoji = '💡', children = 'Lorem ipsum dolor sit amet.' }: CalloutProps) {
  const t = TONE[tone];
  const isQuote = tone === 'quote';
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: 16,
        background: t.bg,
        borderLeft: isQuote ? `4px solid ${t.border}` : `1px solid ${t.border}`,
        borderRadius: isQuote ? 0 : 'var(--vellum-radius-md)',
        fontFamily: isQuote ? 'var(--vellum-font-display)' : 'var(--vellum-font-body)',
        fontStyle: isQuote ? 'italic' : 'normal',
        fontSize: isQuote ? 17 : 14,
        lineHeight: 1.55,
        color: 'var(--vellum-color-fg)',
        maxWidth: 480,
      }}
    >
      <span aria-hidden style={{ fontSize: 18, lineHeight: 1.2 }}>{emoji}</span>
      <div>{children}</div>
    </div>
  );
}

Callout.displayName = 'Callout';
