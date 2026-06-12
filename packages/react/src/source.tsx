import { useMemo } from 'react';
import type { StoryRef } from './story.js';
import { resolveStoryRef } from './story.js';
import { useManifest } from './context.js';

export function Source({ of }: { of: StoryRef }) {
  const manifest = useManifest();
  const resolved = resolveStoryRef(of, manifest);
  const code = useMemo(() => {
    if (!resolved) return '// unknown story';
    return formatJsx(resolved.component.name, resolved.story.args);
  }, [resolved]);

  return (
    <pre
      style={{
        margin: 'var(--vellum-space-4) 0',
        padding: 'var(--vellum-space-4)',
        background: 'var(--vellum-color-muted)',
        boxShadow: '0 0 0 1px var(--vellum-color-border)',
        borderRadius: 'var(--vellum-radius-md)',
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 12,
        lineHeight: 1.65,
        overflow: 'auto',
      }}
    >
      <code>{code}</code>
    </pre>
  );
}

function formatJsx(name: string, args: Record<string, unknown>): string {
  const props = Object.entries(args)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      if (v === true) return k;
      if (typeof v === 'string') return `${k}="${v.replace(/"/g, '\\"')}"`;
      if (typeof v === 'function') return `${k}={() => {}}`;
      return `${k}={${JSON.stringify(v)}}`;
    });
  return props.length === 0 ? `<${name} />` : `<${name} ${props.join(' ')} />`;
}
