# Vellum — Execution Roadmap

## Operating principles

- **Dogfood first.** Every phase rebuilds Vellum's own docs with Vellum. If it breaks, you see it immediately.
- **End-to-end before polish.** Tokens → CSS variables → chrome, stories → manifest → preview: get the thinnest path working before fattening anything.
- **Each phase ends with a demoable artifact.** A 30-second clip you could tweet.
- **Panels and modes are isolated for parallel work.** Independent packages (`packages/panel-*`, `chrome-minimal-{docs,workbench}`) keep later phases parallelizable.

## Timeline at a glance

V1 in ~14 weeks. A 9-week docs-only V1 extended to include Storybook-grade value (CSF + panels + auto prop table). Still fast for OSS at this surface area.

## Phase 0 — Foundation (Week 1)

Goal: monorepo wired, empty docs site comes up on `pnpm dev`.

- [ ] `pnpm` + `turborepo` monorepo (`packages/`, `apps/`, `examples/`)
- [ ] `packages/core` skeleton + TypeScript / tsup build
- [ ] `apps/docs` on Next.js 16 App Router + Fumadocs base
- [ ] First page ("Hello Vellum")
- [ ] vitest set up, one dummy test green
- [ ] Private GitHub repo, CI (install + build + test) green

**Done = empty docs site comes up with `pnpm dev`, CI green**

## Phase 1 — Token pipeline (Week 2)

Goal: W3C tokens JSON → CSS variables → reflected in the first page.

- [ ] `packages/core/src/types.ts` — `NormalizedTokens` schema
- [ ] `packages/core/src/derive.ts` — fallback chain + color / type / radius derivation
- [ ] `packages/adapter-w3c` — W3C JSON parser → `NormalizedTokens`
- [ ] `packages/core/src/css.ts` — `NormalizedTokens` → `:root { --vellum-* }`
- [ ] culori integration — hex / rgb / hsl → OKLCH
- [ ] Inject tokens into `apps/docs` — visibly drive header color from tokens
- [ ] Unit tests: parser / derivation / CSS emit

**Done = editing `tokens.json` immediately repaints docs**

## Phase 2 — Adapters: shadcn + design.md (Week 3)

Goal: two more input adapters. The `design.md` marketing hook works.

