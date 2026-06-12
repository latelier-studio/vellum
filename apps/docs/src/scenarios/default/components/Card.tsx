import type { ReactNode } from 'react';

export type CardProps = {
  /** Card heading. */
  title?: string;
  /** Subtitle below the heading. */
  subtitle?: string;
  /** Show an elevated shadow. */
  elevated?: boolean;
  children?: ReactNode;
};

export function Card({ title, subtitle, elevated, children }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--vellum-color-bg)',
        border: '1px solid var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-lg)',
        boxShadow: elevated ? 'var(--vellum-shadow-md)' : 'none',
        padding: 'var(--vellum-space-5)',
        maxWidth: 360,
        fontFamily: 'var(--vellum-font-body)',
      }}
    >
      {title ? (
        <div style={{ marginBottom: 8 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--vellum-font-display)',
              fontSize: 'var(--vellum-text-lg)',
              fontWeight: 'var(--vellum-font-display-weight)' as unknown as number,
              color: 'var(--vellum-color-fg)',
            }}
          >
            {title}
          </h3>
          {subtitle ? (
            <p
              style={{
                margin: 0,
                marginTop: 4,
                color: 'var(--vellum-color-muted-fg)',
                fontSize: 'var(--vellum-text-sm)',
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      ) : null}
      <div style={{ color: 'var(--vellum-color-fg)', fontSize: 'var(--vellum-text-md)' }}>
        {children}
      </div>
    </div>
  );
}

Card.displayName = 'Card';
