/**
 * Per-component Docs <-> Workbench tabs.
 *
 * Replaces the global chrome top-right mode toggle. Sits inline with the
 * component header so it visually belongs to that one component, not the
 * whole site shell. shadcn-style.
 */
export function ModeTabs({
  current,
  docsHref,
  workbenchHref,
  onNavigate,
}: {
  current: 'docs' | 'workbench';
  docsHref: string;
  workbenchHref: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0,
        padding: 2,
        background: 'color-mix(in oklab, var(--vellum-color-fg) 5%, transparent)',
        border: '1px solid var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-md)',
      }}
    >
      <Tab active={current === 'docs'} href={docsHref} onNavigate={onNavigate} label="Docs" />
      <Tab active={current === 'workbench'} href={workbenchHref} onNavigate={onNavigate} label="Workbench" />
    </div>
  );
}

function Tab({
  active,
  href,
  onNavigate,
  label,
}: {
  active: boolean;
  href: string;
  onNavigate: (p: string) => void;
  label: string;
}) {
  return (
    <a
      href={href}
      role="tab"
      aria-selected={active}
      onClick={(e) => {
        e.preventDefault();
        if (!active) onNavigate(href);
      }}
      style={{
        paddingBlock: 6,
        paddingInline: 12,
        textDecoration: 'none',
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 600,
        color: active ? 'var(--vellum-color-bg)' : 'var(--vellum-color-fg)',
        background: active ? 'var(--vellum-color-fg)' : 'transparent',
        borderRadius: 'calc(var(--vellum-radius-md) - 2px)',
        cursor: active ? 'default' : 'pointer',
        transition: 'background var(--vellum-duration-fast) var(--vellum-easing), color var(--vellum-duration-fast) var(--vellum-easing)',
      }}
    >
      {label}
    </a>
  );
}
