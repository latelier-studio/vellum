import type { ReactNode } from 'react';

export type ButtonProps = {
  /** Visual stamp. */
  stamp?: 'shout' | 'whisper' | 'ink';
  children?: ReactNode;
  onClick?: () => void;
};

export function Button({ stamp = 'shout', children = 'PRESS', onClick }: ButtonProps) {
  const isShout = stamp === 'shout';
  const isInk = stamp === 'ink';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 18px',
        background: isShout ? 'var(--vellum-color-accent)' : isInk ? 'var(--vellum-color-fg)' : 'transparent',
        color: isShout ? 'var(--vellum-color-accent-fg)' : isInk ? 'var(--vellum-color-bg)' : 'var(--vellum-color-fg)',
        border: '2px solid var(--vellum-color-fg)',
        borderRadius: 0,
        fontFamily: 'var(--vellum-font-display)',
        fontSize: 14,
        fontWeight: 900,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        boxShadow: '4px 4px 0 var(--vellum-color-fg)',
        transition: 'transform 80ms, box-shadow 80ms',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translate(-1px, -1px)';
        e.currentTarget.style.boxShadow = '5px 5px 0 var(--vellum-color-fg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = '4px 4px 0 var(--vellum-color-fg)';
      }}
    >
      {children}
    </button>
  );
}

Button.displayName = 'Button';
