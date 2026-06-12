import { createElement, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import type { Args, ComponentEntry, Decorator, StoryContext, StoryEntry, StoryManifest } from '@vellum/story';
import { findStory } from '@vellum/story';
import { useManifest } from './context.js';

export type StoryRef =
  | StoryEntry
  | { id: string }
  | { __vellumStory: { component: ComponentEntry; story: StoryEntry } };

export function resolveStoryRef(
  ref: StoryRef,
  manifest: StoryManifest,
): { component: ComponentEntry; story: StoryEntry } | null {
  if ('__vellumStory' in ref) return ref.__vellumStory;
  if ('id' in ref && typeof ref.id === 'string') return findStory(manifest, ref.id);
  return null;
}

export function Story({
  of,
  args: argOverrides,
  index,
}: {
  of: StoryRef;
  args?: Args;
  /** Optional numeric label rendered as a mono caption (e.g. 01, 02…). */
  index?: number;
}) {
  const manifest = useManifest();
  const resolved = resolveStoryRef(of, manifest);
  const [open, setOpen] = useState(false);
  const componentName = resolved?.component.name ?? '';
  const baseArgs = resolved?.story.args ?? {};
  const finalArgs = useMemo<Args>(
    () => ({ ...baseArgs, ...(argOverrides ?? {}) }),
    [baseArgs, argOverrides],
  );
  const sourceCode = useMemo(
    () => formatJsx(componentName, finalArgs),
    [componentName, finalArgs],
  );

  if (!resolved) {
    return (
      <div
        style={{
          padding: 'var(--vellum-space-4)',
          border: '1px dashed var(--vellum-color-border)',
          borderRadius: 'var(--vellum-radius-md)',
          color: 'var(--vellum-color-muted-fg)',
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 13,
        }}
      >
        Unknown story reference
      </div>
    );
  }

  const { component, story } = resolved;
  const baseContext = useMemo<StoryContext>(
    () => ({
      args: finalArgs,
      argTypes: story.argTypes,
      parameters: story.parameters,
      componentId: component.id,
      storyId: story.id,
      name: story.name,
    }),
    [component.id, finalArgs, story.argTypes, story.id, story.name, story.parameters],
  );
  const rendered = useMemo(
    () => composeStory({ component, story, args: finalArgs }, baseContext),
    [component, story, finalArgs, baseContext],
  );

  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!story.play || !canvasRef.current) return;
    let cancelled = false;
    const result = story.play({ ...baseContext, canvasElement: canvasRef.current });
    if (result && typeof (result as Promise<void>).catch === 'function') {
      (result as Promise<void>).catch((err) => {
        if (!cancelled) {
          // eslint-disable-next-line no-console
          console.error(`[vellum] play function failed in ${story.id}:`, err);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [story.id, story.play, baseContext]);

  return (
    <figure style={{ margin: 0, marginBlock: 'var(--vellum-space-6)' }}>
      <Caption index={index} name={story.name} />
      <div
        style={{
          marginTop: 12,
          borderRadius: 'calc(var(--vellum-radius-lg) + 2px)',
          background: 'var(--vellum-color-bg)',
          boxShadow:
            '0 0 0 1px var(--vellum-color-border), 0 1px 2px color-mix(in oklab, var(--vellum-color-fg) 5%, transparent), 0 24px 40px -24px color-mix(in oklab, var(--vellum-color-fg) 14%, transparent)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingBlock: 'var(--vellum-space-10)',
            paddingInline: 'var(--vellum-space-6)',
            minHeight: 160,
            backgroundImage:
              'radial-gradient(circle at 1px 1px, color-mix(in oklab, var(--vellum-color-fg) 6%, transparent) 1px, transparent 0)',
            backgroundSize: '16px 16px',
            backgroundPosition: '8px 8px',
          }}
        >
          <div ref={canvasRef} style={{ position: 'relative', zIndex: 1 }}>{rendered}</div>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, color-mix(in oklab, var(--vellum-color-bg) 88%, transparent), color-mix(in oklab, var(--vellum-color-bg) 60%, transparent))',
              zIndex: 0,
            }}
          />
        </div>
        <button
          type="button"
          onClick={() => setOpen((x) => !x)}
          aria-expanded={open}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBlock: 10,
            paddingInline: 14,
            background: 'var(--vellum-color-bg)',
            borderTop: '1px solid var(--vellum-color-border)',
            border: 0,
            borderTopStyle: 'solid',
            borderTopWidth: 1,
            borderTopColor: 'var(--vellum-color-border)',
            cursor: 'pointer',
            color: 'var(--vellum-color-muted-fg)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--vellum-color-fg)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--vellum-color-muted-fg)')}
        >
          <span
            style={{
              fontFamily: 'var(--vellum-font-mono)',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            {open ? 'Hide source' : 'View source'}
          </span>
          <Caret open={open} />
        </button>
        {open ? (
          <pre
            style={{
              margin: 0,
              padding: 'var(--vellum-space-4)',
              fontFamily: 'var(--vellum-font-mono)',
              fontSize: 12,
              background: 'var(--vellum-color-muted)',
              borderTop: '1px solid var(--vellum-color-border)',
              overflow: 'auto',
              lineHeight: 1.65,
              color: 'var(--vellum-color-fg)',
            }}
          >
            <code>{sourceCode}</code>
          </pre>
        ) : null}
      </div>
    </figure>
  );
}

