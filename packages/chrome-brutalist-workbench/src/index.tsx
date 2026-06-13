import { useEffect, useMemo, useRef, useState } from 'react';
import { useManifest, useTokens } from '@vellum/react';
import { isHidden, type ComponentEntry, type PropType, type StoryEntry } from '@vellum/story';

function visibleManifestComponents(components: ComponentEntry[]): ComponentEntry[] {
  return components
    .filter((c) => !isHidden(c))
    .map((c) => ({ ...c, stories: c.stories.filter((s) => !isHidden(s)) }));
}
import {
  DEFAULT_VIEWPORTS,
  type A11yResult,
  type PreviewMessageFromChild,
  type PreviewMessageFromParent,
  type ViewportSpec,
} from '@vellum/preview';

/**
 * Brutalist Workbench chrome.
 * Same data inputs as minimal workbench. Different layout language:
 *   - Hairline rules between every region.
 *   - All labels mono caps with tracking.
 *   - Numbered story rows (01/N) in left tree.
 *   - Sharp corners, no shadows.
 *   - Panels rendered as labeled regions with header rules.
 */
export type WorkbenchChromeProps = {
  siteName?: string;
  currentStoryId: string | null;
  onSelectStory: (storyId: string) => void;
  /** Per-component navigation. */
  onNavigate?: (path: string) => void;
  /** @deprecated use `onNavigate` — kept for backward compat. */
  onModeChange?: () => void;
  previewBase?: string;
};

type ActionLog = { id: number; name: string; args: unknown[]; timestamp: number };
type Tab = 'controls' | 'a11y' | 'actions' | 'code';

