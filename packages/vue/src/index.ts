import type { Args, ArgTypes, Parameters, Decorator, PlayFunction } from '@vellum/story';

/**
 * Vue 3 binding for Vellum.
 *
 * Mirrors the React API surface but typed against Vue component definitions.
 * The host shell (Vellum runtime) mounts the component with `createApp` inside
 * the preview iframe. Story decorators receive a render function and a Vue
 * h() helper they can use to wrap the rendered story.
 *
 * Same `Meta` / `StoryObj` shape as `@vellum/react` so a CSF file written in
 * Vue keeps a Storybook-compatible structure.
 *
 *   const meta: Meta<typeof Button> = { component: Button, args: { ... } }
 *   export const Default: StoryObj<typeof meta> = { args: { ... } }
 */

// Minimal structural shape — keeps this package free of a hard Vue dep
// during typecheck. Real runtime mounts use the user's installed Vue.
export type VueComponent<P = Record<string, unknown>> = {
  __vellumVueProps?: P;
  // Any of the things createApp() accepts: options object, defineComponent,
  // SFC default export, etc.
  [key: string]: unknown;
};

export type ComponentProps<T> = T extends VueComponent<infer P> ? P : T;

export type Meta<T = unknown> = {
  title?: string;
  component: VueComponent<ComponentProps<T>>;
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
  /** Vue render override. Returns a VNode tree. */
  render?: (args: Args) => unknown;
  decorators?: readonly Decorator[];
  tags?: readonly string[];
  play?: PlayFunction;
};

/** Re-export shared types so consumers import everything from one place. */
export type { Args, ArgTypes, Parameters, Decorator, PlayFunction } from '@vellum/story';
