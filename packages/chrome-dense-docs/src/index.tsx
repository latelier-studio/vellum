import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useManifest, useTokens } from '@vellum/react';
import { isHidden, type ComponentEntry } from '@vellum/story';

/**
 * Dense Docs chrome.
 *
 * Tone: Stripe / Linear. High information density, tight spacing, monospace
 * labels everywhere, three-column layout with table-of-contents on the right.
 * Token-driven (tokens drive type, accent and surface colors).
 */
export type DocsChromeProps = {
  siteName?: string;
  currentPath: string;
  onNavigate: (path: string) => void;
  onModeChange?: () => void;
  children: ReactNode;
};

export function DocsChrome({ siteName, currentPath, onNavigate, onModeChange, children }: DocsChromeProps) {
  const manifest = useManifest();
  const tokens = useTokens();
  const name = siteName ?? tokens.meta.name ?? 'Vellum';
  const visible = useMemo(() => manifest.components.filter((c) => !isHidden(c)), [manifest]);
  const groups = useMemo(() => groupByTitle(visible), [visible]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--vellum-color-bg)',
        color: 'var(--vellum-color-fg)',
        fontFamily: 'var(--vellum-font-body)',
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <Header name={name} onModeChange={onModeChange} onNavigate={onNavigate} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr 200px',
          maxWidth: 1400,
          margin: '0 auto',
          gap: 0,
        }}
      >
        <Sidebar groups={groups} currentPath={currentPath} onNavigate={onNavigate} />
        <main
          style={{
            paddingInline: 'var(--vellum-space-6)',
            paddingBlock: 'var(--vellum-space-8)',
            borderInline: '1px solid var(--vellum-color-border)',
            minHeight: 'calc(100vh - 48px)',
          }}
        >
          {children}
        </main>
        <aside
          style={{
            padding: 'var(--vellum-space-4)',
            fontFamily: 'var(--vellum-font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--vellum-color-muted-fg)',
          }}
        >
          <div style={{ marginBottom: 6, color: 'var(--vellum-color-fg)' }}>On this page</div>
          <a href="#stories" style={{ display: 'block', padding: '2px 0', color: 'var(--vellum-color-muted-fg)', textDecoration: 'none' }}>
            01 Stories
          </a>
          <a href="#api" style={{ display: 'block', padding: '2px 0', color: 'var(--vellum-color-muted-fg)', textDecoration: 'none' }}>
            02 API
          </a>
        </aside>
      </div>
    </div>
  );
}

function Header({
  name,
  onNavigate,
  onModeChange,
}: {
  name: string;
  onNavigate: (path: string) => void;
  onModeChange?: () => void;
}) {
  return (
    <header
      style={{
        height: 48,
        borderBottom: '1px solid var(--vellum-color-border)',
        background: 'var(--vellum-color-bg)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          paddingInline: 'var(--vellum-space-6)',
          height: '100%',
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          alignItems: 'center',
          gap: 12,
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
            fontWeight: 600,
            fontSize: 14,
            letterSpacing: '-0.01em',
          }}
        >
          {name} <span style={{ color: 'var(--vellum-color-muted-fg)', fontFamily: 'var(--vellum-font-mono)', fontSize: 10, marginLeft: 6 }}>v0.1</span>
        </a>
        <input
          type="search"
          placeholder="Search... ⌘K"
          style={{
            paddingBlock: 4,
            paddingInline: 10,
            background: 'color-mix(in oklab, var(--vellum-color-fg) 4%, transparent)',
            color: 'var(--vellum-color-fg)',
            border: '1px solid var(--vellum-color-border)',
            borderRadius: 'var(--vellum-radius-sm)',
            fontFamily: 'var(--vellum-font-mono)',
            fontSize: 11,
            width: 200,
          }}
        />
        {onModeChange ? (
          <button
            type="button"
            onClick={onModeChange}
            style={{
              padding: '4px 10px',
              background: 'transparent',
              color: 'var(--vellum-color-fg)',
              border: '1px solid var(--vellum-color-border)',
              borderRadius: 'var(--vellum-radius-sm)',
              fontFamily: 'var(--vellum-font-mono)',
              fontSize: 11,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Workbench →
          </button>
        ) : null}
      </div>
    </header>
  );
}

function Sidebar({
  groups,
  currentPath,
  onNavigate,
}: {
  groups: Record<string, ComponentEntry[]>;
  currentPath: string;
  onNavigate: (p: string) => void;
}) {
  return (
    <nav
      aria-label="Components"
      style={{
        padding: 'var(--vellum-space-4)',
        position: 'sticky',
        top: 48,
        alignSelf: 'start',
        maxHeight: 'calc(100vh - 48px)',
        overflow: 'auto',
      }}
    >
      {Object.entries(groups).map(([group, components]) => (
        <div key={group} style={{ marginBottom: 'var(--vellum-space-4)' }}>
          <div
            style={{
              fontFamily: 'var(--vellum-font-mono)',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--vellum-color-muted-fg)',
              paddingBlock: 4,
              marginBottom: 2,
            }}
          >
            {group}
          </div>
          {components.map((c) => {
            const path = `/docs/${c.id}`;
            const active = currentPath === path;
            return (
              <a
                key={c.id}
                href={path}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(path);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBlock: 3,
                  paddingInline: 6,
                  textDecoration: 'none',
                  color: active ? 'var(--vellum-color-fg)' : 'var(--vellum-color-muted-fg)',
                  background: active ? 'color-mix(in oklab, var(--vellum-color-accent) 10%, transparent)' : 'transparent',
                  borderLeft: active ? '2px solid var(--vellum-color-accent)' : '2px solid transparent',
                  fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  borderRadius: 'var(--vellum-radius-sm)',
                }}
              >
                <span>{c.name}</span>
                <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 10, color: 'var(--vellum-color-muted-fg)' }}>
                  {c.stories.length}
                </span>
              </a>
            );
          })}
        </div>
      ))}
    </nav>
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
