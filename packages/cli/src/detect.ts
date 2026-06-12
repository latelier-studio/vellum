import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { deriveTokens, type NormalizedTokens } from '@vellum/core';
import { parseW3C } from '@vellum/adapter-w3c';
import { parseShadcn } from '@vellum/adapter-shadcn';
import { parseDesignMd } from '@vellum/adapter-md';

export type DetectedSource =
  | { kind: 'design.md'; path: string }
  | { kind: 'w3c'; path: string }
  | { kind: 'shadcn'; path: string };

const CANDIDATES: Array<{ kind: DetectedSource['kind']; rel: string[] }> = [
  { kind: 'design.md', rel: ['design.md', 'docs/design.md'] },
  { kind: 'w3c', rel: ['tokens.json', 'tokens/tokens.json', 'design-tokens.json'] },
  { kind: 'shadcn', rel: ['app/globals.css', 'src/app/globals.css', 'styles/globals.css', 'src/styles/globals.css'] },
];

export async function detectTokenSource(cwd: string): Promise<DetectedSource | null> {
  for (const cand of CANDIDATES) {
    for (const rel of cand.rel) {
      const path = join(cwd, rel);
      if (await exists(path)) {
        return { kind: cand.kind, path } as DetectedSource;
      }
    }
  }
  return null;
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

export async function loadTokensFromSource(source: DetectedSource): Promise<NormalizedTokens> {
  const raw = await readFile(source.path, 'utf-8');
  const partial =
    source.kind === 'design.md'
      ? parseDesignMd(raw)
      : source.kind === 'w3c'
        ? parseW3C(raw)
        : parseShadcn(raw);
  return deriveTokens(partial);
}
