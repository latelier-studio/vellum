import type {
  Args,
  ComponentEntry,
  Meta,
  PropsSchema,
  StoryEntry,
  StoryManifest,
  StoryObj,
} from './types.js';

/**
 * Build a single ComponentEntry from a CSF module shape.
 * `module` is a plain { default: Meta, ...stories } object.
 */
export function buildComponentEntry(
  module: Record<string, unknown>,
  options: {
    componentPath: string;
    titleFallback?: string;
    propsSchema?: PropsSchema;
  },
): ComponentEntry | null {
  const meta = module.default as Meta<unknown> | undefined;
  if (!meta || typeof meta !== 'object' || !('component' in meta)) {
    return null;
  }

  const title = meta.title ?? options.titleFallback ?? meta.component.displayName ?? 'Untitled';
  const componentId = slug(title);
  const name = title.split('/').pop() ?? title;

  const stories: StoryEntry[] = [];
  for (const [exportName, value] of Object.entries(module)) {
    if (exportName === 'default') continue;
    if (!value || typeof value !== 'object') continue;
    // Accept both StoryObj 3.0 (object with args/render) and plain render functions.
    let story: StoryObj<typeof meta>;
    if (typeof value === 'function') {
      story = { render: value as StoryObj<typeof meta>['render'] };
    } else {
      story = value as StoryObj<typeof meta>;
    }

    const storyName = story.name ?? prettify(exportName);
    const args: Args = { ...(meta.args ?? {}), ...((story.args ?? {}) as Args) };
    const metaDecorators = meta.decorators ?? [];
    const storyDecorators = story.decorators ?? [];
    const decorators = [...metaDecorators, ...storyDecorators];
    const storyTags = story.tags ? Array.from(new Set([...(meta.tags ?? []), ...story.tags])) : meta.tags;
    stories.push({
      id: `${componentId}--${slug(storyName)}`,
      componentId,
      name: storyName,
      exportName,
      args,
      argTypes: { ...(meta.argTypes ?? {}), ...(story.argTypes ?? {}) },
      parameters: { ...(meta.parameters ?? {}), ...(story.parameters ?? {}) },
      render: story.render as ((args: Args) => ReturnType<NonNullable<StoryObj['render']>>) | undefined,
      decorators: decorators.length > 0 ? decorators : undefined,
      tags: storyTags,
      play: story.play ?? meta.play,
    });
  }

  return {
    id: componentId,
    name,
    title,
    componentPath: options.componentPath,
    Component: meta.component as ComponentEntry['Component'],
    meta: meta as Meta<unknown>,
    propsSchema: options.propsSchema,
    stories,
    tags: meta.tags,
  };
}

/** Storybook-compatible 'hidden' tag check. */
export function isHidden(entry: { tags?: readonly string[] }): boolean {
  return entry.tags?.includes('hidden') ?? false;
}

export function visibleComponents(manifest: StoryManifest): ComponentEntry[] {
  return manifest.components.filter((c) => !isHidden(c));
}

export function visibleStories(component: ComponentEntry): StoryEntry[] {
  return component.stories.filter((s) => !isHidden(s));
}

export function buildManifest(entries: ComponentEntry[]): StoryManifest {
  return { components: entries };
}

export function findStory(manifest: StoryManifest, storyId: string): {
  component: ComponentEntry;
  story: StoryEntry;
} | null {
  for (const c of manifest.components) {
    const s = c.stories.find((s) => s.id === storyId);
    if (s) return { component: c, story: s };
  }
  return null;
}

export function findComponent(manifest: StoryManifest, componentId: string): ComponentEntry | null {
  return manifest.components.find((c) => c.id === componentId) ?? null;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function prettify(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}
