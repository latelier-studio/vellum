import type { ComponentEntry, PropType } from '@vellum/story';
import { useManifest } from './context.js';

export function ArgsTable({
  of,
}: {
  of: { id: string } | { __vellumComponent: ComponentEntry } | ComponentEntry;
}) {
  const manifest = useManifest();
  const component = resolveComponent(of, manifest);
  if (!component) return <div>Unknown component</div>;

  const props = component.propsSchema?.props ?? [];
  if (props.length === 0) {
    return (
      <p style={{ color: 'var(--vellum-color-muted-fg)', fontSize: 14 }}>
        No prop schema available for <code>{component.name}</code>.
      </p>
    );
  }

  return (
    <div style={{ marginBlock: 'var(--vellum-space-4)' }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 0 }}>
        {props.map((p, i) => (
          <li
            key={p.name}
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 1fr',
              gap: 'var(--vellum-space-6)',
              alignItems: 'baseline',
              paddingBlock: 'var(--vellum-space-4)',
              borderTop: i === 0 ? '1px solid var(--vellum-color-border)' : 'none',
              borderBottom: '1px solid var(--vellum-color-border)',
            }}
          >
            <div style={{ display: 'grid', gap: 6 }}>
              <code
                style={{
                  fontFamily: 'var(--vellum-font-mono)',
                  fontSize: 13,
                  color: 'var(--vellum-color-fg)',
                }}
              >
                {p.name}
                {p.required ? (
                  <span style={{ color: 'var(--vellum-color-accent)', marginInlineStart: 4 }}>*</span>
                ) : null}
              </code>
              {p.defaultValue !== undefined ? (
                <span
                  style={{
                    fontFamily: 'var(--vellum-font-mono)',
                    fontSize: 11,
                    color: 'var(--vellum-color-muted-fg)',
                  }}
                >
                  Default <span style={{ color: 'var(--vellum-color-fg)' }}>{String(p.defaultValue)}</span>
                </span>
              ) : null}
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <code
                style={{
                  fontFamily: 'var(--vellum-font-mono)',
                  fontSize: 12,
                  color: 'var(--vellum-color-muted-fg)',
                  lineHeight: 1.5,
                }}
              >
                {typeLabel(p.type)}
              </code>
              {p.description ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.6,
                    color: 'var(--vellum-color-fg)',
                  }}
                >
                  {p.description}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function resolveComponent(
  ref: { id: string } | { __vellumComponent: ComponentEntry } | ComponentEntry,
  manifest: { components: ComponentEntry[] },
): ComponentEntry | null {
  if ('__vellumComponent' in ref) return ref.__vellumComponent;
  if ('Component' in ref) return ref as ComponentEntry;
  if ('id' in ref) return manifest.components.find((c) => c.id === ref.id) ?? null;
  return null;
}

function typeLabel(t: PropType): string {
  switch (t.kind) {
    case 'boolean':
    case 'string':
    case 'number':
    case 'node':
    case 'function':
    case 'object':
    case 'date':
      return t.kind;
    case 'range':
      return `number (${t.min ?? '−∞'}..${t.max ?? '+∞'})`;
    case 'enum':
      return t.options.map((o) => `"${o}"`).join(' | ');
    case 'multi-enum':
      return `Array<${t.options.map((o) => `"${o}"`).join(' | ')}>`;
    case 'union':
      return t.members.map(typeLabel).join(' | ');
    case 'unknown':
      return t.raw;
  }
}
