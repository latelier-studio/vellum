import type { ReactNode } from 'react';

export type StickerProps = {
  /** Rotation in degrees for that hand-stuck feel. */
  rotation?: number;
  /** Color: accent or ink. */
  color?: 'accent' | 'ink' | 'paper';
  children?: ReactNode;
};

export function Sticker({ rotation = -4, color = 'accent', children = 'LIMITED' }: StickerProps) {
  const bg = color === 'accent' ? 'var(--vellum-color-accent)' : color === 'ink' ? 'var(--vellum-color-fg)' : 'var(--vellum-color-bg)';
  const fg = color === 'accent' || color === 'ink' ? 'var(--vellum-color-accent-fg)' : 'var(--vellum-color-fg)';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 14px',
        background: bg,
        color: fg,
        border: '2px solid var(--vellum-color-fg)',
        borderRadius: 0,
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        transform: `rotate(${rotation}deg)`,
        boxShadow: '3px 3px 0 var(--vellum-color-fg)',
      }}
    >
      {children}
    </span>
  );
}

Sticker.displayName = 'Sticker';
