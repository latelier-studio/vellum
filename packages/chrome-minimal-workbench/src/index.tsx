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

export type WorkbenchChromeProps = {
  siteName?: string;
  currentStoryId: string | null;
  onSelectStory: (storyId: string) => void;
  onModeChange?: () => void;
  previewBase?: string;
};

type ActionLog = { id: number; name: string; args: unknown[]; timestamp: number };
type Tab = 'controls' | 'a11y' | 'actions' | 'code';

export function WorkbenchChrome({
  siteName,
  currentStoryId,
  onSelectStory,
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
        gridTemplateColumns: '280px 1fr 380px',
        gridTemplateRows: '64px 1fr',
        gridTemplateAreas: '"header header header" "tree main panels"',
        height: '100vh',
        background: 'var(--vellum-color-bg)',
        color: 'var(--vellum-color-fg)',
        fontFamily: 'var(--vellum-font-body)',
        fontSize: 'var(--vellum-text-sm)',
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
      />
      <StoryTree
        components={visibleManifestComponents(manifest.components)}
        currentStoryId={current?.story.id ?? null}
        onSelectStory={onSelectStory}
      />
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

function Header({
  name,
  viewport,
  onViewport,
  background,
  onBackground,
  onModeChange,
}: {
  name: string;
  viewport: ViewportSpec;
  onViewport: (v: ViewportSpec) => void;
  background: string;
  onBackground: (v: string) => void;
  onModeChange?: () => void;
}) {
  return (
    <header
      style={{
        gridArea: 'header',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: 'var(--vellum-space-5)',
        borderBottom: '1px solid var(--vellum-color-border)',
        background: 'var(--vellum-color-bg)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--vellum-space-2)' }}>
        <span
          style={{
            fontFamily: 'var(--vellum-font-display)',
            fontWeight: 600,
            fontSize: 'var(--vellum-text-xl)',
            letterSpacing: '-0.02em',
          }}
        >
          {name}
        </span>
        <span
          style={{
            fontFamily: 'var(--vellum-font-mono)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: 'var(--vellum-color-muted-fg)',
          }}
        >
          Workbench
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--vellum-space-4)' }}>
        <ViewportPicker value={viewport} onChange={onViewport} />
        <BackgroundPicker value={background} onChange={onBackground} />
        <BackToDocs onClick={onModeChange} />
      </div>
    </header>
  );
}

function BackToDocs({ onClick }: { onClick?: () => void }) {
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
        fontSize: 11,
        fontFamily: 'var(--vellum-font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        transition: 'all var(--vellum-duration-fast) var(--vellum-easing)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--vellum-color-muted)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent';
      }}
    >
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
        <path d="M9 5H2M5 9 1 5l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Docs
    </button>
  );
}

function ViewportPicker({ value, onChange }: { value: ViewportSpec; onChange: (v: ViewportSpec) => void }) {
  return (
    <InlinePicker
      label="Viewport"
      value={value.id}
      onChange={(id) => {
        const next = DEFAULT_VIEWPORTS.find((v) => v.id === id);
        if (next) onChange(next);
      }}
      options={DEFAULT_VIEWPORTS.map((v) => ({
        value: v.id,
        label: v.width > 0 ? `${v.name} ${v.width}` : v.name,
      }))}
    />
  );
}

function BackgroundPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const presets: { id: string; label: string; value: string }[] = [
    { id: 'token', label: 'Token bg', value: 'var(--vellum-color-bg)' },
    { id: 'muted', label: 'Muted', value: 'var(--vellum-color-muted)' },
    { id: 'white', label: 'White', value: '#ffffff' },
    { id: 'black', label: 'Black', value: '#000000' },
  ];
  const currentId = presets.find((p) => p.value === value)?.id ?? 'token';
  return (
    <InlinePicker
      label="Background"
      value={currentId}
      onChange={(id) => {
        const p = presets.find((p) => p.id === id);
        if (p) onChange(p.value);
      }}
      options={presets.map((p) => ({ value: p.id, label: p.label }))}
    />
  );
}

