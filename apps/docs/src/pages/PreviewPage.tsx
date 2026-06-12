import { createElement, useEffect, useState } from 'react';
import { findStory, type Args } from '@vellum/story';
import { useManifest } from '@vellum/react';
import { instrumentArgsForActions, type PreviewMessageFromChild, type PreviewMessageFromParent } from '@vellum/preview';
import type { A11yResult } from '@vellum/preview';

export function PreviewPage({ storyId }: { storyId: string }) {
  const manifest = useManifest();
  const found = findStory(manifest, storyId);
  // `editableArgs` carries only the serializable values the parent has changed.
  // Final render args = original story args (incl. function refs) merged with these.
  const [editableArgs, setEditableArgs] = useState<Args>({});

  useEffect(() => {
    const send = (msg: PreviewMessageFromChild) => window.parent?.postMessage(msg, '*');
    send({ type: 'preview:ready', storyId });

    const onMessage = async (e: MessageEvent<PreviewMessageFromParent>) => {
      const data = e.data;
      if (!data || typeof data !== 'object' || !('type' in data)) return;
      if (data.type === 'preview:set-args') {
        setEditableArgs(data.args);
      } else if (data.type === 'preview:run-a11y') {
        const result = await runA11y();
        send({ type: 'preview:a11y-result', result });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [storyId]);

  if (!found) {
    return <div style={{ padding: 16 }}>Story not found: {storyId}</div>;
  }

  const { component, story } = found;
  const send = (msg: PreviewMessageFromChild) => window.parent?.postMessage(msg, '*');
  const mergedArgs: Args = { ...story.args, ...editableArgs };
  const instrumented = instrumentArgsForActions(mergedArgs, storyId, send);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 24,
        background: 'transparent',
      }}
    >
      <div data-vellum-preview-root>
        {story.render
          ? story.render(instrumented as never)
          : createElement(component.Component, instrumented as never)}
      </div>
    </div>
  );
}

async function runA11y(): Promise<A11yResult> {
  try {
    const axe = await import('axe-core');
    const root = document.querySelector('[data-vellum-preview-root]') as HTMLElement | null;
    if (!root) return { violations: [], passes: 0, incomplete: 0 };
    const result = await axe.default.run(root);
    return {
      violations: result.violations.map((v) => ({
        id: v.id,
        impact: (v.impact ?? null) as A11yResult['violations'][number]['impact'],
        description: v.description,
        help: v.help,
        nodes: v.nodes.map((n) => ({ html: n.html, target: n.target as string[] })),
      })),
      passes: result.passes.length,
      incomplete: result.incomplete.length,
    };
  } catch (e) {
    return { violations: [], passes: 0, incomplete: 0 };
  }
}
