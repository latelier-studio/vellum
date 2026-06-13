import { useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentEntry, PropType, StoryEntry } from '@vellum/story';
import {
  type A11yResult,
  type PreviewMessageFromChild,
  type PreviewMessageFromParent,
  type ViewportSpec,
} from '@vellum/preview';

/**
 * Embeddable workbench view, scoped to a single component.
 *
 * Replaces the separate /workbench page surface — ComponentPage uses this
 * inline so the docs chrome stays around it. Story tree is omitted (the
 * scope is one component); story selection happens via a chip row at the
 * top.
 *
 * Lifts PreviewStage + Panels + all panel bodies from
 * @vellum/chrome-minimal-workbench. The chrome package keeps its standalone
 * shell for users that still want a full-screen workbench at /workbench.
 */

type Tab = 'controls' | 'a11y' | 'actions' | 'code';
type ActionLog = { id: number; name: string; args: unknown[]; timestamp: number };

const PREVIEW_BASE = '/preview';

export function WorkbenchSection({
  component,
  viewport,
  background,
}: {
  component: ComponentEntry;
  viewport: ViewportSpec;
  background: string;
}) {
  const [storyId, setStoryId] = useState<string>(() => component.stories[0]?.id ?? '');
  const current = useMemo<{ component: ComponentEntry; story: StoryEntry } | null>(() => {
    const story = component.stories.find((s) => s.id === storyId);
    return story ? { component, story } : null;
  }, [component, storyId]);

  const [args, setArgs] = useState<Record<string, unknown>>(() => current?.story.args ?? {});
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
    const cleanArgs = Object.fromEntries(Object.entries(args).filter(([, v]) => typeof v !== 'function'));
    postToPreview({ type: 'preview:set-args', storyId: current.story.id, args: cleanArgs });
  }, [args, current?.story.id]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 16,
        marginBlock: 'var(--vellum-space-6)',
        border: '1px solid var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-md)',
        overflow: 'hidden',
        background: 'var(--vellum-color-bg)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 480 }}>
        <StoryChips stories={component.stories} storyId={storyId} onStory={setStoryId} />
        <PreviewStage current={current} viewport={viewport} background={background} iframeRef={iframeRef} />
      </div>
      <aside
        style={{
          borderLeft: '1px solid var(--vellum-color-border)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 480,
        }}
      >
        <TabBar active={activeTab} onChange={setActiveTab} />
        <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--vellum-space-4)' }}>
          {current ? (
            <PanelBody
              tab={activeTab}
              component={current.component}
              story={current.story}
              args={args}
              onArgsChange={setArgs}
              actions={actions}
              onClearActions={() => setActions([])}
              a11y={a11y}
              onRunA11y={() => postToPreview({ type: 'preview:run-a11y' })}
            />
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function StoryChips({
  stories,
  storyId,
  onStory,
}: {
  stories: StoryEntry[];
  storyId: string;
  onStory: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: 'var(--vellum-space-3) var(--vellum-space-4)',
        borderBottom: '1px solid var(--vellum-color-border)',
        background: 'color-mix(in oklab, var(--vellum-color-fg) 3%, transparent)',
      }}
    >
      {stories.map((s) => {
        const on = s.id === storyId;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onStory(s.id)}
            style={{
              paddingBlock: 6,
              paddingInline: 10,
              background: on ? 'var(--vellum-color-fg)' : 'transparent',
              color: on ? 'var(--vellum-color-bg)' : 'var(--vellum-color-fg)',
              border: '1px solid ' + (on ? 'var(--vellum-color-fg)' : 'var(--vellum-color-border)'),
              borderRadius: 'var(--vellum-radius-sm)',
              fontFamily: 'var(--vellum-font-mono)',
              fontSize: 11,
              letterSpacing: '0.06em',
              cursor: on ? 'default' : 'pointer',
            }}
          >
            {s.name}
          </button>
        );
      })}
    </div>
  );
}