function InlinePicker({
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
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--vellum-color-muted-fg)',
      }}
    >
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          padding: '5px 26px 5px 10px',
          background:
            'var(--vellum-color-bg) url("data:image/svg+xml,%3Csvg width=\'8\' height=\'5\' viewBox=\'0 0 8 5\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1l3 3 3-3\' stroke=\'%23999\' stroke-width=\'1.2\' fill=\'none\' stroke-linecap=\'round\'/%3E%3C/svg%3E") no-repeat right 10px center',
          color: 'var(--vellum-color-fg)',
          border: '1px solid var(--vellum-color-border)',
          borderRadius: 'var(--vellum-radius-sm)',
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          cursor: 'pointer',
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
        borderRight: '1px solid var(--vellum-color-border)',
        overflowY: 'auto',
        paddingBlock: 'var(--vellum-space-5)',
        paddingInline: 'var(--vellum-space-4)',
      }}
    >
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--vellum-space-5)' }}>
        {components.map((c) => (
          <li key={c.id}>
            <div
              style={{
                fontFamily: 'var(--vellum-font-mono)',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: 'var(--vellum-color-muted-fg)',
                paddingBlockEnd: 'var(--vellum-space-2)',
                paddingInlineStart: 14,
              }}
            >
              {c.title}
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 1 }}>
              {c.stories.map((s, idx) => {
                const active = s.id === currentStoryId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onSelectStory(s.id)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        width: '100%',
                        textAlign: 'left',
                        padding: '6px 8px 6px 14px',
                        borderRadius: 'var(--vellum-radius-sm)',
                        border: 0,
                        cursor: 'pointer',
                        fontSize: 'var(--vellum-text-sm)',
                        fontWeight: active ? 600 : 400,
                        color: active ? 'var(--vellum-color-fg)' : 'var(--vellum-color-muted-fg)',
                        background: 'transparent',
                        transition: 'color var(--vellum-duration-fast) var(--vellum-easing)',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) e.currentTarget.style.color = 'var(--vellum-color-fg)';
                      }}
                      onMouseLeave={(e) => {
                        if (!active) e.currentTarget.style.color = 'var(--vellum-color-muted-fg)';
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
                        }}
                      />
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Pad>{String(idx + 1).padStart(2, '0')}</Pad>
                        {s.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Pad({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 10,
        color: 'var(--vellum-color-muted-fg)',
        opacity: 0.7,
      }}
    >
      {children}
    </span>
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
        padding: 'var(--vellum-space-8)',
        background: `
          radial-gradient(circle at 0 0, color-mix(in oklab, var(--vellum-color-muted) 70%, transparent), transparent 60%),
          var(--vellum-color-muted)
        `,
        overflow: 'auto',
      }}
    >
      {current ? (
        <div
          style={{
            background,
            boxShadow:
              '0 0 0 1px var(--vellum-color-border), 0 24px 48px -16px color-mix(in oklab, var(--vellum-color-fg) 12%, transparent), 0 8px 24px -8px color-mix(in oklab, var(--vellum-color-fg) 8%, transparent)',
            borderRadius: 'calc(var(--vellum-radius-lg) + 2px)',
            overflow: 'hidden',
            width: viewport.width > 0 ? viewport.width : '100%',
            height: viewport.height > 0 ? viewport.height : '100%',
            maxWidth: '100%',
            maxHeight: '100%',
            transition:
              'width var(--vellum-duration-base) var(--vellum-easing), height var(--vellum-duration-base) var(--vellum-easing)',
          }}
        >
          <iframe
            ref={iframeRef}
            title={`${current.story.name} preview`}
            src={`${previewBase}/${current.story.id}`}
            style={{ width: '100%', height: '100%', border: 0, background: 'transparent', display: 'block' }}
          />
        </div>
      ) : (
        <div style={{ color: 'var(--vellum-color-muted-fg)' }}>Select a story</div>
      )}
    </main>
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
        borderLeft: '1px solid var(--vellum-color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--vellum-color-bg)',
      }}
    >
      <TabBar active={active} onChange={onActiveChange} />
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingBlock: 'var(--vellum-space-5)',
          paddingInline: 'var(--vellum-space-5)',
        }}
      >
        {story && component ? (
          <PanelHeader story={story} component={component} />
        ) : null}
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
        display: 'flex',
        borderBottom: '1px solid var(--vellum-color-border)',
        paddingInline: 'var(--vellum-space-5)',
      }}
    >
      {tabs.map((t) => {
        const on = active === t;
        return (
          <button
            key={t}
            role="tab"
            aria-selected={on}
            type="button"
            onClick={() => onChange(t)}
            style={{
              position: 'relative',
              paddingBlock: 14,
              paddingInline: 12,
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              color: on ? 'var(--vellum-color-fg)' : 'var(--vellum-color-muted-fg)',
              fontFamily: 'var(--vellum-font-mono)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              fontWeight: on ? 600 : 500,
              transition: 'color var(--vellum-duration-fast) var(--vellum-easing)',
            }}
            onMouseEnter={(e) => {
              if (!on) e.currentTarget.style.color = 'var(--vellum-color-fg)';
            }}
            onMouseLeave={(e) => {
              if (!on) e.currentTarget.style.color = 'var(--vellum-color-muted-fg)';
            }}
          >
            {t}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                bottom: -1,
                left: 12,
                right: 12,
                height: 2,
                background: on ? 'var(--vellum-color-accent)' : 'transparent',
                transition: 'background var(--vellum-duration-fast) var(--vellum-easing)',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function PanelHeader({ story, component }: { story: StoryEntry; component: ComponentEntry }) {
  return (
    <div style={{ marginBottom: 'var(--vellum-space-5)' }}>
      <div
        style={{
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--vellum-color-muted-fg)',
        }}
      >
        {component.title}
      </div>
      <div
        style={{
          fontFamily: 'var(--vellum-font-display)',
          fontSize: 'var(--vellum-text-lg)',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          marginTop: 2,
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
    return <EmptyHint>No prop schema. Add <code>argTypes</code> to the meta or enable the prop extractor.</EmptyHint>;
  }
  return (
    <div style={{ display: 'grid', gap: 'var(--vellum-space-4)' }}>
      {props.map((p) => (
        <div key={p.name} style={{ display: 'grid', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 12, color: 'var(--vellum-color-fg)' }}>
              {p.name}
              {p.required ? <span style={{ color: 'var(--vellum-color-accent)', marginInlineStart: 4 }}>*</span> : null}
            </span>
            <span
              style={{
                fontFamily: 'var(--vellum-font-mono)',
                fontSize: 10,
                color: 'var(--vellum-color-muted-fg)',
                textAlign: 'right',
              }}
            >
              {typeShort(p.type)}
            </span>
          </div>
          <ControlInput
            propType={p.type}
            value={args[p.name]}
            onChange={(v) => onArgsChange({ ...args, [p.name]: v })}
          />
          {p.description ? (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--vellum-color-muted-fg)', lineHeight: 1.55 }}>
              {p.description}
            </p>
          ) : null}
        </div>
      ))}
      <CopyButton onClick={() => navigator.clipboard?.writeText(JSON.stringify(args, null, 2)).catch(() => {})}>
        Copy args
      </CopyButton>
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
    paddingBlock: 8,
    paddingInline: 10,
    background: 'var(--vellum-color-bg)',
    border: '1px solid var(--vellum-color-border)',
    borderRadius: 'var(--vellum-radius-sm)',
    color: 'var(--vellum-color-fg)',
    fontSize: 13,
    fontFamily: 'var(--vellum-font-body)',
    transition: 'border-color var(--vellum-duration-fast) var(--vellum-easing)',
  };

  if (propType.kind === 'boolean') {
    return <Toggle value={!!value} onChange={onChange} />;
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {propType.options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              style={{
                paddingBlock: 6,
                paddingInline: 10,
                background: active ? 'var(--vellum-color-fg)' : 'transparent',
                color: active ? 'var(--vellum-color-bg)' : 'var(--vellum-color-fg)',
                border: '1px solid ' + (active ? 'var(--vellum-color-fg)' : 'var(--vellum-color-border)'),
                borderRadius: 'var(--vellum-radius-sm)',
                fontFamily: 'var(--vellum-font-mono)',
                fontSize: 11,
                cursor: 'pointer',
                transition: 'all var(--vellum-duration-fast) var(--vellum-easing)',
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
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--vellum-font-mono)', fontSize: 10, color: 'var(--vellum-color-muted-fg)' }}>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {propType.options.map((o) => {
          const active = selected.has(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              style={{
                paddingBlock: 6,
                paddingInline: 10,
                background: active ? 'var(--vellum-color-fg)' : 'transparent',
                color: active ? 'var(--vellum-color-bg)' : 'var(--vellum-color-fg)',
                border: '1px solid ' + (active ? 'var(--vellum-color-fg)' : 'var(--vellum-color-border)'),
                borderRadius: 'var(--vellum-radius-sm)',
                fontFamily: 'var(--vellum-font-mono)',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {active ? '✓ ' : ''}{o}
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
    return <Hint>function — logged in Actions panel</Hint>;
  }
  if (propType.kind === 'node') {
    return <Hint>ReactNode — set via story args</Hint>;
  }
  return <Hint>{`no editor for ${propType.kind}`}</Hint>;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        position: 'relative',
        width: 36,
        height: 20,
        borderRadius: 999,
        border: 0,
        cursor: 'pointer',
        background: value
          ? 'var(--vellum-color-accent)'
          : 'color-mix(in oklab, var(--vellum-color-fg) 18%, transparent)',
        transition: 'background var(--vellum-duration-fast) var(--vellum-easing)',
      }}
    >
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 2,
          left: value ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'var(--vellum-color-bg)',
          boxShadow: '0 1px 2px rgba(0,0,0,.2)',
          transition: 'left var(--vellum-duration-fast) var(--vellum-easing)',
        }}
      />
    </button>
  );
}

function CopyButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        paddingBlock: 8,
        paddingInline: 12,
        background: 'var(--vellum-color-muted)',
        color: 'var(--vellum-color-fg)',
        border: '1px solid var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-sm)',
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        cursor: 'pointer',
        transition: 'background var(--vellum-duration-fast) var(--vellum-easing)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'color-mix(in oklab, var(--vellum-color-muted) 70%, var(--vellum-color-fg) 6%)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--vellum-color-muted)';
      }}
    >
      {children}
    </button>
  );
}