/** Compose decorators around the base render. Outermost-first list, innermost rendered last. */
function composeStory(
  input: { component: ComponentEntry; story: StoryEntry; args: Args },
  baseContext: StoryContext,
): ReactElement {
  const { component, story, args } = input;
  const renderBase = (ctx: StoryContext): ReactElement => {
    const useArgs = ctx.args;
    return story.render
      ? story.render(useArgs as never)
      : createElement(component.Component, useArgs);
  };
  const decorators = story.decorators ?? [];
  if (decorators.length === 0) return renderBase(baseContext);

  // Build from innermost outwards.
  let next: (ctx: StoryContext) => ReactElement = renderBase;
  for (let i = decorators.length - 1; i >= 0; i--) {
    const decorator = decorators[i]!;
    const prev = next;
    next = (ctx: StoryContext) => {
      const StoryFn = (override?: Partial<StoryContext>) =>
        prev(override ? { ...ctx, ...override, args: { ...ctx.args, ...(override.args ?? {}) } } : ctx);
      const out = decorator(StoryFn, ctx);
      return (out ?? null) as ReactElement;
    };
  }
  return next(baseContext);
}

function Caption({ index, name }: { index?: number; name: string }) {
  return (
    <figcaption
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 8,
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: 'var(--vellum-color-muted-fg)',
      }}
    >
      {index !== undefined ? (
        <span style={{ color: 'var(--vellum-color-accent)', fontWeight: 600 }}>
          {String(index).padStart(2, '0')}
        </span>
      ) : null}
      <span style={{ color: 'var(--vellum-color-fg)', fontWeight: 600 }}>{name}</span>
    </figcaption>
  );
}

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      style={{
        transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform var(--vellum-duration-fast) var(--vellum-easing)',
      }}
      aria-hidden
    >
      <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatJsx(name: string, args: Args): string {
  const props = Object.entries(args)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      if (v === true) return k;
      if (typeof v === 'string') return `${k}="${v.replace(/"/g, '\\"')}"`;
      if (typeof v === 'function') return `${k}={() => {}}`;
      return `${k}={${JSON.stringify(v)}}`;
    });
  if (props.length === 0) return `<${name} />`;
  if (props.length <= 2) return `<${name} ${props.join(' ')} />`;
  return `<${name}\n  ${props.join('\n  ')}\n/>`;
}
