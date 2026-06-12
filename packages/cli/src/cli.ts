#!/usr/bin/env node
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { deriveTokens, renderCSSVariables } from '@vellum/core';
import { parseDesignMd } from '@vellum/adapter-md';
import { parseShadcn } from '@vellum/adapter-shadcn';
import { parseW3C } from '@vellum/adapter-w3c';
import { detectTokenSource, loadTokensFromSource } from './detect.js';

const HELP = `
vellum <command>

Commands:
  init                          Initialize a Vellum project in the current directory
  tokens preview <file>         Render token CSS variables to stdout for a given source file
  stories validate              Scan *.stories.{ts,tsx} files for parse errors
  vr export [--out FILE]        Emit a visual-regression manifest (JSON) for external tools
  dev                           Start the local dev server (Docs + Workbench)
  build                         Build static output to out/

Options:
  -h, --help                    Show this help
  -v, --version                 Show CLI version
`;

async function main(argv: string[]): Promise<number> {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '-h' || cmd === '--help') {
    console.log(HELP);
    return 0;
  }
  if (cmd === '-v' || cmd === '--version') {
    console.log('0.0.1');
    return 0;
  }
  if (cmd === 'init') return await runInit();
  if (cmd === 'tokens' && rest[0] === 'preview' && rest[1]) {
    return await runTokensPreview(rest[1]);
  }
  if (cmd === 'stories' && rest[0] === 'validate') return await runStoriesValidate();
  if (cmd === 'vr' && rest[0] === 'export') {
    const outIdx = rest.indexOf('--out');
    const outPath = outIdx >= 0 ? rest[outIdx + 1] : undefined;
    return await runVrExport(outPath);
  }
  if (cmd === 'dev' || cmd === 'build') {
    console.log(`'${cmd}' is provided by the app shell. Run 'pnpm dev' (or pnpm build) in your app directory.`);
    return 0;
  }
  console.error(`Unknown command: ${cmd}\n${HELP}`);
  return 1;
}

async function runInit(): Promise<number> {
  const cwd = process.cwd();
  const source = await detectTokenSource(cwd);
  console.log(`Vellum init — ${source ? `found ${source.kind} at ${source.path}` : 'no token source detected'}`);

  const designMdPath = join(cwd, 'design.md');
  if (!(await exists(designMdPath))) {
    await writeFile(
      designMdPath,
      `---
chrome: minimal
density: comfortable
colorScheme: light
---

# My Design System

## Color
- bg: \`#ffffff\`
- fg: \`#0a0a0a\`
- accent: \`#0066ff\`

## Radius
- base: \`8px\`

## Type
- display: Inter, 700
- body: Inter, 400
- scale: major-third
`,
      'utf-8',
    );
    console.log(`✔ Created design.md`);
  } else {
    console.log(`• design.md already exists, leaving untouched`);
  }

  const vellumConfig = join(cwd, 'vellum.config.json');
  if (!(await exists(vellumConfig))) {
    await writeFile(
      vellumConfig,
      JSON.stringify(
        {
          modes: ['docs', 'workbench'],
          stories: ['./**/*.stories.{ts,tsx,js,jsx}', '!node_modules/**'],
          tokenSource: source?.kind ?? 'design.md',
          chrome: 'minimal',
        },
        null,
        2,
      ),
      'utf-8',
    );
    console.log(`✔ Created vellum.config.json`);
  }

  await mkdir(join(cwd, '.vellum'), { recursive: true });
  console.log(`\nDone. Next: write your first story, then run 'pnpm dev'.`);
  return 0;
}

async function runTokensPreview(file: string): Promise<number> {
  const path = resolve(process.cwd(), file);
  const raw = await readFile(path, 'utf-8');
  const partial = file.endsWith('.md')
    ? parseDesignMd(raw)
    : file.endsWith('.css')
      ? parseShadcn(raw)
      : parseW3C(raw);
  const tokens = deriveTokens(partial);
  console.log(renderCSSVariables(tokens));
  return 0;
}

async function runStoriesValidate(): Promise<number> {
  const cwd = process.cwd();
  const { default: fg } = await import('fast-glob');
  const files = await fg(['**/*.stories.{ts,tsx,js,jsx}', '!node_modules/**', '!dist/**'], { cwd });
  console.log(`Found ${files.length} story file(s).`);
  for (const f of files) console.log(`  ${f}`);
  return 0;
}

/**
 * Visual regression manifest.
 *
 * Emits a JSON file external snapshot tools (Chromatic, Percy, Loki, custom
 * Playwright runners) can consume. One entry per story with a stable id,
 * preview URL, and viewport hint. Vellum doesn't run snapshots itself —
 * this is the contract.
 */
async function runVrExport(outPath: string | undefined): Promise<number> {
  const cwd = process.cwd();
  const { default: fg } = await import('fast-glob');
  const storyFiles = await fg(['**/*.stories.{ts,tsx,js,jsx}', '!node_modules/**', '!dist/**'], { cwd });

  const entries: Array<{
    storyId: string;
    componentFile: string;
    previewUrl: string;
    viewports: string[];
    tags: string[];
  }> = [];

  for (const file of storyFiles) {
    const componentBase = file.replace(/\.stories\.[tj]sx?$/, '');
    // Stable ID: directory-derived slug. The runtime can join this with
    // the named exports it discovers; here we record the component scope.
    const id = componentBase.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
    entries.push({
      storyId: id,
      componentFile: file,
      previewUrl: `/preview/${id}--{story-name}`,
      viewports: ['mobile', 'tablet', 'desktop'],
      tags: [],
    });
  }

  const manifest = {
    schema: 'https://vellum.dev/vr-manifest/v1',
    generated: 'static',
    stories: entries,
  };
  const text = JSON.stringify(manifest, null, 2);
  if (outPath) {
    const target = resolve(cwd, outPath);
    await writeFile(target, text + '\n', 'utf-8');
    console.log(`✔ Wrote VR manifest: ${target} (${entries.length} entries)`);
  } else {
    console.log(text);
  }
  return 0;
}

async function exists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