function A11yPanel({ a11y, onRun }: { a11y: A11yResult | null; onRun: () => void }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--vellum-space-4)' }}>
      <button
        type="button"
        onClick={onRun}
        style={{
          paddingBlock: 10,
          paddingInline: 14,
          background: 'var(--vellum-color-accent)',
          color: 'var(--vellum-color-accent-fg)',
          border: 0,
          borderRadius: 'var(--vellum-radius-sm)',
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'transform var(--vellum-duration-fast) var(--vellum-easing)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
      >
        Run axe scan
      </button>
      {!a11y ? (
        <EmptyHint>No scan yet. Click above to audit the current preview.</EmptyHint>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--vellum-space-3)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 6,
              padding: 12,
              border: '1px solid var(--vellum-color-border)',
              borderRadius: 'var(--vellum-radius-sm)',
              background: 'var(--vellum-color-muted)',
            }}
          >
            <Stat label="Violations" value={a11y.violations.length} accent={a11y.violations.length > 0} />
            <Stat label="Passed" value={a11y.passes} />
            <Stat label="Incomplete" value={a11y.incomplete} />
          </div>
          {a11y.violations.length === 0 ? (
            <EmptyHint>No violations found. ✓</EmptyHint>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
              {a11y.violations.map((v) => (
                <li
                  key={v.id}
                  style={{
                    border: '1px solid var(--vellum-color-border)',
                    borderRadius: 'var(--vellum-radius-sm)',
                    padding: 12,
                    background: 'var(--vellum-color-bg)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ImpactBadge impact={v.impact} />
                    <strong style={{ fontSize: 13 }}>{v.id}</strong>
                  </div>
                  <p style={{ margin: '6px 0 4px', fontSize: 13, lineHeight: 1.5 }}>{v.description}</p>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--vellum-color-muted-fg)', lineHeight: 1.5 }}>
                    {v.help}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--vellum-font-display)',
          fontSize: 'var(--vellum-text-2xl)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          color: accent ? 'var(--vellum-color-accent)' : 'var(--vellum-color-fg)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--vellum-color-muted-fg)',
        }}
      >
        {label}
      </div>
    </div>
  );
}

function ImpactBadge({ impact }: { impact: A11yResult['violations'][number]['impact'] }) {
  const color = impactColor(impact);
  return (
    <span
      style={{
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        paddingBlock: 2,
        paddingInline: 6,
        borderRadius: 4,
        background: `color-mix(in oklab, ${color} 18%, transparent)`,
        color,
      }}
    >
      {impact ?? 'unknown'}
    </span>
  );
}

function impactColor(impact: A11yResult['violations'][number]['impact']): string {
  switch (impact) {
    case 'critical':
      return 'oklch(0.55 0.22 25)';
    case 'serious':
      return 'oklch(0.62 0.19 40)';
    case 'moderate':
      return 'oklch(0.7 0.15 75)';
    case 'minor':
      return 'oklch(0.68 0.18 130)';
    default:
      return 'var(--vellum-color-muted-fg)';
  }
}

function ActionsPanel({ actions, onClear }: { actions: ActionLog[]; onClear: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span
          style={{
            fontFamily: 'var(--vellum-font-mono)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: 'var(--vellum-color-muted-fg)',
          }}
        >
          {actions.length} event{actions.length === 1 ? '' : 's'}
        </span>
        <CopyButton onClick={onClear}>Clear</CopyButton>
      </div>
      {actions.length === 0 ? (
        <EmptyHint>Interact with the preview to capture events.</EmptyHint>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
          {actions.map((a) => (
            <li
              key={a.id}
              style={{
                fontFamily: 'var(--vellum-font-mono)',
                fontSize: 12,
                padding: '8px 10px',
                background: 'var(--vellum-color-muted)',
                borderRadius: 'var(--vellum-radius-sm)',
                color: 'var(--vellum-color-fg)',
                wordBreak: 'break-word',
              }}
            >
              <span style={{ color: 'var(--vellum-color-accent)' }}>{a.name}</span>
              <span style={{ color: 'var(--vellum-color-muted-fg)' }}>
                {'('}
                {a.args.map((arg, i) => (
                  <span key={i}>
                    {i > 0 ? ', ' : ''}
                    {JSON.stringify(arg)}
                  </span>
                ))}
                {')'}
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
      <CopyButton onClick={() => navigator.clipboard?.writeText(code).catch(() => {})}>Copy CSF</CopyButton>
      <pre
        style={{
          margin: 0,
          padding: 12,
          background: 'var(--vellum-color-muted)',
          border: '1px solid var(--vellum-color-border)',
          borderRadius: 'var(--vellum-radius-sm)',
          overflow: 'auto',
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 12,
          lineHeight: 1.55,
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        padding: 'var(--vellum-space-3) 0',
        color: 'var(--vellum-color-muted-fg)',
        fontSize: 13,
        lineHeight: 1.55,
      }}
    >
      {children}
    </p>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 11, color: 'var(--vellum-color-muted-fg)' }}>
      {children}
    </span>
  );
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
