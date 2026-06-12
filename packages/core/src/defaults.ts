import type { NormalizedTokens } from './types.js';

/**
 * Neutral default tokens — used when the user provides nothing.
 * Light theme baseline.
 */
export const DEFAULT_TOKENS_LIGHT: NormalizedTokens = {
  color: {
    bg: { l: 1, c: 0, h: 0 },
    fg: { l: 0.15, c: 0, h: 0 },
    border: { l: 0.9, c: 0, h: 0 },
    muted: { l: 0.96, c: 0, h: 0 },
    'muted-fg': { l: 0.45, c: 0, h: 0 },
    accent: { l: 0.55, c: 0.18, h: 250 },
    'accent-fg': { l: 0.98, c: 0, h: 0 },
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  type: {
    display: { family: 'system-ui, -apple-system, sans-serif', weight: 700 },
    body: { family: 'system-ui, -apple-system, sans-serif', weight: 400 },
    mono: { family: 'ui-monospace, SFMono-Regular, monospace' },
    scale: 'major-third',
  },
  space: {
    base: 4,
    density: 'comfortable',
  },
  shadow: {
    sm: '0 1px 2px rgb(0 0 0 / 0.04)',
    md: '0 4px 12px rgb(0 0 0 / 0.06)',
    lg: '0 12px 32px rgb(0 0 0 / 0.08)',
    style: 'soft',
  },
  motion: {
    duration: { fast: '120ms', base: '180ms', slow: '320ms' },
    easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
  },
  meta: {
    chrome: 'minimal',
    colorScheme: 'light',
  },
};
