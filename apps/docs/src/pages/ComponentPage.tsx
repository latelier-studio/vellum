import { useEffect, useState } from 'react';
import { ArgsTable, Story, useManifest } from '@vellum/react';
import { DEFAULT_VIEWPORTS, type ViewportSpec } from '@vellum/preview';
import { ModeTabs } from '../components/ModeTabs.js';
import { WorkbenchSection } from '../components/WorkbenchSection.js';

type ViewMode = 'docs' | 'workbench';

function useViewMode(componentId: string): [ViewMode, (m: ViewMode) => void] {
  const [mode, setMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'docs';
    const param = new URLSearchParams(window.location.search).get('view');
    if (param === 'workbench' || param === 'docs') return param;
    try {
      const stored = localStorage.getItem('vellum.viewMode');
      return stored === 'workbench' ? 'workbench' : 'docs';
    } catch {
      return 'docs';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vellum.viewMode', mode);
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    if (mode === 'workbench') url.searchParams.set('view', 'workbench');
    else url.searchParams.delete('view');
    window.history.replaceState({}, '', url.toString());
  }, [mode, componentId]);

  return [mode, setMode];
}

export function ComponentPage({
  componentId,
  onNavigate,
}: {
  componentId: string;
  onNavigate: (path: string) => void;
}) {
  const manifest = useManifest();
  const component = manifest.components.find((c) => c.id === componentId);
  const [viewMode, setViewMode] = useViewMode(componentId);
  const [viewport, setViewport] = useState<ViewportSpec>(DEFAULT_VIEWPORTS[0]!);
  const [background, setBackground] = useState<string>('var(--vellum-color-bg)');

  if (!component) {
    return (
      <div
        style={{
          padding: 'var(--vellum-space-8)',
          border: '1px dashed var(--vellum-color-border)',
          borderRadius: 'var(--vellum-radius-md)',
          color: 'var(--vellum-color-muted-fg)',
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <div style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, marginBottom: 8 }}>
          404 · No such component
        </div>
        <code style={{ color: 'var(--vellum-color-fg)' }}>{componentId}</code>{' '}
        isn’t part of this design system.
      </div>
    );
  }

  const [group, name] = component.title.includes('/')
    ? (component.title.split('/') as [string, string])
    : ['Components', component.name];

  const isWorkbench = viewMode === 'workbench';
  const headingSize = isWorkbench ? 'clamp(28px, 3vw, 36px)' : 'clamp(40px, 6vw, 60px)';
  const headerMargin = isWorkbench ? 'var(--vellum-space-5)' : 'var(--vellum-space-8)';

  return (
    <article>
      <header style={{ marginBottom: headerMargin }}>
        <Breadcrumb group={group} name={name} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--vellum-space-6)',
            flexWrap: 'wrap',
            marginTop: 10,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--vellum-font-display)',
              fontSize: headingSize,
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              transition: 'font-size var(--vellum-duration-base) var(--vellum-easing)',
            }}
          >
            {component.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {isWorkbench ? (
              <PreviewControls
                viewport={viewport}
                onViewport={setViewport}
                background={background}
                onBackground={setBackground}
              />
            ) : null}
            <ModeTabs current={viewMode} onSelect={(m) => setViewMode(m)} />
          </div>
        </div>
      </header>

      {isWorkbench ? (
        <WorkbenchSection
          component={component}
          viewport={viewport}
          background={background}
        />
      ) : (
        <>
          <DocsView component={component} />
          <section style={{ marginTop: 'var(--vellum-space-12)' }}>
            <SectionHeader
              index="02"
              label={`${component.propsSchema?.props.length ?? 0} props`}
              title="API"
            />
            <ArgsTable of={component} />
          </section>
        </>
      )}
    </article>
  );
}

function PreviewControls({
  viewport,
  onViewport,
  background,
  onBackground,
}: {
  viewport: ViewportSpec;
  onViewport: (v: ViewportSpec) => void;
  background: string;
  onBackground: (v: string) => void;
}) {
  const bgPresets: Array<{ id: string; value: string; label: string }> = [
    { id: 'token', value: 'var(--vellum-color-bg)', label: 'Token' },
    { id: 'muted', value: 'var(--vellum-color-muted)', label: 'Muted' },
    { id: 'white', value: '#ffffff', label: 'White' },
    { id: 'black', value: '#000000', label: 'Black' },
  ];
  const currentBg = bgPresets.find((p) => p.value === background)?.id ?? 'token';
  return (
    <>
      <HeaderSelect
        label="Viewport"
        value={viewport.id}
        onChange={(id) => {
          const next = DEFAULT_VIEWPORTS.find((v) => v.id === id);
          if (next) onViewport(next);
        }}
        options={DEFAULT_VIEWPORTS.map((v) => ({
          value: v.id,
          label: v.width > 0 ? `${v.name} ${v.width}` : v.name,
        }))}
      />
      <HeaderSelect
        label="Bg"
        value={currentBg}
        onChange={(id) => {
          const p = bgPresets.find((p) => p.id === id);
          if (p) onBackground(p.value);
        }}
        options={bgPresets.map((p) => ({ value: p.id, label: p.label }))}
      />
    </>
  );
}

function HeaderSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        paddingInline: 8,
        paddingBlock: 5,
        background: 'color-mix(in oklab, var(--vellum-color-fg) 5%, transparent)',
        border: '1px solid var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-md)',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 10,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--vellum-color-muted-fg)',
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'transparent',
          color: 'var(--vellum-color-fg)',
          border: 0,
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 11,
          padding: 0,
          paddingRight: 12,
          cursor: 'pointer',
          appearance: 'none',
          MozAppearance: 'none',
          WebkitAppearance: 'none',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function DocsView({ component }: { component: ReturnType<NonNullable<ReturnType<typeof useManifest>>['components']['find']> & {} }) {
  return (
    <section>
      <SectionHeader index="01" label={`${component.stories.length} stories`} title="Stories" />
      <div>
        {component.stories.map((story, i) => (
          <Story key={story.id} of={story} index={i + 1} />
        ))}
      </div>
    </section>
  );
}

function Breadcrumb({ group, name }: { group: string; name: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: 'var(--vellum-color-muted-fg)',
      }}
    >
      <span style={{ color: 'var(--vellum-color-accent)', fontWeight: 600 }}>{group}</span>
      <span aria-hidden>/</span>
      <span style={{ color: 'var(--vellum-color-fg)', fontWeight: 600 }}>{name}</span>
    </div>
  );
}

function SectionHeader({ index, label, title }: { index: string; label: string; title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 'var(--vellum-space-5)',
        paddingBottom: 'var(--vellum-space-3)',
        borderBottom: '1px solid var(--vellum-color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span
          style={{
            fontFamily: 'var(--vellum-font-mono)',
            fontSize: 11,
            color: 'var(--vellum-color-accent)',
            fontWeight: 600,
            letterSpacing: '0.12em',
          }}
        >
          {index}
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--vellum-font-display)',
            fontSize: 'var(--vellum-text-xl)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
      </div>
      <span
        style={{
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--vellum-color-muted-fg)',
        }}
      >
        {label}
      </span>
    </div>
  );
}
