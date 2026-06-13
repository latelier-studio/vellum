/**
 * Per-component Docs <-> Workbench toggle.
 *
 * No page navigation — toggles a region within the current ComponentPage.
 * The choice persists in localStorage and reflects in the URL via the `view`
 * search param so deep links work.
 */
export type ViewMode = 'docs' | 'workbench';

export function ModeTabs({
  current,
  onSelect,
}: {
  current: ViewMode;
  onSelect: (mode: ViewMode) => void;
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
      <Tab active={current === 'docs'} onClick={() => onSelect('docs')} label="Docs" />
      <Tab active={current === 'workbench'} onClick={() => onSelect('workbench')} label="Workbench" />
    </div>
  );
}

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => {
        if (!active) onClick();
      }}
      style={{
        paddingBlock: 6,
        paddingInline: 12,
        border: 0,
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        fontWeight: 600,
        color: active ? 'var(--vellum-color-bg)' : 'var(--vellum-color-fg)',
        background: active ? 'var(--vellum-color-fg)' : 'transparent',
        borderRadius: 'calc(var(--vellum-radius-md) - 2px)',
        cursor: active ? 'default' : 'pointer',
        transition:
          'background var(--vellum-duration-fast) var(--vellum-easing), color var(--vellum-duration-fast) var(--vellum-easing)',
      }}
    >
      {label}
    </button>
  );
}
