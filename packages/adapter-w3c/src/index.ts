import { toOKLCH } from '@vellum/core';
import type { PartialTokens, TypeScale } from '@vellum/core';

type W3CValue = {
  $value: string | number | Record<string, unknown>;
  $type?: string;
  $description?: string;
};

type W3CGroup = {
  [key: string]: W3CValue | W3CGroup;
};

function isValue(node: unknown): node is W3CValue {
  return !!node && typeof node === 'object' && '$value' in (node as Record<string, unknown>);
}

function getString(node: W3CValue): string | undefined {
  const v = node.$value;
  return typeof v === 'string' ? v : undefined;
}

/**
 * Parse a W3C Design Tokens JSON document into PartialTokens.
 * Unknown keys are silently ignored — the derivation engine fills gaps.
 */
export function parseW3C(json: string | W3CGroup): PartialTokens {
  const doc = typeof json === 'string' ? (JSON.parse(json) as W3CGroup) : json;
  const tokens: PartialTokens = {};

  // Color
  const colorRoot = doc.color;
  if (colorRoot && !isValue(colorRoot)) {
    const color: NonNullable<PartialTokens['color']> = {};
    for (const [k, v] of Object.entries(colorRoot)) {
      if (isValue(v)) {
        const s = getString(v);
        if (s) {
          try {
            (color as Record<string, unknown>)[k] = toOKLCH(s);
          } catch {
            /* ignore unparseable */
          }
        }
      }
    }
    tokens.color = color;
  }

  // Radius
  const radiusRoot = doc.radius;
  if (radiusRoot && !isValue(radiusRoot)) {
    const radius: NonNullable<PartialTokens['radius']> = {} as NonNullable<PartialTokens['radius']>;
    for (const [k, v] of Object.entries(radiusRoot)) {
      if (isValue(v)) {
        const s = getString(v);
        if (s && (k === 'sm' || k === 'md' || k === 'lg' || k === 'base')) {
          (radius as Record<string, string>)[k] = s;
        }
      }
    }
    tokens.radius = radius;
  }

  // Typography
  const typeRoot = (doc.type ?? doc.typography) as W3CGroup | undefined;
  if (typeRoot && !isValue(typeRoot)) {
    const t: NonNullable<PartialTokens['type']> = {};
    const display = typeRoot.display;
    if (isValue(display)) {
      const s = getString(display);
      if (s) t.display = { family: s };
    }
    const body = typeRoot.body;
    if (isValue(body)) {
      const s = getString(body);
      if (s) t.body = { family: s };
    }
    const mono = typeRoot.mono;
    if (isValue(mono)) {
      const s = getString(mono);
      if (s) t.mono = { family: s };
    }
    const scale = typeRoot.scale;
    if (isValue(scale)) {
      const s = getString(scale);
      if (s) t.scale = s as TypeScale;
    }
    tokens.type = t;
  }

  // Motion
  const motionRoot = doc.motion;
  if (motionRoot && !isValue(motionRoot)) {
    const motion: NonNullable<PartialTokens['motion']> = {};
    const dur = motionRoot.duration;
    if (isValue(dur)) {
      const s = getString(dur);
      if (s) motion.duration = { base: s };
    }
    const easing = motionRoot.easing;
    if (isValue(easing)) {
      const s = getString(easing);
      if (s) motion.easing = s;
    }
    tokens.motion = motion;
  }

  return tokens;
}
