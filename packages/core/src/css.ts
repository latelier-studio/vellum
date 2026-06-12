import { formatOKLCH } from './color.js';
import { computeTypeScale } from './derive.js';
import type { NormalizedTokens } from './types.js';

/**
 * Render NormalizedTokens as a CSS string that defines all
 * `--vellum-*` custom properties on `:root`.
 */
export function renderCSSVariables(tokens: NormalizedTokens, selector = ':root'): string {
  const lines: string[] = [];

  // Color
  for (const [k, v] of Object.entries(tokens.color)) {
    if (!v) continue;
    lines.push(`  --vellum-color-${k}: ${formatOKLCH(v)};`);
  }

  // Radius
  lines.push(`  --vellum-radius-sm: ${tokens.radius.sm};`);
  lines.push(`  --vellum-radius-md: ${tokens.radius.md};`);
  lines.push(`  --vellum-radius-lg: ${tokens.radius.lg};`);

  // Typography
  lines.push(`  --vellum-font-display: ${quoteFontFamily(tokens.type.display.family)};`);
  lines.push(`  --vellum-font-display-weight: ${tokens.type.display.weight};`);
  lines.push(`  --vellum-font-body: ${quoteFontFamily(tokens.type.body.family)};`);
  lines.push(`  --vellum-font-body-weight: ${tokens.type.body.weight};`);
  lines.push(`  --vellum-font-mono: ${quoteFontFamily(tokens.type.mono.family)};`);
  for (const [step, value] of Object.entries(computeTypeScale(tokens.type.scale))) {
    lines.push(`  --vellum-text-${step}: ${value};`);
  }

  // Space — base unit + density multiplier
  const densityMul = tokens.space.density === 'compact' ? 0.85 : tokens.space.density === 'airy' ? 1.2 : 1;
  lines.push(`  --vellum-space-base: ${tokens.space.base}px;`);
  lines.push(`  --vellum-space-density: ${densityMul};`);
  for (let i = 1; i <= 12; i++) {
    const val = tokens.space.base * i * densityMul;
    lines.push(`  --vellum-space-${i}: ${val}px;`);
  }

  // Shadow
  lines.push(`  --vellum-shadow-sm: ${tokens.shadow.sm};`);
  lines.push(`  --vellum-shadow-md: ${tokens.shadow.md};`);
  lines.push(`  --vellum-shadow-lg: ${tokens.shadow.lg};`);

  // Motion
  lines.push(`  --vellum-duration-fast: ${tokens.motion.duration.fast};`);
  lines.push(`  --vellum-duration-base: ${tokens.motion.duration.base};`);
  lines.push(`  --vellum-duration-slow: ${tokens.motion.duration.slow};`);
  lines.push(`  --vellum-easing: ${tokens.motion.easing};`);

  // Meta
  lines.push(`  color-scheme: ${tokens.meta.colorScheme === 'auto' ? 'light dark' : tokens.meta.colorScheme};`);

  return `${selector} {\n${lines.join('\n')}\n}\n`;
}

const CSS_GENERIC_FAMILY = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-serif|ui-sans-serif|ui-monospace|ui-rounded|-apple-system|BlinkMacSystemFont|emoji|math|fangsong|inherit|initial|unset|revert|revert-layer)$/i;
const BARE_IDENT = /^[a-zA-Z_-][a-zA-Z0-9_-]*$/;

/**
 * Wrap each comma-separated family in quotes when it has whitespace-separated
 * tokens that aren't all valid CSS identifiers (e.g. `Source Serif 4` — the
 * trailing digit is an invalid `<custom-ident>` so the bare form is dropped
 * silently by the browser).
 */
function quoteFontFamily(value: string): string {
  return value
    .split(',')
    .map((part) => {
      const name = part.trim();
      if (!name) return name;
      if (/^["'].*["']$/.test(name)) return name;
      if (CSS_GENERIC_FAMILY.test(name)) return name;
      const tokens = name.split(/\s+/);
      const allBare = tokens.every((t) => BARE_IDENT.test(t));
      return allBare ? name : `"${name}"`;
    })
    .join(', ');
}
