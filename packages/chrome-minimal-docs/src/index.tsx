import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { useManifest, useTokens } from '@vellum/react';
import { isHidden, type ComponentEntry } from '@vellum/story';

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
  const groups = useMemo(() => groupByTitle(manifest.components.filter((c) => !isHidden(c))), [manifest]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--vellum-color-bg)',
        color: 'var(--vellum-color-fg)',
        fontFamily: 'var(--vellum-font-body)',
        fontSize: 'var(--vellum-text-md)',
        lineHeight: 1.65,
      }}
    >
      <Header name={name} onNavigate={onNavigate} onModeChange={onModeChange} />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          maxWidth: 1200,
          margin: '0 auto',
          paddingInline: 'var(--vellum-space-6)',
        }}
      >
        <Sidebar groups={groups} currentPath={currentPath} onNavigate={onNavigate} />
        <main
          style={{
            paddingBlock: 'calc(var(--vellum-space-12) + var(--vellum-space-4)) var(--vellum-space-12)',
            paddingInlineStart: 'var(--vellum-space-12)',
            maxWidth: 760,
          }}
        >
          {children}
        </main>
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
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'color-mix(in oklab, var(--vellum-color-bg) 92%, transparent)',
        backdropFilter: 'saturate(160%) blur(8px)',
        WebkitBackdropFilter: 'saturate(160%) blur(8px)',
        borderBottom: '1px solid var(--vellum-color-border)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          paddingInline: 'var(--vellum-space-6)',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--vellum-space-4)',
        }}
      >
        <a
          href="/docs"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('/docs');
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 'var(--vellum-space-2)',
            textDecoration: 'none',
            color: 'var(--vellum-color-fg)',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--vellum-font-display)',
              fontWeight: 600,
              fontSize: 'var(--vellum-text-xl)',
              letterSpacing: '-0.02em',
              fontFeatureSettings: '"ss01"',
            }}
          >
            {name}
          </span>
          <MonoCaps style={{ color: 'var(--vellum-color-muted-fg)' }}>Design System</MonoCaps>
        </a>
        <ModeChip onClick={onModeChange} label="Workbench" direction="right" />
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
        paddingTop: 'calc(var(--vellum-space-12) + var(--vellum-space-4))',
        paddingRight: 'var(--vellum-space-6)',
        borderRight: '1px solid var(--vellum-color-border)',
      }}
    >
      <div style={{ display: 'grid', gap: 'var(--vellum-space-7)' }}>
        {Object.entries(groups).map(([group, components]) => (
          <div key={group}>
            <MonoCaps
              style={{
                marginBottom: 'var(--vellum-space-2)',
                paddingInlineStart: 14,
              }}
            >
              {group}
            </MonoCaps>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 1 }}>
              {components.map((c) => {
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
                        position: 'relative',
                        display: 'block',
                        paddingBlock: 6,
                        paddingInlineStart: 14,
                        textDecoration: 'none',
                        fontSize: 'var(--vellum-text-sm)',
                        color: active
                          ? 'var(--vellum-color-fg)'
                          : 'var(--vellum-color-muted-fg)',
                        fontWeight: active ? 600 : 400,
                        transition: 'color var(--vellum-duration-fast) var(--vellum-easing)',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.color = 'var(--vellum-color-fg)';
                      }}
                      onMouseLeave={(e) => {
                        if (!active)
                          e.currentTarget.style.color = 'var(--vellum-color-muted-fg)';
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 6,
                          bottom: 6,
                          width: 2,
                          borderRadius: 1,
                          background: active ? 'var(--vellum-color-accent)' : 'transparent',
                          transition: 'background var(--vellum-duration-fast) var(--vellum-easing)',
                        }}
                      />
                      {c.name}
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

export function ModeChip({
  onClick,
  label,
  direction,
}: {
  onClick?: () => void;
  label: string;
  direction: 'left' | 'right';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        paddingBlock: 6,
        paddingInline: 12,
        background: 'transparent',
        border: '1px solid var(--vellum-color-border)',
        borderRadius: '999px',
        cursor: 'pointer',
        color: 'var(--vellum-color-fg)',
        fontSize: 'var(--vellum-text-xs)',
        fontFamily: 'var(--vellum-font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        transition:
          'background var(--vellum-duration-fast) var(--vellum-easing), border-color var(--vellum-duration-fast) var(--vellum-easing)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--vellum-color-muted)';
        e.currentTarget.style.borderColor =
          'color-mix(in oklab, var(--vellum-color-fg) 25%, transparent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'var(--vellum-color-border)';
      }}
    >
      {direction === 'left' ? <Arrow direction="left" /> : null}
      <span>{label}</span>
      {direction === 'right' ? <Arrow direction="right" /> : null}
    </button>
  );
}

function Arrow({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      style={{
        transform: direction === 'left' ? 'scaleX(-1)' : undefined,
        transition: 'transform var(--vellum-duration-fast) var(--vellum-easing)',
      }}
      aria-hidden
    >
      <path d="M1 5h7M5 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MonoCaps({
  children,
  style,
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--vellum-color-muted-fg)',
        fontWeight: 500,
        ...style,
      }}
    >
      {children}
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
