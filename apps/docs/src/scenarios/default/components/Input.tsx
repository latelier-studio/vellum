import type { ChangeEvent } from 'react';

export type InputProps = {
  /** Placeholder shown when the input is empty. */
  placeholder?: string;
  /** Current value. */
  value?: string;
  /** Size scale. */
  size?: 'sm' | 'md' | 'lg';
  /** Disabled state. */
  disabled?: boolean;
  /** Error state — shows a red ring and ignores focus styles. */
  invalid?: boolean;
  /** Change handler. */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
};

const SIZE_PAD: Record<NonNullable<InputProps['size']>, string> = {
  sm: '4px 8px',
  md: '8px 12px',
  lg: '12px 16px',
};

export function Input({ placeholder, value, size = 'md', disabled, invalid, onChange }: InputProps) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      disabled={disabled}
      onChange={onChange}
      style={{
        padding: SIZE_PAD[size],
        background: 'var(--vellum-color-bg)',
        color: 'var(--vellum-color-fg)',
        border: `1px solid ${invalid ? 'oklch(0.55 0.21 25)' : 'var(--vellum-color-border)'}`,
        borderRadius: 'var(--vellum-radius-md)',
        fontFamily: 'var(--vellum-font-body)',
        fontSize: 'var(--vellum-text-sm)',
        width: 240,
        outline: 'none',
        transition: 'border-color var(--vellum-duration-fast) var(--vellum-easing)',
      }}
    />
  );
}

Input.displayName = 'Input';
