import type { ReactNode } from 'react';

export type StatusPillProps = {
  /** Issue status. */
  status?: 'backlog' | 'todo' | 'in-progress' | 'in-review' | 'done' | 'canceled';
  children?: ReactNode;
};

const STATUS: Record<NonNullable<StatusPillProps['status']>, { color: string; label: string; icon: ReactNode }> = {
  backlog: {
    color: '#9b9ba6',
    label: 'Backlog',
    icon: <Circle color="#9b9ba6" progress={0} />,
  },
  todo: {
    color: '#9b9ba6',
    label: 'Todo',
    icon: <Circle color="#9b9ba6" progress={0} solid />,
  },
  'in-progress': {
    color: '#f2c94c',
    label: 'In Progress',
    icon: <Circle color="#f2c94c" progress={0.45} solid />,
  },
  'in-review': {
    color: '#8b6dff',
    label: 'In Review',
    icon: <Circle color="#8b6dff" progress={0.75} solid />,
  },
  done: {
    color: 'var(--vellum-color-accent)',
    label: 'Done',
    icon: <Circle color="var(--vellum-color-accent)" progress={1} solid />,
  },
  canceled: {
    color: '#9b9ba6',
    label: 'Canceled',
    icon: <span style={{ color: '#9b9ba6', fontSize: 11 }}>✕</span>,
  },
};

function Circle({ color, progress, solid }: { color: string; progress: number; solid?: boolean }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <circle cx="6" cy="6" r="5" fill="none" stroke={color} strokeWidth="1.5" opacity={solid ? 0.4 : 1} />
      {progress > 0 ? (
        <circle
          cx="6"
          cy="6"
          r="5"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={`${progress * 31.4} 31.4`}
          transform="rotate(-90 6 6)"
        />
      ) : null}
    </svg>
  );
}

export function StatusPill({ status = 'todo', children }: StatusPillProps) {
  const s = STATUS[status];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 8px',
        background: 'var(--vellum-color-muted)',
        color: s.color,
        border: '1px solid var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-md)',
        fontFamily: 'var(--vellum-font-body)',
        fontSize: 12,
        fontWeight: 500,
      }}
    >
      {s.icon}
      <span style={{ color: 'var(--vellum-color-fg)' }}>{children ?? s.label}</span>
    </span>
  );
}

StatusPill.displayName = 'StatusPill';