function PreviewStage({
  current,
  viewport,
  background,
  iframeRef,
}: {
  current: { component: ComponentEntry; story: StoryEntry } | null;
  viewport: ViewportSpec;
  background: string;
  iframeRef: React.RefObject<HTMLIFrameElement>;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const cs = getComputedStyle(el);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      setAvailable({ w: el.clientWidth - padX, h: el.clientHeight - padY });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hasFixed = viewport.width > 0 && viewport.height > 0;
  const scale = hasFixed && available.w > 0 && available.h > 0
    ? Math.min(1, available.w / viewport.width, available.h / viewport.height)
    : 1;

  return (
    <div
      ref={stageRef}
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--vellum-space-6)',
        background: `
          radial-gradient(circle at 0 0, color-mix(in oklab, var(--vellum-color-muted) 70%, transparent), transparent 60%),
          var(--vellum-color-muted)
        `,
        minHeight: 360,
        overflow: 'hidden',
      }}
    >
      {hasFixed && scale < 1 ? <ScaleBadge label={`${Math.round(scale * 100)}%`} /> : null}
      {current ? (
        hasFixed ? (
          <div
            style={{
              width: viewport.width * scale,
              height: viewport.height * scale,
              position: 'relative',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: viewport.width,
                height: viewport.height,
                transform: `scale(${scale})`,
                transformOrigin: '0 0',
                background,
                boxShadow:
                  '0 0 0 1px var(--vellum-color-border), 0 24px 48px -16px color-mix(in oklab, var(--vellum-color-fg) 10%, transparent)',
                borderRadius: 'var(--vellum-radius-md)',
                overflow: 'hidden',
              }}
            >
              <iframe
                ref={iframeRef}
                title={`${current.story.name} preview`}
                src={`${PREVIEW_BASE}/${current.story.id}`}
                style={{ width: '100%', height: '100%', border: 0, background: 'transparent', display: 'block' }}
              />
            </div>
          </div>
        ) : (
          <div
            style={{
              background,
              boxShadow:
                '0 0 0 1px var(--vellum-color-border), 0 24px 48px -16px color-mix(in oklab, var(--vellum-color-fg) 10%, transparent)',
              borderRadius: 'var(--vellum-radius-md)',
              overflow: 'hidden',
              width: '100%',
              height: 320,
              maxWidth: '100%',
            }}
          >
            <iframe
              ref={iframeRef}
              title={`${current.story.name} preview`}
              src={`${PREVIEW_BASE}/${current.story.id}`}
              style={{ width: '100%', height: '100%', border: 0, background: 'transparent', display: 'block' }}
            />
          </div>
        )
      ) : (
        <div style={{ color: 'var(--vellum-color-muted-fg)' }}>Select a story</div>
      )}
    </div>
  );
}

function ScaleBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 1,
        padding: '3px 6px',
        background: 'color-mix(in oklab, var(--vellum-color-bg) 88%, transparent)',
        color: 'var(--vellum-color-muted-fg)',
        border: '1px solid var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-sm)',
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 10,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {label}
    </span>
  );
}

