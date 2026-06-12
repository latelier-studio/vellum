import type { ReactNode, MouseEvent } from 'react';

export type ButtonProps = {
  /** Visual variant of the button. */
  variant?: 'primary' | 'ghost' | 'destructive';
  /** Size scale. */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state. */
  disabled?: boolean;
  /** Loading state — shows a spinner and ignores clicks. */
  loading?: boolean;
  /** Click handler. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
};

const VARIANT_STYLES: Record<NonNullable<ButtonProps['variant']>, React.CSSProperties> = {
  primary: {
    background: 'var(--vellum-color-accent)',
    color: 'var(--vellum-color-accent-fg)',
    border: '1px solid var(--vellum-color-accent)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--vellum-color-fg)',
    border: '1px solid var(--vellum-color-border)',
  },
  destructive: {
    background: 'oklch(0.58 0.21 25)',
    color: '#fff',
    border: '1px solid oklch(0.58 0.21 25)',
  },
};

const SIZE_STYLES: Record<NonNullable<ButtonProps['size']>, React.CSSProperties> = {
  sm: { padding: '4px 10px', fontSize: 'var(--vellum-text-xs)' },
  md: { padding: '6px 14px', fontSize: 'var(--vellum-text-sm)' },
  lg: { padding: '10px 20px', fontSize: 'var(--vellum-text-md)' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  onClick,
  children = 'Button',
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      style={{
        ...variantStyle,
        ...sizeStyle,
        borderRadius: 'var(--vellum-radius-md)',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--vellum-font-body)',
        fontWeight: 600,
        opacity: disabled ? 0.5 : 1,
        transition: 'background var(--vellum-duration-fast), transform var(--vellum-duration-fast)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      }}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        borderRadius: '50%',
        border: '2px solid currentColor',
        borderRightColor: 'transparent',
        animation: 'vellum-spin 0.7s linear infinite',
      }}
    >
      <style>{`@keyframes vellum-spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

Button.displayName = 'Button';
