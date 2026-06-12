import { darken, isLight, lighten, mix, toOKLCH, withAlpha } from './color.js';
import { DEFAULT_TOKENS_LIGHT } from './defaults.js';
import type { NormalizedTokens, PartialTokens, TypeScale } from './types.js';

/**
 * Derive a complete NormalizedTokens from partial user input.
 * - Missing tokens fall back to defaults.
 * - Stateful color tokens (hover/active/disabled) auto-derived from accent if absent.
 * - Radius sm/lg auto-derived from md if only md given.
 * - Typography scale auto-applied.
 */
export function deriveTokens(input: PartialTokens): NormalizedTokens {
  const base = DEFAULT_TOKENS_LIGHT;

  const color = {
    ...base.color,
    ...input.color,
  };

  // OKLCH parse safety for any user-provided color that came in as a string
  // (adapters normalize before calling here, but guard anyway).
  for (const key of Object.keys(color) as Array<keyof typeof color>) {
    const v = color[key];
    if (v && typeof v === 'object' && 'l' in v) continue;
    if (typeof v === 'string') {
      color[key] = toOKLCH(v as unknown as string);
    }
  }

  const accent = color.accent;
  if (color['accent-hover'] === undefined) {
    color['accent-hover'] = isLight(accent) ? darken(accent, 0.04) : lighten(accent, 0.04);
  }
  if (color['accent-active'] === undefined) {
    color['accent-active'] = isLight(accent) ? darken(accent, 0.08) : lighten(accent, 0.08);
  }
  if (color['accent-disabled'] === undefined) {
    color['accent-disabled'] = mix(accent, color.muted, 0.7);
  }
  if (color['focus-ring'] === undefined) {
    color['focus-ring'] = withAlpha(accent, 0.4);
  }

  // Radius: support a "base" shortcut from PartialTokens
  let radius = { ...base.radius, ...input.radius };
  const baseRadius = (input.radius as { base?: string } | undefined)?.base;
  if (baseRadius) {
    radius = deriveRadiusFromBase(baseRadius);
    if (input.radius?.sm) radius.sm = input.radius.sm;
    if (input.radius?.md) radius.md = input.radius.md;
    if (input.radius?.lg) radius.lg = input.radius.lg;
  }

  const type = {
    display: {
      family: input.type?.display?.family ?? base.type.display.family,
      weight: input.type?.display?.weight ?? base.type.display.weight,
    },
    body: {
      family: input.type?.body?.family ?? base.type.body.family,
      weight: input.type?.body?.weight ?? base.type.body.weight,
    },
    mono: {
      family: input.type?.mono?.family ?? base.type.mono.family,
    },
    scale: input.type?.scale ?? base.type.scale,
  };

  const space = {
    base: (input.space?.base ?? base.space.base) as 4 | 8,
    density: input.space?.density ?? base.space.density,
  };

  const shadow = { ...base.shadow, ...input.shadow };

  const motion = {
    duration: {
      fast: input.motion?.duration?.fast ?? base.motion.duration.fast,
      base: input.motion?.duration?.base ?? base.motion.duration.base,
      slow: input.motion?.duration?.slow ?? base.motion.duration.slow,
    },
    easing: input.motion?.easing ?? base.motion.easing,
  };

  const meta = {
    name: input.meta?.name,
    chrome: input.meta?.chrome ?? base.meta.chrome,
    colorScheme: input.meta?.colorScheme ?? base.meta.colorScheme,
  };

  return { color, radius, type, space, shadow, motion, meta };
}

function deriveRadiusFromBase(base: string): NormalizedTokens['radius'] {
  const match = /^([\d.]+)(px|rem|em)$/.exec(base.trim());
  if (!match) return { sm: base, md: base, lg: base };
  const n = parseFloat(match[1]!);
  const unit = match[2]!;
  return {
    sm: `${n / 2}${unit}`,
    md: base,
    lg: `${n * 1.5}${unit}`,
  };
}

const SCALE_RATIOS: Record<string, number> = {
  'minor-second': 1.067,
  'major-second': 1.125,
  'minor-third': 1.2,
  'major-third': 1.25,
  'perfect-fourth': 1.333,
  'augmented-fourth': 1.414,
  'perfect-fifth': 1.5,
};

/**
 * Compute a 9-step type scale (xs..5xl) from a ratio.
 * Base step (md) is 1rem.
 */
export function computeTypeScale(scale: TypeScale): Record<string, string> {
  const ratio = typeof scale === 'number' ? scale : (SCALE_RATIOS[scale] ?? 1.25);
  const steps = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
  const out: Record<string, string> = {};
  steps.forEach((step, i) => {
    const exp = i - 2; // md is index 2 → 1rem
    const v = Math.pow(ratio, exp);
    out[step] = `${round(v, 4)}rem`;
  });
  return out;
}

function round(v: number, p: number): number {
  const k = Math.pow(10, p);
  return Math.round(v * k) / k;
}
