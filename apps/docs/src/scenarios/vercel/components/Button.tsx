import type { ReactNode } from 'react';

export type ButtonProps = {
  /** Visual variant. */
  variant?: 'primary' | 'secondary' | 'destructive';
  /** Size. */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state. */
  disabled?: boolean;
  /** Click handler. */
  onClick?: () => void;
  children?: ReactNode;
};

const VARIANT: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
  primary: {
    background: 'var(--vellum-color-fg)',
    color: 'var(--vellum-color-bg)',
    border: '1px solid var(--vellum-color-fg)',
  },
  secondary: {
    background: 'var(--vellum-color-bg)',
    color: 'var(--vellum-color-fg)',
    border: '1px solid var(--vellum-color-border)',
  },
  destructive: {
    background: '#ee0000',
    color: '#ffffff',
    border: '1px solid #ee0000',
  },
};

const SIZE: Record<NonNullable<ButtonProps['size']>, React.CSSProperties> = {
  sm: { padding: '0 12px', height: 28, fontSize: 13 },
  md: { padding: '0 16px', height: 36, fontSize: 14 },
  lg: { padding: '0 20px', height: 44, fontSize: 15 },
};

export function Button({ variant = 'primary', size = 'md', disabled, onClick, children = 'Button' }: ButtonProps) {
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
        opacity: disabled ? 0.4 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'opacity 150ms',
      }}
    >
      {children}
    </button>
  );
}

Button.displayName = 'Button';
