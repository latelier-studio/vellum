import type { Args, ArgTypes, Parameters, Decorator, PlayFunction } from '@vellum/story';

/**
 * Svelte 4/5 binding for Vellum.
 *
 * Same CSF surface as `@vellum/react` and `@vellum/vue` so a story file in
 * a Svelte codebase keeps the Storybook-compatible structure (default export
 * meta + named story exports). The host shell mounts via Svelte's `mount()`
 * inside the preview iframe.
 *
 *   const meta: Meta<typeof Button> = { component: Button, args: { ... } }
 *   export const Default: StoryObj<typeof meta> = { args: { ... } }
 */

// Structural shape only — typecheck stays free of a hard Svelte dep.
export type SvelteComponent<P = Record<string, unknown>> = {
  __vellumSvelteProps?: P;
  [key: string]: unknown;
};

export type ComponentProps<T> = T extends SvelteComponent<infer P> ? P : T;

export type Meta<T = unknown> = {
  title?: string;
  component: SvelteComponent<ComponentProps<T>>;
  args?: Partial<ComponentProps<T>>;
  argTypes?: ArgTypes;
  parameters?: Parameters;
  decorators?: readonly Decorator[];
  tags?: readonly string[];
  play?: PlayFunction;
};

export type StoryObj<TMeta = unknown> = {
  name?: string;
  args?: Partial<TMeta extends Meta<infer T> ? ComponentProps<T> : ComponentProps<TMeta>>;
  argTypes?: ArgTypes;
  parameters?: Parameters;
  /** Svelte render override — returns a renderable. Use sparingly. */
  render?: (args: Args) => unknown;
  decorators?: readonly Decorator[];
  tags?: readonly string[];
  play?: PlayFunction;
};

export type { Args, ArgTypes, Parameters, Decorator, PlayFunction } from '@vellum/story';
