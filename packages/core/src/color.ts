import { converter, formatCss, oklch, parse } from 'culori';
import type { OKLCH } from './types.js';

const toOklch = converter('oklch');

/**
 * Convert any CSS color input (hex / rgb / hsl / oklch / named) to OKLCH.
 * Throws on unparseable input — callers should validate.
 */
export function toOKLCH(input: string | OKLCH): OKLCH {
  if (typeof input === 'object' && input !== null && 'l' in input) {
    return input;
  }
  const parsed = parse(input as string);
  if (!parsed) {
    throw new Error(`Cannot parse color: ${input}`);
  }
  const o = toOklch(parsed);
  if (!o) {
    throw new Error(`Cannot convert to OKLCH: ${input}`);
  }
  return {
    l: o.l ?? 0,
    c: o.c ?? 0,
    h: o.h ?? 0,
    alpha: o.alpha,
  };
}

export function formatOKLCH(c: OKLCH): string {
  const obj = oklch({
    mode: 'oklch',
    l: c.l,
    c: c.c,
    h: c.h,
    alpha: c.alpha,
  });
  return formatCss(obj) ?? `oklch(${c.l} ${c.c} ${c.h})`;
}

/** Lighten an OKLCH color by delta (clamped 0..1). */
export function lighten(c: OKLCH, delta: number): OKLCH {
  return { ...c, l: clamp(c.l + delta, 0, 1) };
}

export function darken(c: OKLCH, delta: number): OKLCH {
  return { ...c, l: clamp(c.l - delta, 0, 1) };
}

/** Mix two OKLCH colors by t (0 = a, 1 = b). */
export function mix(a: OKLCH, b: OKLCH, t: number): OKLCH {
  const u = clamp(t, 0, 1);
  return {
    l: a.l * (1 - u) + b.l * u,
    c: a.c * (1 - u) + b.c * u,
    h: lerpHue(a.h, b.h, u),
    alpha: lerpOptional(a.alpha, b.alpha, u),
  };
}

export function withAlpha(c: OKLCH, alpha: number): OKLCH {
  return { ...c, alpha: clamp(alpha, 0, 1) };
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

function lerpHue(a: number, b: number, t: number): number {
  let diff = b - a;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  const h = a + diff * t;
  return (h + 360) % 360;
}

function lerpOptional(a: number | undefined, b: number | undefined, t: number): number | undefined {
  if (a === undefined && b === undefined) return undefined;
  const av = a ?? 1;
  const bv = b ?? 1;
  return av * (1 - t) + bv * t;
}

/** Determine if an OKLCH color is "light" (L > 0.62). */
export function isLight(c: OKLCH): boolean {
  return c.l > 0.62;
}
