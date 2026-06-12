import type { PropsSchema, PropSchemaEntry, PropType } from './types.js';

type DocgenComponentDoc = {
  displayName: string;
  description?: string;
  props: Record<string, DocgenProp>;
};

type DocgenProp = {
  name: string;
  required: boolean;
  description?: string;
  type: { name: string; raw?: string };
  defaultValue?: { value: unknown } | null;
};

/**
 * Build a PropsSchema from a TypeScript source file by delegating to
 * `react-docgen-typescript`. Returns null if the optional peer dependency
 * is unavailable.
 */
export async function extractPropsSchema(
  componentPath: string,
  componentName: string,
  tsconfigPath?: string,
): Promise<PropsSchema | null> {
  let docgen: typeof import('react-docgen-typescript') | null = null;
  try {
    docgen = await import('react-docgen-typescript');
  } catch {
    return null;
  }

  const parser = tsconfigPath
    ? docgen.withCustomConfig(tsconfigPath, { savePropValueAsString: true })
    : docgen.withDefaultConfig({ savePropValueAsString: true });

  let docs: DocgenComponentDoc[];
  try {
    docs = parser.parse(componentPath) as unknown as DocgenComponentDoc[];
  } catch {
    return null;
  }
  const doc = docs.find((d) => d.displayName === componentName) ?? docs[0];
  if (!doc) return null;

  const props: PropSchemaEntry[] = [];
  for (const [name, p] of Object.entries(doc.props)) {
    props.push({
      name,
      type: classifyType(p.type),
      required: p.required,
      defaultValue: p.defaultValue?.value,
      description: p.description,
    });
  }
  return { props, sourcePath: componentPath };
}

function classifyType(t: DocgenProp['type']): PropType {
  const raw = (t.raw ?? t.name ?? '').trim();
  if (raw === 'boolean') return { kind: 'boolean' };
  if (raw === 'string') return { kind: 'string' };
  if (raw === 'number') return { kind: 'number' };
  if (raw === 'ReactNode' || raw === 'React.ReactNode') return { kind: 'node' };
  if (raw.startsWith('(') && raw.includes('=>')) return { kind: 'function' };
  // Union of string literals: e.g. "primary" | "ghost" | "destructive"
  const enumMatch = /^("[^"]+"\s*\|\s*)+("[^"]+")$/.exec(raw);
  if (enumMatch) {
    const options = raw
      .split('|')
      .map((s) => s.trim().replace(/^"|"$/g, ''))
      .filter(Boolean);
    return { kind: 'enum', options };
  }
  // Generic union — recurse
  if (raw.includes('|')) {
    const members = raw.split('|').map((m) => classifyType({ name: m.trim(), raw: m.trim() }));
    return { kind: 'union', members };
  }
  if (raw === 'object' || raw.startsWith('{')) return { kind: 'object' };
  return { kind: 'unknown', raw };
}
