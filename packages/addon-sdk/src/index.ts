import type { ComponentType } from 'react';
import type { Args, ArgTypes, ComponentEntry, Parameters, StoryEntry } from '@vellum/story';

/**
 * Addon SDK.
 *
 * Lets third parties register Workbench panels and parameter handlers
 * without forking Vellum. Inspired by Storybook's addon API but deliberately
 * narrower — V2 ships only what's needed to extend the right rail.
 */

/** Context passed to every addon panel. */
export type AddonContext = {
  component: ComponentEntry;
  story: StoryEntry;
  args: Args;
  setArgs: (next: Args) => void;
  argTypes?: ArgTypes;
  parameters?: Parameters;
};

export type PanelDefinition = {
  /** Unique stable id (e.g. `viewport`). Two addons can't claim the same id. */
  id: string;
  /** Visible tab label. */
  title: string;
  /** Renders the panel body. */
  render: ComponentType<AddonContext>;
  /** Optional badge count function. Returned number is shown next to the tab. */
  badge?: (ctx: AddonContext) => number | string | null;
  /** Optional ordering hint. Lower numbers render first. */
  order?: number;
};

export type ParameterHandler<T = unknown> = {
  /** Key under `parameters` to claim (e.g. `backgrounds`). */
  key: string;
  /** Default applied when no story sets the key. */
  default?: T;
  /** Optional decorator-like wrap applied to the rendered story. */
  decorate?: (value: T, children: unknown) => unknown;
};

export type AddonDefinition = {
  name: string;
  panels?: PanelDefinition[];
  parameters?: ParameterHandler[];
};

/**
 * Define an addon. The return value is consumed by the host shell at
 * boot via `registerAddons([...])`.
 *
 *   export default defineAddon({ name: 'theme-toggle', panels: [...] })
 */
export function defineAddon(addon: AddonDefinition): AddonDefinition {
  if (!addon.name) throw new Error('Addon must have a name');
  for (const p of addon.panels ?? []) {
    if (!p.id) throw new Error(`Addon '${addon.name}' has a panel without an id`);
  }
  return addon;
}

const REGISTRY: AddonDefinition[] = [];

/** Host shells call this at boot with all installed addons. */
export function registerAddons(list: AddonDefinition[]): void {
  REGISTRY.length = 0;
  REGISTRY.push(...list);
}

/** Chrome implementations read the registry to compose the right rail. */
export function listPanels(): PanelDefinition[] {
  const all = REGISTRY.flatMap((a) => a.panels ?? []);
  return all.sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}

export function listParameterHandlers(): ParameterHandler[] {
  return REGISTRY.flatMap((a) => a.parameters ?? []);
}
