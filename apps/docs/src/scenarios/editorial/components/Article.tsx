import type { ReactNode } from 'react';

export type ArticleProps = {
  /** Article kicker — section label. */
  kicker?: string;
  /** Title. */
  title?: string;
  /** Author byline. */
  byline?: string;
  /** Optional issue label. */
  issue?: string;
  children?: ReactNode;
};

export function Article({
  kicker = 'Field Notes',
  title = 'The long-form return',
  byline = 'Eli Carter',
  issue = 'Issue 04',
}: ArticleProps) {
  return (
    <article
      style={{
        maxWidth: 520,
        fontFamily: 'var(--vellum-font-body)',
        color: 'var(--vellum-color-fg)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 11,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--vellum-color-accent)',
          marginBottom: 12,
        }}
      >
        {kicker} · {issue}
      </div>
      <h1
        style={{
          fontFamily: 'var(--vellum-font-display)',
          fontSize: 'clamp(36px, 4vw, 56px)',
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          margin: 0,
        }}
      >
        {title}
      </h1>
      <div
        style={{
          marginTop: 12,
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 12,
          color: 'var(--vellum-color-muted-fg)',
          letterSpacing: '0.08em',
        }}
      >
        By {byline}
      </div>
    </article>
  );
}

Article.displayName = 'Article';