export function WorkbenchChrome({
  siteName,
  currentStoryId,
  onSelectStory,
  onNavigate,
  onModeChange,
  previewBase = '/preview',
}: WorkbenchChromeProps) {
  const manifest = useManifest();
  const tokens = useTokens();
  const name = siteName ?? tokens.meta.name ?? 'Vellum';
  const current = useMemo(() => findCurrent(manifest.components, currentStoryId), [manifest, currentStoryId]);
  const [args, setArgs] = useState<Record<string, unknown>>(() => current?.story.args ?? {});
  const [viewport, setViewport] = useState<ViewportSpec>(DEFAULT_VIEWPORTS[0]!);
  const [background, setBackground] = useState<string>('var(--vellum-color-bg)');
  const [actions, setActions] = useState<ActionLog[]>([]);
  const [a11y, setA11y] = useState<A11yResult | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('controls');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (current) setArgs(current.story.args);
    setActions([]);
    setA11y(null);
  }, [current?.story.id]);

  useEffect(() => {
    const onMessage = (e: MessageEvent<PreviewMessageFromChild>) => {
      const data = e.data;
      if (!data || typeof data !== 'object' || !('type' in data)) return;
      if (data.type === 'preview:action') {
        setActions((prev) => [
          ...prev,
          { id: prev.length, name: data.name, args: data.args, timestamp: Date.now() },
        ]);
      } else if (data.type === 'preview:a11y-result') {
        setA11y(data.result);
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const postToPreview = (msg: PreviewMessageFromParent) => {
    iframeRef.current?.contentWindow?.postMessage(msg, '*');
  };

  useEffect(() => {
    if (!current) return;
    const cleanArgs = Object.fromEntries(
      Object.entries(args).filter(([, v]) => typeof v !== 'function'),
    );
    postToPreview({ type: 'preview:set-args', storyId: current.story.id, args: cleanArgs });
  }, [args, current?.story.id]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px 1fr 360px',
        gridTemplateRows: '56px 1fr',
        gridTemplateAreas: '"header header header" "tree main panels"',
        height: '100vh',
        background: 'var(--vellum-color-bg)',
        color: 'var(--vellum-color-fg)',
        fontFamily: 'var(--vellum-font-body)',
        fontSize: 13,
        overflow: 'hidden',
      }}
    >
      <Header
        name={name}
        viewport={viewport}
        onViewport={setViewport}
        background={background}
        onBackground={setBackground}
        onModeChange={onModeChange}
        currentComponent={current?.component ?? null}
        currentStory={current?.story ?? null}
        onNavigate={onNavigate}
      />
      <StoryTree components={visibleManifestComponents(manifest.components)} currentStoryId={current?.story.id ?? null} onSelectStory={onSelectStory} />
      <PreviewStage current={current} viewport={viewport} background={background} previewBase={previewBase} iframeRef={iframeRef} />
      <Panels
        active={activeTab}
        onActiveChange={setActiveTab}
        component={current?.component ?? null}
        story={current?.story ?? null}
        args={args}
        onArgsChange={setArgs}
        actions={actions}
        onClearActions={() => setActions([])}
        a11y={a11y}
        onRunA11y={() => postToPreview({ type: 'preview:run-a11y' })}
      />
    </div>
  );
}

function findCurrent(
  components: ComponentEntry[],
  storyId: string | null,
): { component: ComponentEntry; story: StoryEntry } | null {
  if (!storyId) {
    const first = components[0];
    const story = first?.stories[0];
    return first && story ? { component: first, story } : null;
  }
  for (const c of components) {
    const s = c.stories.find((s) => s.id === storyId);
    if (s) return { component: c, story: s };
  }
  return null;
}

const monoCaps: React.CSSProperties = {
  fontFamily: 'var(--vellum-font-mono)',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
};

function Header({
  name,
  viewport,
  onViewport,
  background,
  onBackground,
  onModeChange,
  currentComponent,
  currentStory,
  onNavigate,
}: {
  name: string;
  viewport: ViewportSpec;
  onViewport: (v: ViewportSpec) => void;
  background: string;
  onBackground: (v: string) => void;
  onModeChange?: () => void;
  currentComponent: ComponentEntry | null;
  currentStory: StoryEntry | null;
  onNavigate?: (path: string) => void;
}) {
  return (
    <header
      style={{
        gridArea: 'header',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: 20,
        borderBottom: '1px solid var(--vellum-color-fg)',
        background: 'var(--vellum-color-bg)',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--vellum-font-display, var(--vellum-font-body))',
            fontWeight: 900,
            fontSize: 14,
            letterSpacing: '-0.01em',
            textTransform: 'uppercase',
            color: 'var(--vellum-color-muted-fg)',
          }}
        >
          {name}
        </span>
        {currentComponent ? (
          <>
            <span style={{ ...monoCaps, color: 'var(--vellum-color-fg)' }}>// {currentComponent.name}</span>
            {currentStory ? (
              <span style={{ ...monoCaps, color: 'var(--vellum-color-muted-fg)' }}>· {currentStory.name}</span>
            ) : null}
            {onNavigate ? (
              <BrutalistModeTabs current="workbench" componentId={currentComponent.id} storyId={currentStory?.id} onNavigate={onNavigate} />
            ) : null}
          </>
        ) : (
          <span style={{ ...monoCaps, color: 'var(--vellum-color-muted-fg)' }}>// Workbench</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <RuledSelect
          label="Viewport"
          value={viewport.id}
          onChange={(id) => {
            const next = DEFAULT_VIEWPORTS.find((v) => v.id === id);
            if (next) onViewport(next);
          }}
          options={DEFAULT_VIEWPORTS.map((v) => ({ value: v.id, label: v.width > 0 ? `${v.name} ${v.width}` : v.name }))}
        />
        <RuledSelect
          label="Bg"
          value={background === 'var(--vellum-color-bg)' ? 'token' : background === 'var(--vellum-color-muted)' ? 'muted' : background === '#ffffff' ? 'white' : 'black'}
          onChange={(v) => {
            const map: Record<string, string> = {
              token: 'var(--vellum-color-bg)',
              muted: 'var(--vellum-color-muted)',
              white: '#ffffff',
              black: '#000000',
            };
            if (map[v]) onBackground(map[v]);
          }}
          options={[
            { value: 'token', label: 'Token' },
            { value: 'muted', label: 'Muted' },
            { value: 'white', label: 'White' },
            { value: 'black', label: 'Black' },
          ]}
        />
        {!onNavigate && onModeChange ? (
          <button
            type="button"
            onClick={onModeChange}
            style={{
              ...monoCaps,
              background: 'transparent',
              border: 0,
              color: 'var(--vellum-color-fg)',
              cursor: 'pointer',
              padding: '6px 0',
            }}
          >
            ← Docs
          </button>
        ) : null}
      </div>
    </header>
  );
}

function BrutalistModeTabs({
  current,
  componentId,
  storyId,
  onNavigate,
}: {
  current: 'docs' | 'workbench';
  componentId: string;
  storyId?: string;
  onNavigate: (path: string) => void;
}) {
  const docsHref = `/docs/${componentId}`;
  const workbenchHref = `/workbench/${storyId ?? `${componentId}--default`}`;
  const tab = (label: string, href: string, active: boolean) => (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        if (!active) onNavigate(href);
      }}
      style={{
        ...monoCaps,
        paddingBlock: 4,
        paddingInline: 8,
        textDecoration: 'none',
        color: active ? 'var(--vellum-color-bg)' : 'var(--vellum-color-fg)',
        background: active ? 'var(--vellum-color-fg)' : 'transparent',
        border: '1px solid var(--vellum-color-fg)',
        cursor: active ? 'default' : 'pointer',
      }}
    >
      {label}
    </a>
  );
  return (
    <div role="tablist" style={{ marginLeft: 8, display: 'inline-flex', gap: 0 }}>
      {tab('Docs', docsHref, current === 'docs')}
      {tab('Workbench', workbenchHref, current === 'workbench')}
    </div>
  );
}

function RuledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...monoCaps, color: 'var(--vellum-color-muted-fg)' }}>
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          background: 'var(--vellum-color-bg)',
          color: 'var(--vellum-color-fg)',
          border: '1px solid var(--vellum-color-fg)',
          borderRadius: 0,
          padding: '4px 24px 4px 8px',
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          backgroundImage:
            'linear-gradient(45deg, transparent 50%, currentColor 50%), linear-gradient(135deg, currentColor 50%, transparent 50%)',
          backgroundPosition: 'right 10px center, right 6px center',
          backgroundSize: '4px 4px, 4px 4px',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ textTransform: 'none', letterSpacing: 'normal' }}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function StoryTree({
  components,
  currentStoryId,
  onSelectStory,
}: {
  components: ComponentEntry[];
  currentStoryId: string | null;
  onSelectStory: (id: string) => void;
}) {
  return (
    <nav
      aria-label="Story tree"
      style={{
        gridArea: 'tree',
        borderRight: '1px solid var(--vellum-color-fg)',
        overflowY: 'auto',
        padding: '16px 12px',
      }}
    >
      <div style={{ display: 'grid', gap: 18 }}>
        {components.map((c) => (
          <div key={c.id}>
            <div
              style={{
                ...monoCaps,
                paddingBottom: 6,
                borderBottom: '1px solid var(--vellum-color-fg)',
                marginBottom: 6,
                color: 'var(--vellum-color-fg)',
                fontWeight: 700,
              }}
            >
              {c.title}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {c.stories.map((s, idx) => {
                const active = s.id === currentStoryId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelectStory(s.id)}
                      style={{
                        position: 'relative',
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        alignItems: 'baseline',
                        gap: 12,
                        width: '100%',
                        textAlign: 'left',
                        padding: '5px 6px 5px 18px',
                        border: 0,
                        background: 'transparent',
                        cursor: 'pointer',
                        fontFamily: 'var(--vellum-font-mono)',
                        fontSize: 13,
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
                            top: 9,
                            width: 8,
                            height: 8,
                            background: 'var(--vellum-color-accent)',
                          }}
                        />
                      ) : null}
                      <span style={{ ...monoCaps, fontSize: 10, color: active ? 'var(--vellum-color-accent)' : 'var(--vellum-color-muted-fg)', fontWeight: 700 }}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span>{s.name}</span>
                    </button>
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

function PreviewStage({
  current,
  viewport,
  background,
  previewBase,
  iframeRef,
}: {
  current: { component: ComponentEntry; story: StoryEntry } | null;
  viewport: ViewportSpec;
  background: string;
  previewBase: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}) {
  return (
    <main
      style={{
        gridArea: 'main',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: 'var(--vellum-color-bg)',
        backgroundImage: `repeating-linear-gradient(
          to right,
          transparent,
          transparent calc(8.333% - 1px),
          color-mix(in oklab, var(--vellum-color-fg) 5%, transparent) calc(8.333% - 1px),
          color-mix(in oklab, var(--vellum-color-fg) 5%, transparent) 8.333%
        )`,
        overflow: 'auto',
      }}
    >
      {current ? (
        <div
          style={{
            background,
            border: '1px solid var(--vellum-color-fg)',
            width: viewport.width > 0 ? viewport.width : '100%',
            height: viewport.height > 0 ? viewport.height : '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            transition: 'width 220ms, height 220ms',
            position: 'relative',
          }}
        >
          {/* corner ticks for brutalist feel */}
          <CornerTicks />
          <iframe
            ref={iframeRef}
            title={`${current.story.name} preview`}
            src={`${previewBase}/${current.story.id}`}
            style={{ width: '100%', height: '100%', border: 0, background: 'transparent', display: 'block' }}
          />
        </div>
      ) : (
        <div style={{ ...monoCaps, color: 'var(--vellum-color-muted-fg)' }}>// Select a story</div>
      )}
    </main>
  );
}

function CornerTicks() {
  const t: React.CSSProperties = {
    position: 'absolute',
    width: 10,
    height: 10,
    pointerEvents: 'none',
  };
  return (
    <>
      <span style={{ ...t, top: -1, left: -1, borderTop: '1px solid var(--vellum-color-accent)', borderLeft: '1px solid var(--vellum-color-accent)' }} />
      <span style={{ ...t, top: -1, right: -1, borderTop: '1px solid var(--vellum-color-accent)', borderRight: '1px solid var(--vellum-color-accent)' }} />
      <span style={{ ...t, bottom: -1, left: -1, borderBottom: '1px solid var(--vellum-color-accent)', borderLeft: '1px solid var(--vellum-color-accent)' }} />
      <span style={{ ...t, bottom: -1, right: -1, borderBottom: '1px solid var(--vellum-color-accent)', borderRight: '1px solid var(--vellum-color-accent)' }} />
    </>
  );
}

function Panels({
  active,
  onActiveChange,
  component,
  story,
  args,
  onArgsChange,
  actions,
  onClearActions,
  a11y,
  onRunA11y,
}: {
  active: Tab;
  onActiveChange: (t: Tab) => void;
  component: ComponentEntry | null;
  story: StoryEntry | null;
  args: Record<string, unknown>;
  onArgsChange: (next: Record<string, unknown>) => void;
  actions: ActionLog[];
  onClearActions: () => void;
  a11y: A11yResult | null;
  onRunA11y: () => void;
}) {
  return (
    <aside
      style={{
        gridArea: 'panels',
        borderLeft: '1px solid var(--vellum-color-fg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--vellum-color-bg)',
      }}
    >
      <TabBar active={active} onChange={onActiveChange} />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {story && component ? <PanelHeader story={story} component={component} /> : null}
        {component && story ? (
          <PanelBody
            tab={active}
            component={component}
            story={story}
            args={args}
            onArgsChange={onArgsChange}
            actions={actions}
            onClearActions={onClearActions}
            a11y={a11y}
            onRunA11y={onRunA11y}
          />
        ) : null}
      </div>
    </aside>
  );
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: Tab[] = ['controls', 'a11y', 'actions', 'code'];
  return (
    <div
      role="tablist"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        borderBottom: '1px solid var(--vellum-color-fg)',
      }}
    >
      {tabs.map((t) => {
        const on = active === t;
        return (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(t)}
            style={{
              ...monoCaps,
              padding: '14px 8px',
              border: 0,
              borderRight: '1px solid var(--vellum-color-fg)',
              borderBottom: on ? '3px solid var(--vellum-color-accent)' : '3px solid transparent',
              marginBottom: -1,
              background: 'transparent',
              cursor: 'pointer',
              color: on ? 'var(--vellum-color-fg)' : 'var(--vellum-color-muted-fg)',
              fontWeight: on ? 700 : 500,
            }}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

function PanelHeader({ story, component }: { story: StoryEntry; component: ComponentEntry }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--vellum-color-fg)' }}>
      <div style={{ ...monoCaps, color: 'var(--vellum-color-muted-fg)' }}>{component.title}</div>
      <div
        style={{
          fontFamily: 'var(--vellum-font-display, var(--vellum-font-body))',
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: '-0.02em',
          textTransform: 'uppercase',
          marginTop: 4,
        }}
      >
        {story.name}
      </div>
    </div>
  );
}

function PanelBody(props: {
  tab: Tab;
  component: ComponentEntry;
  story: StoryEntry;
  args: Record<string, unknown>;
  onArgsChange: (args: Record<string, unknown>) => void;
  actions: ActionLog[];
  onClearActions: () => void;
  a11y: A11yResult | null;
  onRunA11y: () => void;
}) {
  const { tab, component, story, args, onArgsChange, actions, onClearActions, a11y, onRunA11y } = props;
  if (tab === 'controls') return <ControlsPanel component={component} args={args} onArgsChange={onArgsChange} />;
  if (tab === 'a11y') return <A11yPanel a11y={a11y} onRun={onRunA11y} />;
  if (tab === 'actions') return <ActionsPanel actions={actions} onClear={onClearActions} />;
  return <CodePanel componentName={component.name} story={story} args={args} />;
}

function ControlsPanel({
  component,
  args,
  onArgsChange,
}: {
  component: ComponentEntry;
  args: Record<string, unknown>;
  onArgsChange: (args: Record<string, unknown>) => void;
}) {
  const props = component.propsSchema?.props ?? [];
  if (props.length === 0) {
    return <EmptyHint>// No prop schema</EmptyHint>;
  }
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {props.map((p, i) => (
        <div key={p.name} style={{ borderTop: i === 0 ? '0' : '1px solid var(--vellum-color-border)', paddingTop: i === 0 ? 0 : 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 12, fontWeight: 700 }}>
              {p.name}{p.required ? <span style={{ color: 'var(--vellum-color-accent)' }}>*</span> : null}
            </span>
            <span style={{ ...monoCaps, color: 'var(--vellum-color-muted-fg)' }}>{typeShort(p.type)}</span>
          </div>
          <ControlInput
            propType={p.type}
            value={args[p.name]}
            onChange={(v) => onArgsChange({ ...args, [p.name]: v })}
          />
          {p.description ? (
            <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--vellum-color-muted-fg)', lineHeight: 1.5 }}>{p.description}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function ControlInput({
  propType,
  value,
  onChange,
}: {
  propType: PropType;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 10px',
    background: 'var(--vellum-color-bg)',
    color: 'var(--vellum-color-fg)',
    border: '1px solid var(--vellum-color-fg)',
    borderRadius: 0,
    fontFamily: 'var(--vellum-font-mono)',
    fontSize: 12,
  };

  if (propType.kind === 'boolean') {
    return (
      <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, ...monoCaps, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: 'var(--vellum-color-accent)' }} />
        <span>{value ? 'TRUE' : 'FALSE'}</span>
      </label>
    );
  }
  if (propType.kind === 'number') {
    return (
      <input
        type="number"
        style={baseStyle}
        value={typeof value === 'number' ? value : ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
      />
    );
  }
  if (propType.kind === 'string') {
    return (
      <input
        type="text"
        style={baseStyle}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (propType.kind === 'enum') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, border: '1px solid var(--vellum-color-fg)' }}>
        {propType.options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              style={{
                flex: 1,
                padding: '6px 8px',
                background: active ? 'var(--vellum-color-fg)' : 'transparent',
                color: active ? 'var(--vellum-color-bg)' : 'var(--vellum-color-fg)',
                border: 0,
                borderLeft: '1px solid var(--vellum-color-fg)',
                fontFamily: 'var(--vellum-font-mono)',
                fontSize: 11,
                letterSpacing: '0.08em',
                textTransform: 'lowercase',
                cursor: 'pointer',
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
    );
  }
  if (propType.kind === 'range') {
    const num = typeof value === 'number' ? value : propType.min ?? 0;
    return (
      <div style={{ display: 'grid', gap: 4 }}>
        <input
          type="range"
          min={propType.min}
          max={propType.max}
          step={propType.step ?? 1}
          value={num}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--vellum-color-accent)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--vellum-font-mono)', fontSize: 10, color: 'var(--vellum-color-muted-fg)', letterSpacing: '0.08em' }}>
          <span>{propType.min ?? '−∞'}</span>
          <span style={{ color: 'var(--vellum-color-fg)' }}>{num}</span>
          <span>{propType.max ?? '+∞'}</span>
        </div>
      </div>
    );
  }
  if (propType.kind === 'multi-enum') {
    const selected = new Set(Array.isArray(value) ? (value as string[]) : []);
    const toggle = (opt: string) => {
      if (selected.has(opt)) selected.delete(opt);
      else selected.add(opt);
      onChange(Array.from(selected));
    };
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {propType.options.map((o) => {
          const active = selected.has(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              style={{
                paddingBlock: 5,
                paddingInline: 10,
                background: active ? 'var(--vellum-color-fg)' : 'transparent',
                color: active ? 'var(--vellum-color-bg)' : 'var(--vellum-color-fg)',
                border: '1px solid var(--vellum-color-fg)',
                borderRadius: 0,
                fontFamily: 'var(--vellum-font-mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              {active ? '[x] ' : '[ ] '}{o}
            </button>
          );
        })}
      </div>
    );
  }
  if (propType.kind === 'date') {
    const dateStr = typeof value === 'string' || typeof value === 'number' ? new Date(value).toISOString().slice(0, 10) : '';
    return (
      <input
        type="date"
        style={baseStyle}
        value={dateStr}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  if (propType.kind === 'function') {
    return <Hint>function — captured in actions</Hint>;
  }
  return <Hint>{propType.kind}</Hint>;
}

function A11yPanel({ a11y, onRun }: { a11y: A11yResult | null; onRun: () => void }) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <button
        type="button"
        onClick={onRun}
        style={{
          ...monoCaps,
          background: 'var(--vellum-color-accent)',
          color: 'var(--vellum-color-accent-fg)',
          border: 0,
          padding: '10px 14px',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: '0.14em',
        }}
      >
        Run axe scan →
      </button>
      {!a11y ? (
        <EmptyHint>// No scan yet</EmptyHint>
      ) : (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--vellum-color-fg)', borderBottom: '1px solid var(--vellum-color-fg)' }}>
            <Stat label="VIOLATIONS" value={a11y.violations.length} accent={a11y.violations.length > 0} />
            <Stat label="PASSED" value={a11y.passes} divided />
            <Stat label="INCOMPLETE" value={a11y.incomplete} divided />
          </div>
          {a11y.violations.length === 0 ? (
            <EmptyHint>// No violations.</EmptyHint>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {a11y.violations.map((v) => (
                <li
                  key={v.id}
                  style={{
                    borderTop: '1px solid var(--vellum-color-border)',
                    padding: '10px 0',
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                    <span style={{ ...monoCaps, color: 'var(--vellum-color-accent)' }}>{v.impact ?? '?'}</span>
                    <strong style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 12 }}>{v.id}</strong>
                  </div>
                  <p style={{ margin: '4px 0', fontSize: 13 }}>{v.description}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--vellum-color-muted-fg)' }}>{v.help}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent, divided }: { label: string; value: number; accent?: boolean; divided?: boolean }) {
  return (
    <div style={{ padding: '12px 10px', borderLeft: divided ? '1px solid var(--vellum-color-fg)' : '0' }}>
      <div
        style={{
          fontFamily: 'var(--vellum-font-display, var(--vellum-font-body))',
          fontSize: 32,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          color: accent ? 'var(--vellum-color-accent)' : 'var(--vellum-color-fg)',
        }}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div style={{ ...monoCaps, color: 'var(--vellum-color-muted-fg)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function ActionsPanel({ actions, onClear }: { actions: ActionLog[]; onClear: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ ...monoCaps, color: 'var(--vellum-color-muted-fg)' }}>{String(actions.length).padStart(2, '0')} EVENTS</span>
        <button
          type="button"
          onClick={onClear}
          style={{
            ...monoCaps,
            background: 'transparent',
            border: '1px solid var(--vellum-color-fg)',
            padding: '4px 8px',
            cursor: 'pointer',
            color: 'var(--vellum-color-fg)',
          }}
        >
          Clear
        </button>
      </div>
      {actions.length === 0 ? (
        <EmptyHint>// Trigger interactions in the preview</EmptyHint>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {actions.map((a, i) => (
            <li
              key={a.id}
              style={{
                fontFamily: 'var(--vellum-font-mono)',
                fontSize: 12,
                padding: '8px 10px',
                borderTop: '1px solid var(--vellum-color-border)',
                display: 'grid',
                gridTemplateColumns: '32px 1fr',
                gap: 8,
              }}
            >
              <span style={{ color: 'var(--vellum-color-muted-fg)' }}>{String(i + 1).padStart(2, '0')}</span>
              <span>
                <span style={{ color: 'var(--vellum-color-accent)' }}>{a.name}</span>
                <span style={{ color: 'var(--vellum-color-muted-fg)' }}>
                  ({a.args.map((arg, j) => (j > 0 ? ', ' : '') + JSON.stringify(arg)).join('')})
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function CodePanel({
  componentName,
  story,
  args,
}: {
  componentName: string;
  story: StoryEntry;
  args: Record<string, unknown>;
}) {
  const code = formatCSF(componentName, story.name, args);
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(code).catch(() => {})}
        style={{
          ...monoCaps,
          background: 'transparent',
          border: '1px solid var(--vellum-color-fg)',
          padding: '6px 10px',
          cursor: 'pointer',
          color: 'var(--vellum-color-fg)',
          justifySelf: 'start',
        }}
      >
        Copy CSF
      </button>
      <pre
        style={{
          margin: 0,
          padding: 12,
          background: 'var(--vellum-color-muted)',
          border: '1px solid var(--vellum-color-fg)',
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 12,
          lineHeight: 1.6,
          overflow: 'auto',
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...monoCaps, margin: 0, padding: '12px 0', color: 'var(--vellum-color-muted-fg)' }}>{children}</p>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 12, color: 'var(--vellum-color-muted-fg)' }}>{children}</span>;
}

function typeShort(t: PropType): string {
  switch (t.kind) {
    case 'enum':
      return t.options.length <= 3 ? t.options.join(' | ') : `${t.options.length} options`;
    case 'union':
      return t.members.map(typeShort).join(' | ');
    case 'unknown':
      return t.raw;
    default:
      return t.kind;
  }
}

function formatCSF(componentName: string, storyName: string, args: Record<string, unknown>): string {
  const safe = pascalCase(storyName);
  const literal =
    Object.keys(args).length === 0
      ? ''
      : `\n  args: ${JSON.stringify(args, null, 2).replace(/\n/g, '\n  ')},\n`;
  return `export const ${safe}: StoryObj<typeof ${componentName}> = {${literal}};\n`;
}

function pascalCase(s: string): string {
  return s.replace(/(^|\s+)(.)/g, (_, _ws, ch) => ch.toUpperCase()).replace(/\s+/g, '');
}
