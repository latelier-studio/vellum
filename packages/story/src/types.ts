import type { ComponentType, ReactElement, ReactNode } from 'react';

export type Args = Record<string, unknown>;

export type ArgControlType =
  | 'boolean'
  | 'text'
  | 'number'
  | 'range'
  | 'select'
  | 'radio'
  | 'inline-radio'
  | 'check'
  | 'inline-check'
  | 'multi-select'
  | 'color'
  | 'date'
  | 'object';

/**
 * Accepts both shorthand (`control: 'range'`) and the Storybook object form
 * (`control: { type: 'range', min: 0, max: 100, step: 1 }`).
 */
export type ArgControl =
  | ArgControlType
  | false
  | { type: 'number' | 'range'; min?: number; max?: number; step?: number }
  | { type: 'select' | 'radio' | 'inline-radio' | 'check' | 'inline-check' | 'multi-select'; options?: readonly string[] }
  | { type: 'color' | 'text' | 'boolean' | 'date' | 'object' };

export type ArgType = {
  control?: ArgControl;
  options?: readonly string[];
  description?: string;
  defaultValue?: unknown;
  min?: number;
  max?: number;
  step?: number;
};

export type ArgTypes = Record<string, ArgType>;

export type Parameters = Record<string, unknown>;

/** Context passed to decorators and play functions. */
export type StoryContext = {
  args: Args;
  argTypes?: ArgTypes;
  parameters?: Parameters;
  componentId: string;
  storyId: string;
  name: string;
};

/** Wraps a story render. Identical shape to Storybook's decorator. */
export type Decorator = (
  Story: (overrideContext?: Partial<StoryContext>) => ReactElement,
  context: StoryContext,
) => ReactNode;

/** Interaction-test hook. Runs after the story mounts. */
export type PlayContext = StoryContext & { canvasElement: HTMLElement };
export type PlayFunction = (context: PlayContext) => void | Promise<void>;

/**
 * Resolve to the props of a component type, or pass through if T is already props.
 *
 * Allows users to write:
 *   const meta: Meta<typeof Button> = { component: Button, args: {...} }
 * matching Storybook 7+ ergonomics.
 */
export type ComponentProps<T> = T extends ComponentType<infer P> ? P : T;

export type Meta<T = unknown> = {
  /** Optional story tree title, e.g. 'Inputs/Button'. Derived from filename if absent. */
  title?: string;
  component: ComponentType<ComponentProps<T>>;
  args?: Partial<ComponentProps<T>>;
  argTypes?: ArgTypes;
  parameters?: Parameters;
  /** Optional render override for the component as a whole. */
  render?: (args: ComponentProps<T>) => ReactElement;
  /**
   * Decorators wrap every story in this component. Outermost first.
   * Story-level decorators stack inside meta-level ones.
   */
  decorators?: readonly Decorator[];
  /** Routing/visibility tags. Recognised: `hidden` (omit from sidebar). */
  tags?: readonly string[];
  /** Default play function inherited by stories that don't override it. */
  play?: PlayFunction;
};

export type StoryObj<TMeta = unknown> = {
  name?: string;
  args?: Partial<TMeta extends Meta<infer T> ? ComponentProps<T> : ComponentProps<TMeta>>;
  argTypes?: ArgTypes;
  parameters?: Parameters;
  render?: (args: TMeta extends Meta<infer T> ? ComponentProps<T> : ComponentProps<TMeta>) => ReactElement;
  decorators?: readonly Decorator[];
  tags?: readonly string[];
  /** Interaction test. Runs after the story mounts with a real DOM canvas element. */
  play?: PlayFunction;
};

export type PropType =
  | { kind: 'boolean' }
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'range'; min?: number; max?: number; step?: number }
  | { kind: 'enum'; options: string[]; layout?: 'segmented' | 'inline-radio' | 'select' }
  | { kind: 'multi-enum'; options: string[]; layout?: 'check' | 'inline-check' | 'multi-select' }
  | { kind: 'date' }
  | { kind: 'union'; members: PropType[] }
  | { kind: 'function' }
  | { kind: 'object' }
  | { kind: 'node' }
  | { kind: 'unknown'; raw: string };

export type PropSchemaEntry = {
  name: string;
  type: PropType;
  required: boolean;
  defaultValue?: unknown;
  description?: string;
  tags?: Record<string, string>;
};

export type PropsSchema = {
  props: PropSchemaEntry[];
  /** Source path used to compute the schema, if known. */
  sourcePath?: string;
};

export type ComponentEntry = {
  id: string;
  name: string;
  title: string;
  componentPath: string;
  /** Live ref. Filled when the module is loaded. */
  Component: ComponentType<unknown>;
  meta: Meta<unknown>;
  propsSchema?: PropsSchema;
  stories: StoryEntry[];
  tags?: readonly string[];
};

export type StoryEntry = {
  id: string;
  componentId: string;
  name: string;
  exportName: string;
  args: Args;
  argTypes?: ArgTypes;
  parameters?: Parameters;
  render?: (args: Args) => ReactElement;
  /** Composed: meta.decorators outermost, story.decorators innermost. */
  decorators?: readonly Decorator[];
  tags?: readonly string[];
  play?: PlayFunction;
};

export type StoryManifest = {
  components: ComponentEntry[];
};
