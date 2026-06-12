import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useManifest, useTokens } from '@vellum/react';
import { isHidden, type ComponentEntry } from '@vellum/story';

/**
 * Editorial Docs chrome.
 *
 * Tone: magazine. Oversized display headings, narrow column,
 * top horizontal nav instead of a sidebar, generous whitespace.
 * Token-driven (all colors, type, spacing come from design.md).
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
        fontSize: 17,
        lineHeight: 1.65,
      }}
    >
      <Header name={name} onModeChange={onModeChange} onNavigate={onNavigate} />
      <TopNav groups={groups} currentPath={currentPath} onNavigate={onNavigate} />
      <main
        style={{
          maxWidth: 720,
          margin: '0 auto',
          paddingInline: 'var(--vellum-space-6)',
          paddingBlock: 'var(--vellum-space-12)',
        }}
      >
        {children}
      </main>
      <Footer name={name} />
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
        borderBottom: '1px solid var(--vellum-color-border)',
        background: 'var(--vellum-color-bg)',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          paddingInline: 'var(--vellum-space-6)',
          paddingBlock: 'var(--vellum-space-8)',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          alignItems: 'center',
          gap: 16,
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
            fontSize: 'clamp(28px, 4vw, 40px)',
            letterSpacing: '-0.025em',
            lineHeight: 1,
          }}
        >
          {name}
        </a>
        {onModeChange ? (
          <button
            type="button"
            onClick={onModeChange}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: 'var(--vellum-color-fg)',
              border: '1px solid var(--vellum-color-border)',
              borderRadius: 999,
              fontFamily: 'var(--vellum-font-mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
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

function TopNav({
  groups,
  currentPath,
  onNavigate,
}: {
  groups: Record<string, ComponentEntry[]>;
  currentPath: string;
  onNavigate: (p: string) => void;
}) {
  const flat = Object.entries(groups).flatMap(([g, list]) => list.map((c) => ({ ...c, group: g })));
  if (flat.length === 0) return null;
  return (
    <nav
      aria-label="Components"
      style={{
        borderBottom: '1px solid var(--vellum-color-border)',
        background: 'color-mix(in oklab, var(--vellum-color-bg) 92%, var(--vellum-color-fg) 2%)',
        overflowX: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          paddingInline: 'var(--vellum-space-6)',
          paddingBlock: 'var(--vellum-space-3)',
          display: 'flex',
          gap: 'var(--vellum-space-6)',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--vellum-font-mono)',
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--vellum-color-muted-fg)',
            paddingRight: 'var(--vellum-space-4)',
            borderRight: '1px solid var(--vellum-color-border)',
            whiteSpace: 'nowrap',
          }}
        >
          {flat.length} Pieces
        </span>
        {flat.map((c) => {
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
                fontFamily: 'var(--vellum-font-body)',
                fontSize: 14,
                textDecoration: 'none',
                color: active ? 'var(--vellum-color-fg)' : 'var(--vellum-color-muted-fg)',
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
                paddingBlock: 4,
                borderBottom: active ? '2px solid var(--vellum-color-accent)' : '2px solid transparent',
                transition: 'color var(--vellum-duration-fast) var(--vellum-easing)',
              }}
            >
              {c.name}
            </a>
          );
        })}
      </div>
    </nav>
  );
}

function Footer({ name }: { name: string }) {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--vellum-color-border)',
        paddingBlock: 'var(--vellum-space-8)',
        paddingInline: 'var(--vellum-space-6)',
        textAlign: 'center',
        color: 'var(--vellum-color-muted-fg)',
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}
    >
      {name} · Editorial Edition
    </footer>
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
