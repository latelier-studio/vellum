import type { ReactNode } from 'react';

export type ButtonProps = {
  /** Visual variant. */
  variant?: 'primary' | 'secondary' | 'subtle';
  /** Size. */
  size?: 'xs' | 'sm' | 'md';
  /** Keyboard shortcut hint. */
  shortcut?: string;
  /** Disabled state. */
  disabled?: boolean;
  children?: ReactNode;
  onClick?: () => void;
};

const VARIANT: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
  primary: {
    background: 'var(--vellum-color-accent)',
    color: 'var(--vellum-color-accent-fg)',
    border: '1px solid transparent',
    boxShadow: '0 1px 0 rgba(0, 0, 0, 0.05), inset 0 -1px 0 rgba(0, 0, 0, 0.08)',
  },
  secondary: {
    background: 'var(--vellum-color-bg)',
    color: 'var(--vellum-color-fg)',
    border: '1px solid var(--vellum-color-border)',
    boxShadow: '0 1px 0 rgba(0, 0, 0, 0.04)',
  },
  subtle: {
    background: 'transparent',
    color: 'var(--vellum-color-muted-fg)',
    border: '1px solid transparent',
  },
};

const SIZE: Record<NonNullable<ButtonProps['size']>, React.CSSProperties> = {
  xs: { padding: '0 8px', height: 22, fontSize: 12 },
  sm: { padding: '0 10px', height: 26, fontSize: 13 },
  md: { padding: '0 14px', height: 32, fontSize: 13 },
};

export function Button({ variant = 'primary', size = 'sm', shortcut, disabled, onClick, children = 'New issue' }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        ...VARIANT[variant],
        ...SIZE[size],
        borderRadius: 'var(--vellum-radius-md)',
        fontFamily: 'var(--vellum-font-body)',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        transition: 'background 120ms',
      }}
    >
      <span>{children}</span>
      {shortcut ? (
        <kbd
          style={{
            fontFamily: 'var(--vellum-font-mono)',
            fontSize: 10,
            padding: '1px 5px',
            background: variant === 'primary' ? 'rgba(255,255,255,0.18)' : 'var(--vellum-color-muted)',
            borderRadius: 3,
          }}
        >
          {shortcut}
        </kbd>
      ) : null}
    </button>
  );
}

Button.displayName = 'Button';
