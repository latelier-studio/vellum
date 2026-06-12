import { useMemo } from 'react';
import { useManifest } from '@vellum/react';
import type { Args, ComponentEntry, StoryEntry } from '@vellum/story';
import { findStory } from '@vellum/story';

/**
 * Sandpack-backed inline editor for a Vellum story.
 *
 * Renders a CodeSandbox Sandpack instance pre-loaded with the story's
 * component source + a small wrapper that mounts it with the story's args.
 * Live editing recompiles in the iframe — the user can fork the snippet
 * without leaving the docs page.
 *
 * Usage:
 *   import { LiveStory } from '@vellum/sandpack';
 *   <LiveStory of={ButtonStories.Primary} sourceFiles={{ 'Button.tsx': buttonSource }} />
 *
 * NOTE: Sandpack itself is a peer dep. Install `@codesandbox/sandpack-react`
 * in the consuming app and pass it in via the `sandpack` slot so this package
 * stays runtime-agnostic.
 */

export type LiveStoryProps = {
  /** Reference into the story manifest (id or story entry). */
  of: { id: string } | StoryEntry;
  /** Bundle of source files Sandpack should display. Keys are paths. */
  sourceFiles: Record<string, string>;
  /** Optional Sandpack template (defaults to `react-ts`). */
  template?: 'react' | 'react-ts' | 'vanilla' | 'vanilla-ts';
  /** Inject a Sandpack component. The package is peer-installed. */
  sandpack: (props: SandpackInjectorProps) => JSX.Element;
};

export type SandpackInjectorProps = {
  template: 'react' | 'react-ts' | 'vanilla' | 'vanilla-ts';
  files: Record<string, string>;
  activeFile: string;
};

export function LiveStory({ of, sourceFiles, template = 'react-ts', sandpack }: LiveStoryProps) {
  const manifest = useManifest();
  const resolved = useMemo(() => resolve(of, manifest), [of, manifest]);
  if (!resolved) return null;
  const { component, story } = resolved;
  const entryFile = buildEntry(component, story);
  const activeFile = pickActiveFile(sourceFiles, component);
  const files: Record<string, string> = {
    ...sourceFiles,
    '/App.tsx': entryFile,
  };
  return sandpack({ template, files, activeFile });
}

function resolve(
  of: LiveStoryProps['of'],
  manifest: { components: ComponentEntry[] },
): { component: ComponentEntry; story: StoryEntry } | null {
  if ('id' in of && typeof of.id === 'string') {
    if ((of as StoryEntry).componentId) {
      const c = manifest.components.find((c) => c.id === (of as StoryEntry).componentId);
      if (c) return { component: c, story: of as StoryEntry };
    }
    return findStory({ components: manifest.components }, of.id);
  }
  return null;
}

function buildEntry(component: ComponentEntry, story: StoryEntry): string {
  const argsLiteral = stringifyArgs(story.args);
  const importPath = pickImportPath(component);
  const componentName = component.name;
  return `import { ${componentName} } from '${importPath}';

const args = ${argsLiteral};

export default function App() {
  return <${componentName} {...args} />;
}
`;
}

function pickActiveFile(files: Record<string, string>, component: ComponentEntry): string {
  // Prefer the component's own file if present.
  const base = component.componentPath.split('/').pop();
  const match = base ? Object.keys(files).find((k) => k.endsWith(base)) : undefined;
  return match ?? '/App.tsx';
}

function pickImportPath(component: ComponentEntry): string {
  const parts = component.componentPath.replace(/\.[tj]sx?$/, '').split('/');
  const last = parts[parts.length - 1] ?? component.name;
  return `./${last}`;
}

function stringifyArgs(args: Args): string {
  const safe = Object.fromEntries(
    Object.entries(args).filter(([, v]) => typeof v !== 'function'),
  );
  return JSON.stringify(safe, null, 2);
}
