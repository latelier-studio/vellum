# Vellum

> Design system documentation that wears your tokens. A Storybook alternative whose chrome adapts to your design language.

Drop a `design.md` (or shadcn `globals.css`, or W3C `tokens.json`). The sidebar, panels, code blocks all rebuild themselves in your design language — no more chrome-vs-content mismatch.

Point Vellum at your `.stories.tsx` files. Get **both** a workbench (Storybook-style — live preview, controls, a11y, actions) **and** a docs site (Geist/Radix-style — narrative, prop tables) from the same source.

## Why

Storybook's chrome has a strong aesthetic of its own. When you drop a minimalist design system component into it, the chrome wins — the visitor sees Storybook, not your system. Every well-designed design system (shadcn, Radix, Geist, Linear) builds their own docs site for exactly this reason.

Vellum's thesis: **the tool shouldn't have a design. It should wear yours.**

- All chrome CSS is `--vellum-*` custom properties, no hardcoded colors
- Tokens (W3C / shadcn / `design.md` DSL) drive the chrome
- OKLCH-based color derivation auto-generates hover/active/disabled/focus states
- Two modes (`/docs` and `/workbench`) ship from the same data, no double maintenance

## Status

V1 prototype — see `docs/goal.md`, `docs/design.md`, `docs/tasks.md`.

This is **not** published to npm. It's a working monorepo demonstrating the architecture end-to-end:

- **`@vellum/core`** — `NormalizedTokens`, OKLCH derivation, CSS-variable injection
- **`@vellum/adapter-w3c`**, **`@vellum/adapter-shadcn`**, **`@vellum/adapter-md`** — input adapters
- **`@vellum/story`** — CSF 3.0 reader, `StoryManifest`, prop-schema types
- **`@vellum/react`** — `VellumProvider`, `Story`, `Source`, `ArgsTable`, type-safe `Meta`/`StoryObj`
- **`@vellum/preview`** — postMessage protocol + action instrumentation
- **`@vellum/chrome-minimal-docs`**, **`@vellum/chrome-minimal-workbench`** — V1 chrome skeletons
- **`@vellum/cli`** — `vellum init` / `tokens preview` / `stories validate`
- **`apps/docs`** — Vellum's own docs site, built with Vellum (dogfooding)

## Quickstart (in this monorepo)

```bash
pnpm install
pnpm dev          # apps/docs at http://localhost:5173
pnpm build        # build all packages
pnpm test         # core derivation tests
```

Then visit:

- `http://localhost:5173/docs` — Docs mode
- `http://localhost:5173/docs/inputs-button` — Button component page
- `http://localhost:5173/workbench/inputs-button--default` — Button in Workbench

## The `design.md` DSL

Vellum's marketing hook. Human-readable, designer-editable, machine-parseable:

```markdown
---
chrome: minimal
density: comfortable
colorScheme: light
---

# My Design System

## Color
- bg: `#ffffff`
- fg: `#0f0f10`
- accent: `#5b4cff`
- accent-fg: `#ffffff`

## Radius
- base: `10px`

## Type
- display: Inter, 700
- body: Inter, 400
- scale: major-third

## Motion
- duration: 180ms
- easing: cubic-bezier(0.32, 0.72, 0, 1)
```

Internally normalized to W3C Design Tokens JSON. Both formats are first-class — pick whichever fits your team.

## CSF 3.0 compatibility

Existing `.stories.tsx` files work unchanged — only the import source changes:

```tsx
import type { Meta, StoryObj } from '@vellum/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Inputs/Button',
  component: Button,
  args: { children: 'Click me', variant: 'primary' },
};
export default meta;

export const Default: StoryObj<typeof meta> = {};
export const Ghost:   StoryObj<typeof meta> = { args: { variant: 'ghost' } };
export const Loading: StoryObj<typeof meta> = { args: { loading: true } };
```

## What's in V1 (per `docs/goal.md`)

**Storybook-equivalent value:**
- Isolated component preview (iframe-sandboxed)
- Multi-story per component (CSF 3.0)
- Controls panel with auto-generated UI per prop type
- TypeScript-inferred prop tables
- Viewport switching
- Accessibility scan (axe-core)
- Event/action logging

**Docs-site value:**
- W3C / shadcn / `design.md` token input
- OKLCH-derived color states
- Minimal chrome skeleton (Geist/Radix tone)
- MDX-ready `<Story>` / `<Source>` / `<ArgsTable>`
- Single CLI: `vellum init / tokens preview / stories validate`

## V2 candidates

- Additional chrome skeletons (`editorial`, `dense`)
- Visual regression output format (Chromatic-compatible)
- Test runner / `play` function
- Composition (multi-Vellum federation)
- Addon SDK
- Vue / Svelte adapters
- Figma Tokens Studio sync

## License

MIT (placeholder — not yet published)
