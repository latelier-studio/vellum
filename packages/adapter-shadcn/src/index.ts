import { toOKLCH } from '@vellum/core';
import type { PartialTokens } from '@vellum/core';

/**
 * Map of shadcn semantic var name -> Vellum normalized color key.
 */
const COLOR_MAP: Record<string, string> = {
  background: 'bg',
  foreground: 'fg',
  border: 'border',
  muted: 'muted',
  'muted-foreground': 'muted-fg',
  primary: 'accent',
  'primary-foreground': 'accent-fg',
  destructive: 'danger',
  ring: 'focus-ring',
};

const HSL_RE = /^\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\s*(?:\/\s*([\d.]+))?\s*$/;

function parseHslTriplet(raw: string): string | null {
  const m = HSL_RE.exec(raw);
  if (!m) return null;
  const h = m[1]!;
  const s = m[2]!;
  const l = m[3]!;
  const a = m[4];
  return a ? `hsl(${h} ${s}% ${l}% / ${a})` : `hsl(${h} ${s}% ${l}%)`;
}

/**
 * Parse a shadcn-style globals.css string. Extracts CSS variables from `:root` and
 * `.dark` blocks. shadcn typically stores HSL as `H S% L%` triplets (no `hsl()` wrapper)
 * because shadcn-ui consumes them via `hsl(var(--background))`.
 */
export function parseShadcn(css: string): PartialTokens {
  const tokens: PartialTokens = { color: {} };

  const rootBlock = extractBlock(css, /:root\s*\{([\s\S]*?)\}/);
  if (!rootBlock) return tokens;

  const vars = parseVars(rootBlock);
  const color: NonNullable<PartialTokens['color']> = {};
  for (const [name, raw] of Object.entries(vars)) {
    const mapped = COLOR_MAP[name];
    if (!mapped) continue;
    const hsl = parseHslTriplet(raw) ?? raw;
    try {
      (color as Record<string, unknown>)[mapped] = toOKLCH(hsl);
    } catch {
      /* skip */
    }
  }
  tokens.color = color;

  if (vars.radius) {
    tokens.radius = { base: vars.radius } as { base: string };
  }

  return tokens;
}

function extractBlock(css: string, re: RegExp): string | null {
  const m = re.exec(css);
  return m?.[1] ?? null;
}

function parseVars(block: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /--([\w-]+)\s*:\s*([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(block)) !== null) {
    out[m[1]!] = m[2]!.trim();
  }
  return out;
}
