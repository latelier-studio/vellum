import { deriveTokens, type NormalizedTokens } from '@vellum/core';
import { parseDesignMd } from '@vellum/adapter-md';
import { buildComponentEntry, buildManifest, type PropSchemaEntry, type PropsSchema, type StoryManifest } from '@vellum/story';

const designMdSources = import.meta.glob('./scenarios/*/design.md', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const storyModules = import.meta.glob('./scenarios/**/*.stories.{tsx,ts,jsx,js}', {
  eager: true,
}) as Record<string, Record<string, unknown>>;

export type Scenario = {
  id: string;
  label: string;
  description: string;
  tokens: NormalizedTokens;
  source: string;
  manifest: StoryManifest;
};

const SCENARIO_META: Record<string, { label: string; description: string }> = {
  default: { label: 'Vellum Demo', description: 'Warm editorial · Fraunces serif + Inter, terracotta accent.' },
  vercel: { label: 'Geist', description: 'Achromatic high-contrast · Inter, pure black accent.' },
  notion: { label: 'Lumen', description: 'Warm paper · Source Serif display, peach accent.' },
  linear: { label: 'Beam', description: 'Dense ops · compact Inter, indigo accent, kbd hints.' },
  zine: { label: 'Riso', description: 'Risograph print + brutalist chrome · vermillion stamps.' },
};

function scenarioFromDesignMdPath(path: string): string {
  // ./scenarios/<id>/design.md
  return path.split('/')[2]!;
}

function scenarioFromStoryPath(path: string): string {
  return path.split('/')[2]!;
}

const buckets = new Map<string, { tokens: NormalizedTokens; source: string; entries: ReturnType<typeof buildComponentEntry>[] }>();

for (const [path, source] of Object.entries(designMdSources)) {
  const id = scenarioFromDesignMdPath(path);
  const tokens = deriveTokens(parseDesignMd(source));
  buckets.set(id, { tokens, source, entries: [] });
}

for (const [path, mod] of Object.entries(storyModules)) {
  const id = scenarioFromStoryPath(path);
  const bucket = buckets.get(id);
  if (!bucket) continue;
  const relPath = path.replace(`./scenarios/${id}/`, '');
  const titleFallback = relPath
    .replace(/^components\//, '')
    .replace(/\.stories\.[tj]sx?$/, '')
    .split('/')
    .map((s) => s[0]!.toUpperCase() + s.slice(1))
    .join('/');
  const componentPath = `src/scenarios/${id}/${relPath.replace(/\.stories\.[tj]sx?$/, '.tsx')}`;
  const entry = buildComponentEntry(mod, {
    componentPath,
    titleFallback,
    propsSchema: inferPropsSchema(mod),
  });
  if (entry) bucket.entries.push(entry);
}

export const SCENARIOS: Scenario[] = Array.from(buckets.entries())
  .map(([id, b]) => {
    const meta = SCENARIO_META[id] ?? { label: id, description: '' };
    return {
      id,
      label: meta.label,
      description: meta.description,
      tokens: b.tokens,
      source: b.source,
      manifest: buildManifest(b.entries.filter((e): e is NonNullable<typeof e> => Boolean(e))),
    };
  })
  .sort((a, b) => a.label.localeCompare(b.label));

export const DEFAULT_SCENARIO_ID = 'default';
export const DEFAULT_SCENARIO = SCENARIOS.find((s) => s.id === DEFAULT_SCENARIO_ID) ?? SCENARIOS[0]!;

function inferPropsSchema(mod: Record<string, unknown>): PropsSchema | undefined {
  const meta = mod.default as
    | {
        args?: Record<string, unknown>;
        argTypes?: Record<
          string,
          {
            control?: string | { type?: string; options?: readonly string[] };
            options?: readonly string[];
            description?: string;
          }
        >;
      }
    | undefined;
  if (!meta || !meta.args) return undefined;
  const props: PropSchemaEntry[] = [];
  for (const [name, defaultValue] of Object.entries(meta.args)) {
    const argType = meta.argTypes?.[name] as
      | {
          control?:
            | string
            | false
            | { type?: string; options?: readonly string[]; min?: number; max?: number; step?: number };
          options?: readonly string[];
          min?: number;
          max?: number;
          step?: number;
          description?: string;
        }
      | undefined;
    let kind: PropSchemaEntry['type'];
    const ctrlObj = typeof argType?.control === 'object' && argType.control !== null ? argType.control : null;
    const controlType =
      typeof argType?.control === 'string'
        ? argType.control
        : ctrlObj?.type;
    const ctrlOptions = ctrlObj?.options ?? argType?.options;
    const rangeMin = ctrlObj?.min ?? argType?.min;
    const rangeMax = ctrlObj?.max ?? argType?.max;
    const rangeStep = ctrlObj?.step ?? argType?.step;
    if (controlType === 'range' && typeof defaultValue === 'number') {
      kind = { kind: 'range', min: rangeMin, max: rangeMax, step: rangeStep };
    } else if (ctrlOptions && (controlType === 'multi-select' || controlType === 'check' || controlType === 'inline-check')) {
      kind = {
        kind: 'multi-enum',
        options: [...ctrlOptions],
        layout: controlType as 'check' | 'inline-check' | 'multi-select',
      };
    } else if (ctrlOptions) {
      const layout: 'segmented' | 'inline-radio' | 'select' =
        controlType === 'inline-radio' ? 'inline-radio' : controlType === 'select' ? 'select' : 'segmented';
      kind = { kind: 'enum', options: [...ctrlOptions], layout };
    } else if (controlType === 'date') {
      kind = { kind: 'date' };
    } else if (typeof defaultValue === 'boolean') {
      kind = { kind: 'boolean' };
    } else if (typeof defaultValue === 'number') {
      kind = { kind: 'number' };
    } else if (typeof defaultValue === 'string') {
      kind = { kind: 'string' };
    } else if (typeof defaultValue === 'function') {
      kind = { kind: 'function' };
    } else if (defaultValue === undefined || defaultValue === null) {
      kind = { kind: 'string' };
    } else {
      kind = { kind: 'object' };
    }
    props.push({
      name,
      type: kind,
      required: false,
      defaultValue: typeof defaultValue === 'function' ? undefined : defaultValue,
      description: argType?.description,
    });
  }
  return { props };
}
