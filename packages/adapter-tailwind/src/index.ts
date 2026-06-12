import { toOKLCH } from '@vellum/core';
import type { PartialTokens, TypeScale } from '@vellum/core';

/**
 * Adapter for Tailwind config (v3 + v4).
 *
 * Tailwind ships config as JS/TS modules — the caller imports it and hands
 * the resolved object to `parseTailwind`. This keeps the adapter pure
 * (no fs/dynamic import, no Tailwind dependency).
 *
 * Usage:
 *   import config from './tailwind.config.js';
 *   const tokens = parseTailwind(config);
 *
 * Recognised theme paths (under `theme` or `theme.extend`):
 *   - colors.{background,foreground,primary,muted,border,accent,...}
 *     OR primary scale (50…950) → picks the 500 step
 *   - fontFamily.{sans,serif,mono,display}
 *   - borderRadius.{DEFAULT,md,sm,lg}
 *   - spacing.4 (used as spacing base when present)
 *   - density (custom): 'compact' | 'comfortable' | 'airy'
 */
export type TailwindThemeLike = {
  theme?: TailwindTheme;
};

type TailwindTheme = {
  colors?: Record<string, string | Record<string, string>>;
  fontFamily?: Record<string, string | string[]>;
  borderRadius?: Record<string, string>;
  spacing?: Record<string, string>;
  density?: 'compact' | 'comfortable' | 'airy';
  extend?: TailwindTheme;
};

export function parseTailwind(config: TailwindThemeLike): PartialTokens {
  const theme = mergeTheme(config.theme);
  const tokens: PartialTokens = {};

  // Colors
  const color: NonNullable<PartialTokens['color']> = {};
  if (theme.colors) {
    const pick = (k: string): string | undefined => {
      const raw = theme.colors?.[k];
      if (typeof raw === 'string') return raw;
      if (raw && typeof raw === 'object') {
        // shadcn-style: background, foreground, primary, etc. live as scales
        // pick 500 if present, then DEFAULT, then first key
        return raw['500'] ?? raw['DEFAULT'] ?? Object.values(raw)[0];
      }
      return undefined;
    };
    const map: Array<[keyof NonNullable<PartialTokens['color']>, string[]]> = [
      ['bg', ['background', 'bg', 'white']],
      ['fg', ['foreground', 'fg', 'text', 'black']],
      ['border', ['border', 'gray']],
      ['muted', ['muted']],
      ['muted-fg', ['mutedForeground', 'muted-foreground']],
      ['accent', ['primary', 'accent', 'brand']],
      ['accent-fg', ['primaryForeground', 'primary-foreground', 'accentForeground']],
    ];
    for (const [target, sources] of map) {
      for (const src of sources) {
        const v = pick(src);
        if (v) {
          try {
            color[target] = toOKLCH(v);
          } catch {
            /* unparseable */
          }
          break;
        }
      }
    }
    if (Object.keys(color).length > 0) tokens.color = color;
  }

  // Type
  if (theme.fontFamily) {
    const ff = theme.fontFamily;
    const first = (v: string | string[] | undefined): string | undefined => {
      if (!v) return undefined;
      return Array.isArray(v) ? v[0] : v.split(',')[0]?.trim();
    };
    const type: NonNullable<PartialTokens['type']> = {};
    const display = first(ff.display) ?? first(ff.serif) ?? first(ff.sans);
    const body = first(ff.sans);
    const mono = first(ff.mono);
    if (display) type.display = { family: display, weight: 600 };
    if (body) type.body = { family: body, weight: 400 };
    if (mono) type.mono = { family: mono };
    if (display || body || mono) tokens.type = type;
  }

  // Radius
  if (theme.borderRadius) {
    const r = theme.borderRadius;
    const radius: NonNullable<PartialTokens['radius']> = {};
    const md = r.DEFAULT ?? r.md;
    if (r.sm) radius.sm = r.sm;
    if (md) radius.md = md;
    if (r.lg) radius.lg = r.lg;
    if (Object.keys(radius).length > 0) tokens.radius = radius;
  }

  // Space
  if (theme.spacing) {
    const four = theme.spacing['4'];
    if (four) {
      const num = parseInt(four.replace(/[a-z]+$/i, ''), 10);
      if (Number.isFinite(num) && (num === 8 || num === 16)) {
        tokens.space = { base: num === 16 ? 8 : 4 };
      }
    }
  }
  if (theme.density) {
    tokens.space = { ...(tokens.space ?? {}), density: theme.density };
  }

  return tokens;
}

function mergeTheme(theme?: TailwindTheme): TailwindTheme {
  if (!theme) return {};
  const base: TailwindTheme = { ...theme };
  if (theme.extend) {
    for (const [k, v] of Object.entries(theme.extend) as Array<[keyof TailwindTheme, unknown]>) {
      if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object') {
        (base as Record<string, unknown>)[k] = { ...(base[k] as object), ...(v as object) };
      } else if (v !== undefined) {
        (base as Record<string, unknown>)[k] = v;
      }
    }
    delete base.extend;
  }
  return base;
}

/** Re-export for ergonomic alias compatibility. */
export type { TypeScale };