function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: Tab[] = ['controls', 'a11y', 'actions', 'code'];
  return (
    <div role="tablist" style={{ display: 'flex', borderBottom: '1px solid var(--vellum-color-border)', paddingInline: 'var(--vellum-space-3)' }}>
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
              paddingBlock: 12,
              paddingInline: 10,
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              color: on ? 'var(--vellum-color-fg)' : 'var(--vellum-color-muted-fg)',
              fontFamily: 'var(--vellum-font-mono)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: on ? 600 : 500,
            }}
          >
            {t}
            <span
              aria-hidden
              style={{
                position: 'absolute',
                bottom: -1,
                left: 10,
                right: 10,
                height: 2,
                background: on ? 'var(--vellum-color-accent)' : 'transparent',
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function PanelBody(props: {
  tab: Tab;
  component: ComponentEntry;
  story: StoryEntry;
  args: Record<string, unknown>;
  onArgsChange: (a: Record<string, unknown>) => void;
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
  onArgsChange: (a: Record<string, unknown>) => void;
}) {
  const props = component.propsSchema?.props ?? [];
  if (props.length === 0) {
    return <EmptyHint>No prop schema. Add argTypes to the story meta.</EmptyHint>;
  }
  return (
    <div style={{ display: 'grid', gap: 'var(--vellum-space-3)' }}>
      {props.map((p) => (
        <div key={p.name} style={{ display: 'grid', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 12 }}>{p.name}</span>
            <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 10, color: 'var(--vellum-color-muted-fg)' }}>{typeShort(p.type)}</span>
          </div>
          <ControlInput propType={p.type} value={args[p.name]} onChange={(v) => onArgsChange({ ...args, [p.name]: v })} />
          {p.description ? (
            <p style={{ margin: 0, fontSize: 11, color: 'var(--vellum-color-muted-fg)', lineHeight: 1.5 }}>{p.description}</p>
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
    paddingBlock: 6,
    paddingInline: 8,
    background: 'var(--vellum-color-bg)',
    border: '1px solid var(--vellum-color-border)',
    borderRadius: 'var(--vellum-radius-sm)',
    color: 'var(--vellum-color-fg)',
    fontSize: 12,
    fontFamily: 'var(--vellum-font-body)',
  };

  if (propType.kind === 'boolean') return <Toggle value={!!value} onChange={onChange} />;
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {propType.options.map((o) => {
          const active = value === o;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              style={{
                paddingBlock: 4,
                paddingInline: 8,
                background: active ? 'var(--vellum-color-fg)' : 'transparent',
                color: active ? 'var(--vellum-color-bg)' : 'var(--vellum-color-fg)',
                border: '1px solid ' + (active ? 'var(--vellum-color-fg)' : 'var(--vellum-color-border)'),
                borderRadius: 'var(--vellum-radius-sm)',
                fontFamily: 'var(--vellum-font-mono)',
                fontSize: 11,
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
      <div style={{ display: 'grid', gap: 2 }}>
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
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {propType.options.map((o) => {
          const active = selected.has(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              style={{
                paddingBlock: 4,
                paddingInline: 8,
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
  if (propType.kind === 'function') return <Hint>function — logged in Actions panel</Hint>;
  if (propType.kind === 'node') return <Hint>ReactNode — set via story args</Hint>;
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
        background: value ? 'var(--vellum-color-accent)' : 'color-mix(in oklab, var(--vellum-color-fg) 18%, transparent)',
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
        }}
      />
    </button>
  );
}

function A11yPanel({ a11y, onRun }: { a11y: A11yResult | null; onRun: () => void }) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <button
        type="button"
        onClick={onRun}
        style={{
          paddingBlock: 8,
          paddingInline: 12,
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
        }}
      >
        Run axe scan
      </button>
      {!a11y ? (
        <EmptyHint>No scan yet. Click above to audit the current preview.</EmptyHint>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: 10, border: '1px solid var(--vellum-color-border)', borderRadius: 'var(--vellum-radius-sm)' }}>
            <Stat label="Viol" value={a11y.violations.length} accent={a11y.violations.length > 0} />
            <Stat label="Pass" value={a11y.passes} />
            <Stat label="Incomp" value={a11y.incomplete} />
          </div>
          {a11y.violations.length === 0 ? (
            <EmptyHint>No violations found. ✓</EmptyHint>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 6 }}>
              {a11y.violations.map((v) => (
                <li key={v.id} style={{ border: '1px solid var(--vellum-color-border)', borderRadius: 'var(--vellum-radius-sm)', padding: 8 }}>
                  <strong style={{ fontSize: 12 }}>{v.id}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--vellum-color-muted-fg)' }}>{v.description}</p>
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
      <div style={{ fontFamily: 'var(--vellum-font-display)', fontSize: 18, fontWeight: 600, color: accent ? 'var(--vellum-color-accent)' : 'var(--vellum-color-fg)', lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ marginTop: 2, fontFamily: 'var(--vellum-font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--vellum-color-muted-fg)' }}>
        {label}
      </div>
    </div>
  );
}

function ActionsPanel({ actions, onClear }: { actions: ActionLog[]; onClear: () => void }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 11, color: 'var(--vellum-color-muted-fg)' }}>
          {actions.length} event{actions.length === 1 ? '' : 's'}
        </span>
        <CopyButton onClick={onClear}>Clear</CopyButton>
      </div>
      {actions.length === 0 ? (
        <EmptyHint>Interact with the preview to capture events.</EmptyHint>
      ) : (
        <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 4 }}>
          {actions.map((a) => (
            <li key={a.id} style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 11, padding: '6px 8px', background: 'var(--vellum-color-muted)', borderRadius: 'var(--vellum-radius-sm)' }}>
              <span style={{ color: 'var(--vellum-color-accent)' }}>{a.name}</span>
              <span style={{ color: 'var(--vellum-color-muted-fg)' }}>
                {'('}
                {a.args.map((arg, i) => <span key={i}>{i > 0 ? ', ' : ''}{JSON.stringify(arg)}</span>)}
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
    <div style={{ display: 'grid', gap: 8 }}>
      <CopyButton onClick={() => navigator.clipboard?.writeText(code).catch(() => {})}>Copy CSF</CopyButton>
      <pre style={{ margin: 0, padding: 10, background: 'var(--vellum-color-muted)', border: '1px solid var(--vellum-color-border)', borderRadius: 'var(--vellum-radius-sm)', overflow: 'auto', fontFamily: 'var(--vellum-font-mono)', fontSize: 11, lineHeight: 1.5 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function CopyButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        paddingBlock: 6,
        paddingInline: 10,
        background: 'var(--vellum-color-muted)',
        color: 'var(--vellum-color-fg)',
        border: '1px solid var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-sm)',
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: 0, padding: '8px 0', color: 'var(--vellum-color-muted-fg)', fontSize: 12 }}>{children}</p>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 11, color: 'var(--vellum-color-muted-fg)' }}>{children}</span>;
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
  const safe = storyName.replace(/(^|\s+)(.)/g, (_, _ws, ch) => ch.toUpperCase()).replace(/\s+/g, '');
  const literal = Object.keys(args).length === 0 ? '' : `\n  args: ${JSON.stringify(args, null, 2).replace(/\n/g, '\n  ')},\n`;
  return `export const ${safe}: StoryObj<typeof ${componentName}> = {${literal}};\n`;
}
