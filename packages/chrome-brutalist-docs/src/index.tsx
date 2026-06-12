import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useManifest, useTokens } from '@vellum/react';
import { isHidden, type ComponentEntry } from '@vellum/story';

/**
 * Brutalist Docs chrome.
 *
 * Structural enforcement (regardless of user tokens):
 *   - All chrome containers use 0 border-radius.
 *   - No drop shadows on chrome surfaces.
 *   - Hairline rules everywhere.
 *   - Mono caps for ALL labels and indices.
 *   - Numbered indices (01/N) for visible information.
 *   - Wide-aspect grid with a faint background ruling.
 *
 * Token-driven (wears user design.md):
 *   - Colors: bg, fg, border, muted, accent — full palette comes from tokens.
 *   - Typography: chrome ignores body family for chrome elements (forces mono caps),
 *     but the rendered user components inside <Story> still use user tokens.
 *   - Spacing scale: still scaled to user's space.base + density.
 */
export type DocsChromeProps = {
  siteName?: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  onModeChange?: () => void;
  children: ReactNode;
};

export function DocsChrome({
  siteName,
  currentPath,
  onNavigate,
  onModeChange,
  children,
}: DocsChromeProps) {
  const manifest = useManifest();
  const tokens = useTokens();
  const name = siteName ?? tokens.meta.name ?? 'Vellum';
  const visible = useMemo(() => manifest.components.filter((c) => !isHidden(c)), [manifest]);
  const groups = useMemo(() => groupByTitle(visible), [visible]);
  const totalComponents = visible.length;
  const total = totalComponents.toString().padStart(2, '0');

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--vellum-color-bg)',
        color: 'var(--vellum-color-fg)',
        fontFamily: 'var(--vellum-font-body)',
        fontSize: 14,
        lineHeight: 1.55,
        position: 'relative',
      }}
    >
      <GridLines />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <Header name={name} onNavigate={onNavigate} onModeChange={onModeChange} version="V0.1" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '240px 1fr',
            borderTop: '1px solid var(--vellum-color-fg)',
          }}
        >
          <Sidebar groups={groups} currentPath={currentPath} onNavigate={onNavigate} total={total} />
          <main
            style={{
              borderLeft: '1px solid var(--vellum-color-fg)',
              minHeight: 'calc(100vh - 56px)',
              padding: '32px 40px 80px',
            }}
          >
            <div style={{ maxWidth: 980 }}>{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

function GridLines() {
  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        backgroundImage: `repeating-linear-gradient(
          to right,
          transparent,
          transparent calc(8.333% - 1px),
          color-mix(in oklab, var(--vellum-color-fg) 6%, transparent) calc(8.333% - 1px),
          color-mix(in oklab, var(--vellum-color-fg) 6%, transparent) 8.333%
        )`,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

function Header({
  name,
  onNavigate,
  onModeChange,
  version,
}: {
  name: string;
  onNavigate: (path: string) => void;
  onModeChange?: () => void;
  version: string;
}) {
  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 5,
        background: 'var(--vellum-color-bg)',
        height: 56,
        display: 'grid',
        gridTemplateColumns: '240px 1fr 240px',
        alignItems: 'center',
        paddingInline: 24,
      }}
    >
      <a
        href="/docs"
        onClick={(e) => {
          e.preventDefault();
          onNavigate('/docs');
        }}
        style={{
          textDecoration: 'none',
          color: 'var(--vellum-color-fg)',
          fontFamily: 'var(--vellum-font-display, var(--vellum-font-body))',
          fontWeight: 900,
          fontSize: 18,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
        }}
      >
        {name}
      </a>
      <div
        style={{
          textAlign: 'center',
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 11,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--vellum-color-muted-fg)',
        }}
      >
        Design System &nbsp;/&nbsp; {version}
      </div>
      <div style={{ textAlign: 'right' }}>
        <button
          type="button"
          onClick={onModeChange}
          style={{
            background: 'transparent',
            color: 'var(--vellum-color-fg)',
            border: 0,
            fontFamily: 'var(--vellum-font-mono)',
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: '6px 0',
          }}
        >
          → Workbench
        </button>
      </div>
    </header>
  );
}

function Sidebar({
  groups,
  currentPath,
  onNavigate,
  total,
}: {
  groups: Record<string, ComponentEntry[]>;
  currentPath: string;
  onNavigate: (p: string) => void;
  total: string;
}) {
  return (
    <nav
      aria-label="Components"
      style={{
        padding: '24px 16px',
        borderRight: '1px solid var(--vellum-color-fg)',
      }}
    >
      <MonoLine label={`Components`} suffix={total} />
      <div style={{ display: 'grid', gap: 24, marginTop: 16 }}>
        {Object.entries(groups).map(([group, components]) => (
          <div key={group}>
            <div
              style={{
                fontFamily: 'var(--vellum-font-mono)',
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                paddingBottom: 6,
                borderBottom: '1px solid var(--vellum-color-fg)',
                marginBottom: 6,
                color: 'var(--vellum-color-fg)',
                fontWeight: 700,
              }}
            >
              {group}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {components.map((c, i) => {
                const path = `/docs/${c.id}`;
                const active = currentPath === path;
                return (
                  <li key={c.id}>
                    <a
                      href={path}
                      onClick={(e) => {
                        e.preventDefault();
                        onNavigate(path);
                      }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'baseline',
                        gap: 8,
                        padding: '6px 0 6px 16px',
                        position: 'relative',
                        fontFamily: 'var(--vellum-font-mono)',
                        fontSize: 13,
                        textDecoration: 'none',
                        color: active ? 'var(--vellum-color-fg)' : 'var(--vellum-color-muted-fg)',
                        fontWeight: active ? 700 : 400,
                      }}
                    >
                      {active ? (
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 11,
                            width: 8,
                            height: 8,
                            background: 'var(--vellum-color-accent)',
                          }}
                        />
                      ) : null}
                      <span>{c.name}</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--vellum-color-muted-fg)',
                        }}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

function MonoLine({ label, suffix }: { label: string; suffix?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--vellum-color-muted-fg)',
        paddingBottom: 6,
        borderBottom: '1px solid var(--vellum-color-fg)',
      }}
    >
      <span>{label}</span>
      {suffix ? <span>{suffix}</span> : null}
    </div>
  );
}

function groupByTitle(components: ComponentEntry[]): Record<string, ComponentEntry[]> {
  const out: Record<string, ComponentEntry[]> = {};
  for (const c of components) {
    const group = c.title.includes('/') ? c.title.split('/')[0]! : 'Components';
    (out[group] ??= []).push(c);
  }
  return out;
}
