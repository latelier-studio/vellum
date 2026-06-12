import { describe, expect, it } from 'vitest';
import { deriveTokens } from './derive.js';
import { renderCSSVariables } from './css.js';
import { toOKLCH } from './color.js';

describe('deriveTokens', () => {
  it('returns defaults for empty input', () => {
    const t = deriveTokens({});
    expect(t.color.bg.l).toBeCloseTo(1);
    expect(t.color.accent).toBeDefined();
    expect(t.meta.chrome).toBe('minimal');
  });

  it('auto-derives accent-hover/active/disabled from accent', () => {
    const t = deriveTokens({ color: { accent: toOKLCH('#0066ff') } });
    expect(t.color['accent-hover']).toBeDefined();
    expect(t.color['accent-active']).toBeDefined();
    expect(t.color['accent-disabled']).toBeDefined();
    expect(t.color['focus-ring']?.alpha).toBeCloseTo(0.4);
  });

  it('respects user-provided accent-hover override', () => {
    const customHover = toOKLCH('#00ffff');
    const t = deriveTokens({
      color: { accent: toOKLCH('#0066ff'), 'accent-hover': customHover },
    });
    expect(t.color['accent-hover']?.h).toBeCloseTo(customHover.h);
  });

  it('derives sm/lg radius from base', () => {
    const t = deriveTokens({ radius: { base: '12px' } as { base: string } });
    expect(t.radius.sm).toBe('6px');
    expect(t.radius.md).toBe('12px');
    expect(t.radius.lg).toBe('18px');
  });
});

describe('renderCSSVariables', () => {
  it('emits --vellum-color-* for every color token', () => {
    const t = deriveTokens({});
    const css = renderCSSVariables(t);
    expect(css).toContain('--vellum-color-bg:');
    expect(css).toContain('--vellum-color-accent:');
    expect(css).toContain('--vellum-color-accent-hover:');
    expect(css).toContain(':root {');
  });

  it('respects custom selector', () => {
    const t = deriveTokens({});
    const css = renderCSSVariables(t, '.vellum-theme');
    expect(css).toContain('.vellum-theme {');
  });

  it('emits a type scale of 9 steps', () => {
    const t = deriveTokens({});
    const css = renderCSSVariables(t);
    ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'].forEach((s) => {
      expect(css).toContain(`--vellum-text-${s}:`);
    });
  });
});
