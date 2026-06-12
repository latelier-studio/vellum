import type { ReactNode } from 'react';

export type ButtonProps = {
  /** Visual variant. */
  variant?: 'primary' | 'ghost';
  /** Optional emoji or icon prefix. */
  icon?: string;
  children?: ReactNode;
  onClick?: () => void;
};

export function Button({ variant = 'primary', icon, children = 'Button', onClick }: ButtonProps) {
  const isPrimary = variant === 'primary';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 12px',
        background: isPrimary ? 'var(--vellum-color-accent)' : 'transparent',
        color: isPrimary ? 'var(--vellum-color-accent-fg)' : 'var(--vellum-color-fg)',
        border: isPrimary ? '1px solid var(--vellum-color-accent)' : '1px solid var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-md)',
        fontFamily: 'var(--vellum-font-body)',
        fontSize: 14,
        cursor: 'pointer',
        boxShadow: isPrimary ? '0 1px 2px rgba(47, 44, 40, 0.06)' : 'none',
        transition: 'background 200ms',
      }}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {children}
    </button>
  );
}

Button.displayName = 'Button';
