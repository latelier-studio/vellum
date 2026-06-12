# Vellum — Technical Design

## 0. Design principles

1. **Chrome has no color of its own.** All chrome CSS is written against CSS custom properties. No hard-coded colors, radii, or spacing.
2. **One token shape, many consumers.** Whatever the input format (W3C / shadcn / `design.md`), internally normalize to a single schema (`NormalizedTokens`).
3. **Derive what's missing; respect what's given.** OKLCH-based color derivation, automatic type scale. Never overwrite an explicit user value.
4. **Acknowledge chrome's limits.** Color / radius / typography alone can't carry every aesthetic. Chrome skeletons exist for the rest.
5. **CSF compatible, addon SDK not.** CSF 3.0 is the de facto story format — compatibility = zero migration cost. Storybook's addon SDK is its own model; mimicking it would leave both sides half-baked.
6. **One data source, two sites.** stories + tokens, one set → Workbench mode and Docs mode both emitted free. That single split is Vellum's main differentiator.

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Project                            │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │ tokens.json    │  │ globals.css  │  │ design.md      │  │
│  │ (W3C)          │  │ (shadcn)     │  │ (Vellum DSL)   │  │
│  └────────┬───────┘  └──────┬───────┘  └────────┬───────┘  │
│                                                              │
│  ┌────────────────┐  ┌──────────────┐                       │
│  │ *.stories.tsx  │  │ Component.tsx│                       │
│  │ (CSF 3.0)      │  │ (user code)  │                       │
│  └────────┬───────┘  └──────┬───────┘                       │
└───────────┼─────────────────┼──────────────────┬────────────┘
            │                 │                   │
            ▼                 ▼                   ▼
   ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
   │ Token        │  │ CSF Reader       │  │ Prop Extractor   │
   │ Adapter Layer│  │ (.stories.tsx)   │  │ (react-docgen-ts)│
   └──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘
          │                   │                       │
          ▼                   ▼                       ▼
   ┌──────────────┐  ┌──────────────────────────────────────┐
   │ Normalized   │  │ Story Manifest                       │
   │ Tokens       │  │  - components[].stories[]            │
   │              │  │  - args / argTypes                   │
   │              │  │  - props schema (auto)               │
   └──────┬───────┘  └────────────────┬─────────────────────┘
          │                           │
          ▼                           ▼
    ┌─────────────────────────────────────────────────┐
    │   Derivation Engine + CSS Variable Injector     │
    │   → :root { --vellum-* }                        │
    └────────────────────────┬────────────────────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   ┌─────────────────────┐         ┌─────────────────────┐
   │   Docs Mode         │         │   Workbench Mode    │
   │   /docs/*           │         │   /workbench/*      │
   │                     │         │                     │
   │  • sidebar          │         │  • Story tree (L)   │
   │  • wide content     │         │  • Preview (center) │
   │  • MDX + <Story>    │         │  • Panels (R/B)     │
   │  • marketing tone   │         │    Controls / a11y  │
   │                     │         │    Actions / Code   │
   └─────────────────────┘         └─────────────────────┘
```

## 2. Token system

### 2.1 Input adapters

Three inputs, one internal representation.

**W3C Design Tokens (JSON)** — primary standard
```json
{
  "color": {
    "bg":     { "$value": "#ffffff", "$type": "color" },
    "fg":     { "$value": "#0a0a0a", "$type": "color" },
    "accent": { "$value": "#0066ff", "$type": "color" }
  },
  "radius": {
    "md": { "$value": "8px", "$type": "dimension" }
  }
}
```

**shadcn `globals.css`** — React ecosystem de facto
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --radius: 0.5rem;
}
```
Detects the HSL space-separated triplet form automatically. If `components.json` is present, it's used for additional hints.

**`design.md`** — Vellum-native DSL (human-friendly)
```markdown
---
chrome: minimal
density: comfortable
---

# My Design System

## Color
- bg: `#ffffff`
- fg: `#0a0a0a`
- accent: `#ff6b00`

## Radius
- base: `12px`

## Type
- display: Inter Display, 900
- body: Inter, 400
- scale: major-third

## Motion
- duration: 180ms
- easing: cubic-bezier(0.32, 0.72, 0, 1)
```

Plain markdown so users can read and edit it directly. Vellum parses frontmatter + h2 sections + `- key: value` lists.

### 2.2 NormalizedTokens schema

```typescript
type NormalizedTokens = {
  color: {
    bg:        OKLCH;
    fg:        OKLCH;
    border:    OKLCH;
    muted:     OKLCH;
    'muted-fg': OKLCH;
    accent:    OKLCH;
    'accent-fg': OKLCH;
    // optional states (used if present, derived if absent)
    'accent-hover'?:   OKLCH;
    'accent-active'?:  OKLCH;
    'accent-disabled'?: OKLCH;
    'focus-ring'?:     OKLCH;
  };
  radius: { sm: string; md: string; lg: string };
  type: {
    display: { family: string; weight: number };
    body:    { family: string; weight: number };
    mono:    { family: string };
    scale:   'minor-third' | 'major-third' | 'perfect-fourth' | number[];
  };
  space: { base: number; density: 'compact' | 'comfortable' | 'airy' };
  shadow: { sm: string; md: string; lg: string; style: 'flat' | 'soft' | 'hard' };
  motion: { duration: { fast: string; base: string; slow: string }; easing: string };
  meta: {
    chrome:      'minimal' | 'editorial' | 'dense';
    colorScheme: 'light' | 'dark' | 'auto';
  };
};
```

Colors normalize to **OKLCH** up front. hex / rgb / hsl inputs are converted through culori.

### 2.3 Derivation engine

- **Color derivation:** `accent` → `accent-hover` (L+0.04), `accent-active` (L−0.04), `accent-disabled` (mix 70% with muted), `focus-ring` (alpha 0.4)
- **Type scale derivation:** specify `scale: 'major-third'` and Vellum generates a 9-step scale (xs … 5xl) at ratio 1.250
- **Radius derivation:** give `radius.md` and Vellum sets `sm = md / 2`, `lg = md * 1.5`
- **Fallback chain:** even with zero tokens, "Vellum defaults" produce a working chrome

Explicit user values always win.

### 2.4 CSS variable injection

`NormalizedTokens` → `:root` CSS variables under the single `--vellum-*` prefix. Chrome components only reference variables. This is why token hot-swap works.

## 3. Story system

### 3.1 CSF 3.0 compatibility

Existing Storybook users must migrate in under an hour. That means reading `.stories.tsx` as-is.

```typescript
// Button.stories.tsx — works unmodified
import type { Meta, StoryObj } from '@vellum/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  args: { children: 'Click me' },
};
export default meta;

export const Default: StoryObj<typeof Button> = {};
export const Loading:  StoryObj<typeof Button> = { args: { loading: true } };
export const Disabled: StoryObj<typeof Button> = { args: { disabled: true } };
```

Vellum re-exports `@storybook/types`-compatible types from `@vellum/react`. One import line changes (or zero with an alias).

### 3.2 Story Manifest

The CSF reader scans every `*.stories.{ts,tsx,js,jsx}` and produces one manifest.

```typescript
type StoryManifest = {
  components: {
    id: string;            // 'inputs/button'
    name: string;          // 'Button'
    componentPath: string; // './Button.tsx'
    componentExport: string;
    propsSchema: PropsSchema;   // from Prop Extractor
    stories: {
      id: string;          // 'inputs/button--loading'
      name: string;        // 'Loading'
      args: Record<string, unknown>;
      argTypes?: ArgTypes;
      parameters?: Parameters;
    }[];
  }[];
};
```

One manifest drives **both** Docs and Workbench modes. Same data, two renderings.

### 3.3 Prop Extractor

`react-docgen-typescript` extracts component props → `PropsSchema`.

```typescript
type PropsSchema = {
  props: {
    name: string;
    type: PropType;        // string | number | boolean | union | enum | …
    required: boolean;
    defaultValue?: unknown;
    description?: string;  // JSDoc
    tags?: Record<string, string>; // @deprecated, @example, …
  }[];
};
```

Used in two places:
- **Controls panel:** type drives UI automatically (boolean → toggle, enum → select, string → text input)
- **Auto prop table** (Docs mode): rendered under each component page

Explicit `argTypes` wins; `PropsSchema` is the fallback.

### 3.4 MDX integration

Storybook-style MDX:

```mdx
import * as ButtonStories from './Button.stories';
import { Story, Source, ArgsTable } from '@vellum/react/mdx';

# Button

<Story of={ButtonStories.Default} />

## Loading state
While the component is loading.

<Story of={ButtonStories.Loading} />

<ArgsTable of={ButtonStories.default} />
```

`<Story of={…}>` references one story usable in Workbench and Docs. Single source of truth.

## 4. Mode system

### 4.1 Why two modes

Storybook tried to do docs + workbench in one layout and both ended up mediocre. Vellum splits them **explicitly**:

| | Docs mode | Workbench mode |
|---|---|---|
| URL | `/docs/*` | `/workbench/*` |
| Primary user | design system consumer | design system developer |
| Primary value | aesthetics / narrative / copy | isolation / experimentation / debugging |
| Layout | sidebar + wide content | tree + preview + panels |
| Unit of content | page (MDX) | story |
| Controls | inline (optional) | right panel (dedicated) |

### 4.2 Shared resources

The two modes share the **same tokens + same manifest**.

- Add a story → both modes update automatically
- Change a token → both chromes re-skin together
- Preview iframes share the same token `:root`

### 4.3 Toggle

Header carries a mode toggle (`Docs ↔ Workbench`). It maps the current component to its counterpart URL:
- `/docs/button` ↔ `/workbench/button--default`
- Deep links work both directions, search is mode-aware

### 4.4 Build output

`vellum build` produces both modes as static sites. Users can disable one via config (`{ modes: ['docs'] }`).

## 5. Chrome skeletons

### 5.1 V1: `minimal` family

Same tone (Geist / Radix) in **two layouts**:

**`minimal-docs`**
- Narrow left nav (220 px), light top header
- Wide content area with generous spacing
- Code blocks / preview cards with thin borders and soft shadows

**`minimal-workbench`**
- Left story tree (260 px) — folders, search
- Center preview area — viewport toggle, background toggle, dark mode
- Right panel (320 px, collapsible) — Controls / a11y / Actions / Code tabs
- Bottom command bar (`Cmd+K` search, actions)

### 5.2 V2 additions: `editorial`, `dense`

- `editorial`: magazine-style top nav, manifesto tone. Fits Docs mode best (Workbench falls back to default layout)
- `dense`: Stripe / Linear tone, high information density

Each skeleton **takes the same tokens**. Flip `meta.chrome` and the whole layout swaps.

## 6. Live preview (isolation)

### 6.1 iframe isolation

The preview area renders **inside an iframe** so user component styles can't leak into chrome.

- The iframe also receives the tokens. Chrome and preview iframe share the same `:root` → visual consistency
- iframe `src` is a separate React entry on the same origin (`/preview/[story-id]`)
- postMessage handles parent ↔ child traffic: args changes, viewport changes, event logs, a11y results

### 6.2 V2 considerations

- Shadow DOM isolation (lighter, but compatibility falls off with some libraries)
- React Server Component preview

## 7. Workbench panels

The Workbench right panel starts with four tabs. All are chrome components, referencing tokens only.

### 7.1 Controls panel

- `PropsSchema`-driven auto UI
- `boolean` → toggle, `enum`/`union of literals` → select, `string` → text, `number` → number+slider, `object`/`function` → JSON editor (read-only with explanation)
- args change → postMessage → React in iframe re-renders
- "Copy args" button → copy current args as a CSF snippet

### 7.2 a11y panel

- axe-core runs inside the iframe
- Results posted to parent
- Click a violation → highlight the DOM node
- WCAG level toggle (A / AA / AAA)

### 7.3 Actions panel

- Function-typed args (`onClick`, `onChange`, etc.) wrapped with spies automatically
- Calls are serialized and logged
- Clear button, JSON export

### 7.4 Code panel

- Current story's args reflected as live CSF
- Component usage example (`<Button loading />`) — copy-paste-ready
- TSX / JSX toggle

### 7.5 Future panels (V2)

- Viewport options (preset additions)
- Theme options (background, color scheme)
- Doc tab (preview the MDX page inside the panel)

V1 does not expose an addon SDK. V2 decides direction.

## 8. Tech stack

| Area | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router) | RSC + MDX integration is most mature here |
| Docs base | Fumadocs | Good defaults, easy to fork and extend |
| MDX | `@next/mdx` + Fumadocs MDX | RSC compatible |
| Color | culori | OKLCH support, light, accurate |
| Token parser | in-house (W3C / shadcn / md) | Keeps dependencies small |
| Prop extraction | `react-docgen-typescript` | De facto TS → JSON schema |
| Story scan | `fast-glob` + Vite transforms | Dynamic CSF module imports |
| a11y | `axe-core` | Industry standard, injectable in iframe |
| CLI | unbuilt + commander | `vellum init/dev/build` |
| Package manager | pnpm | Monorepo-friendly |
| Build | turborepo | OSS monorepo standard |
| Testing | vitest + Playwright | Unit + visual regression |

## 9. Package layout (monorepo)

```
vellum/
├── packages/
│   ├── core/                # NormalizedTokens, derivation engine, types
│   ├── story/               # CSF reader, Story Manifest, Prop Extractor
│   ├── adapter-w3c/         # W3C tokens.json adapter
│   ├── adapter-shadcn/      # shadcn globals.css adapter
│   ├── adapter-md/          # design.md parser
│   ├── chrome-minimal-docs/      # minimal Docs mode skeleton
│   ├── chrome-minimal-workbench/ # minimal Workbench mode skeleton
│   ├── react/               # <Story>, <Source>, <ArgsTable>, types
│   ├── preview/             # iframe runtime (postMessage protocol)
│   ├── panel-controls/      # Workbench Controls panel
│   ├── panel-a11y/          # Workbench a11y panel
│   ├── panel-actions/       # Workbench Actions panel
│   ├── panel-code/          # Workbench Code panel
│   └── cli/                 # vellum init/dev/build
├── apps/
│   ├── docs/                # Vellum's own docs (dogfooding)
│   └── playground/          # Token live editor (development)
├── examples/
│   ├── minimal/
│   ├── shadcn-import/
│   ├── design-md/
│   └── storybook-migration/  # existing .stories.tsx working as-is
└── docs/                     # design docs (this file)
```

**Dogfooding rule:** Vellum's own docs are built with Vellum. Best demo, strongest test.

## 10. `design.md` DSL — parser spec

### 10.1 Shape

```markdown
---
chrome: minimal
density: comfortable
colorScheme: light
---

# <System Name>

## Color
- bg: `#ffffff`
- fg: `#0a0a0a`
- accent: `#ff6b00`

## Radius
- base: `12px`

## Type
- display: Inter Display, 900
- body: Inter, 400
- scale: major-third

## Motion
- duration: 180ms
- easing: cubic-bezier(0.32, 0.72, 0, 1)
```

### 10.2 Parsing rules

- frontmatter → `meta`
- h1 → site title
- h2 → token category (`Color` → `color`)
- `- key: value` lists under each h2 → token entries
- Backticked values (`` `value` ``) are raw; bare values are trimmed and processed
- Comma-separated values → arrays / structs

Lenient parsing. Unrecognized entries are ignored with a warning (`vellum dev` output).

### 10.3 Why markdown

- Users can read and edit it directly. Designers can open PRs.
- Sits naturally next to the README, renders on GitHub.
- Marketing hook: "Drop your `design.md`."

Internally it normalizes to W3C JSON — accuracy preserved.

## 11. CLI

```bash
vellum init                  # interactive: token source, chrome, modes
vellum dev                   # local server — Docs + Workbench together, hot reload
vellum build                 # static build → out/docs, out/workbench
vellum tokens diff           # current tokens vs. last build
vellum tokens preview <file> # render chrome from just tokens
vellum stories validate      # CSF file checker
```

`init` should land the first page within five minutes. At most three interactive prompts.

## 12. Future (V2+)

- **Visual regression output format** — emit a standard JSON manifest external tools can consume
- **Test runner / play function** — interaction tests, Storybook play-function compatible
- **Composition** — federate multiple Vellum sites
- **Addon SDK** — third-party panels in Workbench
- **Tokens Studio sync** — Figma token webhook
- **AI token extraction** — infer tokens from Tailwind / CSS
- **Vue / Svelte adapters** (with their own chrome skeletons)

V1 keeps extension surface deliberately narrow. Wrong API design is the easiest place to take on debt.

## 13. Decision log

| # | Decision | Rationale |
|---|---|---|
| D1 | Fumadocs base, not pure custom | Saves ~6 months; forkable, low lock-in |
| D2 | React only (V1) | Vue / Svelte need their own chrome. Validate the market first |
| D3 | iframe isolation (preview) | Compatibility-first. Shadow DOM is a V2 evaluation |
| D4 | OKLCH internal representation | Consistent derivation. culori for I/O |
| D5 | `design.md` for humans, W3C JSON internally | Friendly AND accurate |
| D6 | Storybook addon SDK no, **CSF 3.0 yes** | Story format is the standard — compatibility = zero migration. Addons are a separate model |
| D7 | Dogfooding — Vellum's docs in Vellum | Strongest test and marketing asset |
| D8 | **Mode split (Docs / Workbench)** | Storybook tried one layout for both and lost both. Explicit split = both optimal |
| D9 | **Workbench panels are V1-critical** | Without Controls / a11y / Actions / Code, can't replace Storybook |
| D10 | Auto UI + auto prop table from TypeScript (`react-docgen-typescript`) | Mandatory `argTypes` is a DX killer. Auto by default, manual overrides |
| D11 | Visual regression V2, but V1 promises a compatible output format | External tools can consume V1 output |

## 14. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Fumadocs API changes | Build breaks | Use base only, keep chrome in-house. Narrow dependency surface |
| User component CSS leaking | Preview broken | Enforce iframe isolation |
| CSF subtle compatibility (Storybook 7 → 8 → 9) | Migration failures | Build to CSF 3.0 / Storybook 9 baseline. Fixture tests guard compatibility |
| `react-docgen-typescript` limits (generics, mapped types) | Missing prop entries | Document known limits; recommend `argTypes` overrides |
| Four panels × two modes → V1 scope balloons | Late launch | Independent packages per panel and per chrome. Parallel work |
| "Storybook clone" criticism | Weak positioning | Lead with the two differentiators: token-driven chrome + mode split |
| One chrome family isn't enough | Late-stage feedback after launch | `editorial` / `dense` are top V2 priorities |
