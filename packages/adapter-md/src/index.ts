import { toOKLCH } from '@vellum/core';
import type { ChromeId, ColorScheme, Density, PartialTokens, TypeScale } from '@vellum/core';

/**
 * design.md DSL parser.
 *
 * Structure:
 *   ---
 *   chrome: minimal
 *   density: comfortable
 *   ---
 *
 *   # System Name
 *
 *   ## Color
 *   - bg: `#fff`
 *   - fg: `#0a0a0a`
 *   - accent: `#ff6b00`
 *
 *   ## Radius
 *   - base: `12px`
 *
 *   ## Type
 *   - display: Inter Display, 900
 *   - body: Inter, 400
 *   - scale: major-third
 *
 *   ## Motion
 *   - duration: 180ms
 *   - easing: cubic-bezier(0.32, 0.72, 0, 1)
 */
export function parseDesignMd(source: string): PartialTokens {
  const { frontmatter, body } = splitFrontmatter(source);
  const tokens: PartialTokens = { meta: {} };

  // Frontmatter → meta
  if (frontmatter.chrome) tokens.meta!.chrome = frontmatter.chrome as ChromeId;
  if (frontmatter.colorScheme) tokens.meta!.colorScheme = frontmatter.colorScheme as ColorScheme;
  if (frontmatter.density) tokens.space = { density: frontmatter.density as Density };

  // System name from h1
  const h1 = /^#\s+(.+)$/m.exec(body);
  if (h1) tokens.meta!.name = h1[1]!.trim();

  // Sections
  const sections = parseSections(body);
  for (const [name, items] of Object.entries(sections)) {
    const lname = name.toLowerCase();
    if (lname === 'color' || lname === 'colors') {
      const color: NonNullable<PartialTokens['color']> = {};
      for (const [k, v] of Object.entries(items)) {
        try {
          (color as Record<string, unknown>)[k] = toOKLCH(v);
        } catch {
          /* skip */
        }
      }
      tokens.color = color;
    } else if (lname === 'radius') {
      tokens.radius = { ...items } as PartialTokens['radius'];
    } else if (lname === 'type' || lname === 'typography') {
      const t: NonNullable<PartialTokens['type']> = {};
      if (items.display) t.display = parseFontTuple(items.display);
      if (items.body) t.body = parseFontTuple(items.body);
      if (items.mono) t.mono = { family: items.mono };
      if (items.scale) t.scale = parseTypeScale(items.scale);
      tokens.type = t;
    } else if (lname === 'space' || lname === 'spacing') {
      const sp: NonNullable<PartialTokens['space']> = {};
      if (items.base) sp.base = parseInt(items.base, 10) === 8 ? 8 : 4;
      if (items.density) sp.density = items.density as Density;
      tokens.space = sp;
    } else if (lname === 'shadow' || lname === 'shadows') {
      tokens.shadow = items as unknown as PartialTokens['shadow'];
    } else if (lname === 'motion') {
      const motion: NonNullable<PartialTokens['motion']> = {};
      if (items.duration) motion.duration = { base: items.duration };
      if (items.easing) motion.easing = items.easing;
      tokens.motion = motion;
    }
  }

  return tokens;
}

function splitFrontmatter(source: string): { frontmatter: Record<string, string>; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(source);
  if (!m) return { frontmatter: {}, body: source };
  const fm: Record<string, string> = {};
  for (const line of m[1]!.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k) fm[k] = v;
  }
  return { frontmatter: fm, body: source.slice(m[0].length) };
}

function parseSections(body: string): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  const lines = body.split('\n');
  let currentSection: string | null = null;
  for (const line of lines) {
    const h2 = /^##\s+(.+)$/.exec(line);
    if (h2) {
      currentSection = h2[1]!.trim();
      out[currentSection] = {};
      continue;
    }
    if (!currentSection) continue;
    const item = /^\s*[-*]\s+([\w-]+)\s*:\s*(.+?)\s*$/.exec(line);
    if (item) {
      const key = item[1]!;
      let value = item[2]!.trim();
      // Strip backticks
      const tickMatch = /^`([^`]+)`$/.exec(value);
      if (tickMatch) value = tickMatch[1]!;
      out[currentSection]![key] = value;
    }
  }
  return out;
}

function parseFontTuple(raw: string): { family: string; weight?: number } {
  const parts = raw.split(',').map((s) => s.trim());
  const lastNum = parts.length > 1 ? parseInt(parts[parts.length - 1]!, 10) : NaN;
  if (!Number.isNaN(lastNum) && lastNum >= 100 && lastNum <= 900) {
    return { family: parts.slice(0, -1).join(', '), weight: lastNum };
  }
  return { family: parts.join(', ') };
}

function parseTypeScale(raw: string): TypeScale {
  const n = parseFloat(raw);
  if (!Number.isNaN(n) && n > 1 && n < 2) return n;
  return raw as TypeScale;
}
