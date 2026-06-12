import { useEffect } from 'react';
import { useTokens } from '@vellum/react';

/**
 * Pulls the design.md typography stack from Google Fonts at runtime.
 * - Reads display/body/mono families + weights from the active tokens.
 * - Strips system fonts (no fetch needed).
 * - Merges weights per family into a single CSS2 request.
 * - Removes the previous <link> when tokens change so each scenario only loads what it needs.
 */
const SYSTEM_FONTS = new Set([
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'ui-sans-serif',
  'ui-serif',
  'ui-monospace',
  'ui-rounded',
  'monospace',
  'serif',
  'sans-serif',
  'cursive',
  'fantasy',
  'SFMono-Regular',
  'Menlo',
  'Monaco',
  'Consolas',
  'Courier New',
  'Courier',
  'Helvetica',
  'Helvetica Neue',
  'Arial',
  'Georgia',
  'Times',
  'Times New Roman',
]);

export function FontLoader() {
  const tokens = useTokens();

  useEffect(() => {
    const weightsByFamily = new Map<string, Set<number>>();

    const note = (family: string, weight?: number) => {
      const first = family.split(',')[0]?.trim().replace(/^["']|["']$/g, '');
      if (!first || SYSTEM_FONTS.has(first)) return;
      const set = weightsByFamily.get(first) ?? new Set<number>();
      set.add(weight ?? 400);
      weightsByFamily.set(first, set);
    };

    note(tokens.type.display.family, tokens.type.display.weight);
    note(tokens.type.body.family, tokens.type.body.weight);
    note(tokens.type.mono.family, 400);

    if (weightsByFamily.size === 0) return;

    const params: string[] = [];
    for (const [name, weights] of weightsByFamily) {
      const familyParam = name.replace(/\s+/g, '+');
      const sortedWeights = Array.from(weights).sort((a, b) => a - b);
      params.push(`family=${familyParam}:wght@${sortedWeights.join(';')}`);
    }
    const url = `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset['vellumFonts'] = 'true';
    document.head.appendChild(link);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, [tokens]);

  return null;
}
