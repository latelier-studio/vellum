import { toOKLCH } from '@vellum/core';
import type { PartialTokens } from '@vellum/core';

/**
 * Token inference from raw CSS or Tailwind class lists.
 *
 * Rule-based and deterministic — no LLM, no network. It looks for high-
 * confidence signals (most-used color, font-family declarations, repeated
 * border radii) and proposes a `PartialTokens` baseline. The result is meant
 * to be opened in an editor next to a `design.md` and trimmed by hand.
 *
 * This is the V2 starter for AI inference. A later version can plug in an
 * LLM behind the same surface (`inferTokens(text, { use: 'llm' })`).
 */

export type InferInput = {
  /** Raw CSS or stylesheet text. */
  css?: string;
  /** Space-separated Tailwind class list pulled from a representative page. */
  tailwindClasses?: string;
};

export type InferenceReport = {
  tokens: PartialTokens;
  notes: string[];
};

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const RGB_RE = /rgb[a]?\(([^)]+)\)/gi;
const HSL_RE = /hsl[a]?\(([^)]+)\)/gi;
const FONT_FAMILY_RE = /font-family\s*:\s*([^;]+);/gi;
const BORDER_RADIUS_RE = /border-radius\s*:\s*([^;]+);/gi;

export function inferTokens(input: InferInput): InferenceReport {
  const notes: string[] = [];
  const tokens: PartialTokens = {};

  if (input.css) {
    const colorHits = collectColors(input.css);
    const palette = rankColors(colorHits);
    if (palette.length > 0) {
      const color: NonNullable<PartialTokens['color']> = {};
      // Heuristic: lightest = bg, darkest = fg, most frequent saturated = accent
      const sorted = [...palette].sort((a, b) => luminance(a) - luminance(b));
      const darkest = sorted[0];
      const lightest = sorted[sorted.length - 1];
      const accent = pickAccent(palette);
      if (lightest) {
        try {
          color.bg = toOKLCH(lightest);
        } catch {
          /* skip */
        }
      }
      if (darkest) {
        try {
          color.fg = toOKLCH(darkest);
        } catch {
          /* skip */
        }
      }
      if (accent) {
        try {
          color.accent = toOKLCH(accent);
        } catch {
          /* skip */
        }
      }
      if (Object.keys(color).length > 0) {
        tokens.color = color;
        notes.push(`Inferred ${Object.keys(color).length} color tokens from ${colorHits.length} CSS color literals.`);
      }
    }

    const fonts = collectFonts(input.css);
    if (fonts.length > 0) {
      const sansLike = fonts.find((f) => /sans|inter|roboto|system|arial/i.test(f));
      const serifLike = fonts.find((f) => /serif|georgia|fraunces|lora|playfair|source serif/i.test(f));
      const monoLike = fonts.find((f) => /mono|consolas|menlo|courier|jetbrains/i.test(f));
      const type: NonNullable<PartialTokens['type']> = {};
      if (serifLike) type.display = { family: serifLike, weight: 600 };
      else if (sansLike) type.display = { family: sansLike, weight: 700 };
      if (sansLike) type.body = { family: sansLike, weight: 400 };
      if (monoLike) type.mono = { family: monoLike };
      if (Object.keys(type).length > 0) {
        tokens.type = type;
        notes.push(`Inferred type stack from ${fonts.length} font-family declarations.`);
      }
    }

    const radii = collectRadii(input.css);
    if (radii.length > 0) {
      const median = radii.sort((a, b) => a - b)[Math.floor(radii.length / 2)] ?? 0;
      const radius: NonNullable<PartialTokens['radius']> = {
        sm: `${Math.round(median / 2)}px`,
        md: `${median}px`,
        lg: `${Math.round(median * 1.5)}px`,
      };
      tokens.radius = radius;
      notes.push(`Inferred radius scale from ${radii.length} border-radius rules (median ${median}px).`);
    }
  }

  if (input.tailwindClasses) {
    // Tailwind class scan: look for bg-* / text-* / rounded-* patterns to
    // back-fill any gaps left by the CSS pass.
    const tw = input.tailwindClasses;
    if (!tokens.radius) {
      const round = /\brounded(?:-([a-z0-9]+))?\b/.exec(tw);
      if (round) {
        const map: Record<string, string> = {
          none: '0',
          sm: '2px',
          md: '6px',
          lg: '8px',
          xl: '12px',
          '2xl': '16px',
          full: '9999px',
          DEFAULT: '4px',
        };
        const px = map[round[1] ?? 'DEFAULT'] ?? '4px';
        tokens.radius = { sm: `${parseInt(px) / 2 || 1}px`, md: px, lg: `${parseInt(px) * 1.5 || 6}px` };
        notes.push(`Inferred radius from Tailwind 'rounded-${round[1] ?? 'DEFAULT'}'.`);
      }
    }
  }

  if (notes.length === 0) notes.push('No high-confidence signals found. Provide more CSS / class samples.');
  return { tokens, notes };
}

function collectColors(css: string): string[] {
  const hits: string[] = [];
  for (const m of css.matchAll(HEX_RE)) hits.push(m[0]);
  for (const m of css.matchAll(RGB_RE)) hits.push(m[0]);
  for (const m of css.matchAll(HSL_RE)) hits.push(m[0]);
  return hits;
}

function rankColors(hits: string[]): string[] {
  const count = new Map<string, number>();
  for (const h of hits) count.set(h, (count.get(h) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k]) => k);
}

function luminance(color: string): number {
  // Very coarse — only intended for sorting. Hex case only.
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.length === 3 ? hex[0]! + hex[0]! : hex.slice(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1]! + hex[1]! : hex.slice(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2]! + hex[2]! : hex.slice(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }
  return 128;
}

function pickAccent(palette: string[]): string | undefined {
  // Pick the first color that's neither near-black nor near-white.
  return palette.find((c) => {
    const l = luminance(c);
    return l > 30 && l < 220;
  });
}

function collectFonts(css: string): string[] {
  const found = new Set<string>();
  for (const m of css.matchAll(FONT_FAMILY_RE)) {
    const first = m[1]?.split(',')[0]?.trim().replace(/^["']|["']$/g, '');
    if (first) found.add(first);
  }
  return [...found];
}

function collectRadii(css: string): number[] {
  const values: number[] = [];
  for (const m of css.matchAll(BORDER_RADIUS_RE)) {
    const num = parseFloat(m[1] ?? '');
    if (Number.isFinite(num) && num > 0) values.push(num);
  }
  return values;
}
