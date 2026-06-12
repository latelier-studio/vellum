import type { Args, ComponentEntry, StoryEntry } from '@vellum/story';

/**
 * RSC preview (React Server Components).
 *
 * Server-rendered story preview for design systems that ship Server
 * Components. The Vellum runtime hands the component + args to this helper;
 * the helper returns a server-component VNode the host page can stream.
 *
 * Targets Next.js App Router and any Vite/React Router setup that exposes
 * a server runtime. Client Components (`'use client'`) work the same as in
 * the iframe preview — they re-mount on the client after hydration.
 *
 * STATUS: scaffold. The full pipeline (server entry route, payload streaming,
 * cache busting on token change) is V2.1. This package ships the typed
 * contract so consumers can wire it up today.
 */

export type RscPreviewProps = {
  component: ComponentEntry;
  story: StoryEntry;
  args?: Args;
};

/**
 * Build a server-component tree for the given story. The result can be
 * returned from a Next.js route (`app/preview/[storyId]/page.tsx`).
 *
 * NOTE: the function is async to leave room for component loading via
 * `import()`; today it's a stub.
 */
export async function renderStoryRSC(props: RscPreviewProps): Promise<unknown> {
  const { component, story, args } = props;
  const finalArgs = { ...(story.args ?? {}), ...(args ?? {}) };
  const Component = component.Component as (props: Args) => unknown;
  // Caller is expected to be a server component file or wrapper. Returning
  // the constructed VNode directly keeps this function runtime-agnostic.
  return Component(finalArgs);
}

/**
 * Convenience type for a Next.js App Router page consuming this package:
 *
 *   // app/preview/[storyId]/page.tsx
 *   import { renderStoryRSC, type PreviewPageProps } from '@vellum/rsc-preview';
 *
 *   export default async function PreviewPage({ params }: PreviewPageProps) {
 *     const { component, story } = await loadStory(params.storyId);
 *     return renderStoryRSC({ component, story });
 *   }
 */
export type PreviewPageProps = {
  params: { storyId: string };
};