- [ ] `packages/adapter-shadcn` — parse HSL triplets in `globals.css` → `NormalizedTokens`
- [ ] If `components.json` is present, use it for additional hints (radius, etc.)
- [ ] `packages/adapter-md` — `design.md` parser (frontmatter + h2 sections + key:value lists)
- [ ] Auto-detect adapter (`vellum dev` scans the project)
- [ ] Priority order (`design.md` > `tokens.json` > `globals.css`), warn on conflict
- [ ] Fuzz tests for each adapter (don't crash on partial input)

**Done = drop a shadcn `globals.css` and docs re-skin / change one line of `design.md` and the chrome re-skins live**

## Phase 3 — Story engine (Week 4–5)

Goal: read the user's `.stories.tsx` into a single manifest.

- [ ] `packages/story/src/csf.ts` — CSF 3.0 reader (default export = meta, named exports = stories)
- [ ] `@vellum/react` types — `Meta<T>`, `StoryObj<T>` (compatible with `@storybook/types`)
- [ ] `packages/story/src/scan.ts` — `fast-glob` over `*.stories.{ts,tsx,js,jsx}`, Vite transform for module loading
- [ ] `packages/story/src/manifest.ts` — build `StoryManifest`
- [ ] `packages/story/src/props.ts` — `react-docgen-typescript` integration, `PropsSchema` extraction
- [ ] Compatibility test against real Storybook 9 fixtures
- [ ] `vellum stories validate` CLI command (manifest build + error report)

**Done = a Storybook project's `*.stories.tsx` files load into Vellum as-is, with components / stories / props extracted into the manifest**

## Phase 4 — Docs mode chrome + `<Story>` MDX (Week 6)

Goal: minimal Docs chrome complete; MDX can embed `<Story>`.

- [ ] `packages/chrome-minimal-docs` — left nav, top header, content area (token-driven only)
- [ ] Sidebar tree (auto-generated from manifest), mobile hamburger, dark mode toggle
- [ ] Code block component (thin border, soft shadow, copy button)
- [ ] `@vellum/react/mdx` — `<Story of={…} />`, `<Source of={…} />`, `<ArgsTable of={…} />`
- [ ] Search (Fumadocs default)
- [ ] Visual regression tests (Playwright) — screenshot diff across 3 different token sets

**Done = `/docs/button` renders `<Story of={ButtonStories.Default}>` MDX live + auto prop table**

## Phase 5 — Live preview (iframe + postMessage) (Week 7)

Goal: isolated preview runtime — foundation for Workbench.

- [ ] `packages/preview` — iframe React entry, `/preview/[story-id]` route
- [ ] Define postMessage protocol — args changes, viewport changes, event logs, a11y results
- [ ] iframe shares the token `:root` (same CSS variables as chrome)
- [ ] iframe sandbox options (scripts allowed, same-origin messaging)
- [ ] Docs mode `<Story>` switches to the iframe path

**Done = preview renders in iframe, postMessage updates args and re-renders**

## Phase 6 — Workbench mode chrome + story tree (Week 8)

Goal: Workbench layout shell complete.

- [ ] `packages/chrome-minimal-workbench` — left story tree + center preview + right panel container
- [ ] Story tree (search, folder grouping, favorites)
- [ ] Viewport toggle (mobile / tablet / desktop presets + custom)
- [ ] Background toggle (light / dark / custom)
- [ ] Right panel tab container (Controls / a11y / Actions / Code — bodies in next phase)
- [ ] `Cmd+K` search
- [ ] Mode toggle (Docs ↔ Workbench, deep-link preserved)

**Done = `/workbench/button--default` renders the Storybook-like layout; mode toggle takes you to `/docs/button`**

## Phase 7 — Controls panel + auto prop table (Week 9)

Goal: Workbench's #1 value + Docs's #1 asset.

- [ ] `packages/panel-controls` — `PropsSchema`-driven UI
  - boolean → toggle, enum / union → select, string → text, number → number+slider
  - object / function → JSON read-only with an explanation
- [ ] Args change → iframe postMessage → re-render
- [ ] "Copy args" button (CSF snippet)
- [ ] `argTypes` overrides take priority (manual > auto)
- [ ] `<ArgsTable>` MDX component (Docs mode renders the same data as a prop table)

**Done = Workbench toggle / select live-edit args; Docs page shows an automatic prop table**

## Phase 8 — a11y + Actions + Code panels (Week 10)

Goal: ship the remaining three V1 panels.

- [ ] `packages/panel-a11y` — axe-core inside the iframe, results posted to parent
  - Click a violation → highlight the DOM node (iframe overlay)
  - WCAG level toggle (A / AA / AAA)
- [ ] `packages/panel-actions` — auto-wrap function-typed args with spies, log calls
  - Serialize arguments (handle circular refs), JSON export, clear button
- [ ] `packages/panel-code` — CSF reflecting current args, plus copy-paste example
  - TSX / JSX toggle, copy button
- [ ] Cross-panel integration test (all four panels alive in Workbench)

**Done = all four Workbench tabs operational; reproducible a11y violation demo with at least one finding**

## Phase 9 — CLI + DX polish (Week 11)

Goal: an external project reaches its first page in five minutes.

- [ ] `packages/cli` — commander-based
- [ ] `vellum init` — interactive (token source detection, chrome choice, mode choice)
- [ ] `vellum dev` — Docs + Workbench together, hot reload on tokens + stories
- [ ] `vellum build` — static build → `out/docs`, `out/workbench`
- [ ] `vellum tokens preview <file>` — render chrome from tokens only
- [ ] `vellum stories validate` — manifest build + error report
- [ ] Human-friendly error messages (which token / prop is missing, how to fill it)
- [ ] `examples/` × 4 (`minimal`, `shadcn-import`, `design-md`, `storybook-migration`) — each reproducible via `init`

**Done = `npx vellum init` in an empty directory hits the first page in five minutes; Storybook migration demo runs under an hour**

## Phase 10 — Dogfooding + polish (Week 12–13)

Goal: Vellum's own docs are V1-launch ready.

- [ ] Vellum's official docs are themselves Vellum:
  - Getting started (init → first page)
  - Storybook migration guide (CSF compat)
  - Token reference (full `design.md` spec + W3C + shadcn)
  - Adapter guide
  - `<Story>` / `<ArgsTable>` / MDX usage
  - Workbench panels guide (Controls / a11y / Actions / Code)
  - Mode system (Docs ↔ Workbench)
  - Chrome skeleton gallery
- [ ] 30-second demo #1 — change one line of `design.md`, watch chrome re-skin (marketing hook #1)
- [ ] 30-second demo #2 — run `vellum init` on a Storybook project, get Workbench + Docs at once (marketing hook #2)
- [ ] Landing page (`apps/docs /`) — both demos + Getting Started
- [ ] Accessibility pass (keyboard nav, ARIA, contrast) — using our own a11y panel
- [ ] Dark mode visual regression

**Done = Vellum's own docs serve as the V1 demo**

## Phase 11 — OSS release (Week 14)

Goal: public launch + absorb initial traffic.

- [ ] LICENSE (MIT recommended)
- [ ] README — two hooks + two 30-second demo GIFs + Getting Started link
- [ ] CHANGELOG, CONTRIBUTING, CODE_OF_CONDUCT
- [ ] npm publish (`@vellum/core`, `@vellum/story`, `@vellum/react`, `@vellum/cli`, panels, chromes, adapters)
- [ ] GitHub repo goes public
- [ ] HN / X / r/reactjs / dev.to — different hook each:
  - HN: "Show HN: Vellum — Storybook + docs site from one source"
  - X: both demo clips + thread (emphasize the 1-hour migration)
  - r/reactjs: technical deep dive (CSF reader, mode split)
- [ ] Discord / Slack (feedback channel)
- [ ] First week post-launch: dedicate to issue triage (defer everything else)

**Done = public OSS launch; first-week stars 200+ / 10+ external issues / at least one successful CSF migration report**

## Phase 12 — Post-V1 (Month 4+)

Decide priorities once V1 is validated.

- Chrome skeleton `editorial` (strengthens Docs mode)
- Chrome skeleton `dense`
- Visual regression output format stabilization (Chromatic-class integrations)
- Test runner / play function (interaction tests)
- Composition (multi-site)
- Addon SDK (panel extensions)
- Tailwind config adapter
- Tokens Studio sync
- Sandpack (inline editing)

## Progress tracker

(Update one line per phase as it lands, with demo video link.)

- [ ] Phase 0 — Foundation
- [ ] Phase 1 — Token Pipeline
- [ ] Phase 2 — Adapters (shadcn + md)
- [ ] Phase 3 — Story Engine (CSF reader)
- [ ] Phase 4 — Docs Mode Chrome + `<Story>` MDX
- [ ] Phase 5 — Live Preview (iframe)
- [ ] Phase 6 — Workbench Mode Chrome
- [ ] Phase 7 — Controls Panel + Auto Prop Table
- [ ] Phase 8 — a11y + Actions + Code Panels
- [ ] Phase 9 — CLI + DX Polish
- [ ] Phase 10 — Dogfooding + Polish
- [ ] Phase 11 — OSS Release

## Parallelism notes

Phases 7–8 are well isolated — four panels can be built in parallel. Two engineers can shave ~2 weeks off (~12 weeks total).
