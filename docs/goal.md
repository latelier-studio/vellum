# Vellum — Goal

## In one line

**A Bring-Your-Own-Design system docs tool.** Drop your design tokens and the documentation chrome (sidebar, header, preview frames, code blocks, controls) re-skins itself with them. Chrome and content share one design language — zero mismatch.

## The problem

Existing component documentation tools (Storybook, Ladle, Histoire, React Cosmos) share three limits:

1. **Chrome carries its own brand.** Purple accents, IDE-style sidebars, addon tabs, control panels. When you drop minimalist components into it, the chrome eats the content.
2. **The category itself has aged badly.** None of the best-looking design system sites — Vercel Geist, Radix, shadcn, Linear, Stripe, Polaris, Base Web — use Storybook UI. Every one is custom-built.
3. **Custom builds are expensive.** Next.js + MDX + Fumadocs gets you something beautiful, but you rebuild live preview, controls, and the story system from scratch.

The core insight: the **aesthetic dissonance** between chrome and content is the real problem. If chrome can wear the user's tokens, both worlds (tool vs. custom build) win at once.

## Thesis

> "The tool doesn't have its own design. It wears yours."

- The user supplies design tokens (W3C JSON / shadcn CSS vars / `design.md`).
- Vellum drives every chrome CSS variable from those tokens.
- The user picks one of a small set of chrome skeletons (`minimal` / `editorial` / `dense`) to nail down layout tone.
- Result: docs that look like the user's own design system shipped them.

## Target user

- React design system maintainers (OSS or in-house libraries)
- People at the moment of "Storybook doesn't match our system — should we build our own docs?"
- Teams that care about design quality but can't afford weeks of bespoke build

## V1 scope (minimum shippable)

V1 must satisfy **two goals at once**:
- (A) Provide enough **developer tooling** to replace Storybook
- (B) Be a beautiful design-system docs site you could ship as-is

### A. Storybook-grade tooling (V1 required)

1. **Isolated component dev** — iframe sandboxing
2. **Story system** — N named states per component (Default / Loading / Error / Empty…)
3. **CSF 3.0 compatible** — read existing `.stories.tsx` (migration cost ~1 hour)
4. **Controls panel** — live prop editing
5. **Automatic prop tables** — extracted from TypeScript (`react-docgen-typescript`)
6. **Viewport toggles** — mobile / tablet / desktop
7. **a11y panel** — axe-core integration
8. **Actions logging** — record event handler calls

### B. Docs-site value (V1 required)

9. **Two token adapters** — W3C Design Tokens JSON / shadcn `globals.css`
10. **`design.md` DSL** — marketing / onboarding wow factor
11. **OKLCH-based derived colors** (hover / active / disabled / focus-ring)
12. **One chrome skeleton family** — `minimal` (Geist / Radix tone). Both modes (Docs / Workbench).
13. **MDX docs** with `<Story>` embeds + code toggles
14. CLI: `vellum init`, `vellum dev`, `vellum build`

### Mode split (core architectural call)

Same tokens, same components, **different layouts** for two use cases:

- **Docs mode** (`/docs/*`) — Geist / Radix tone. Wide content, sidebar, multiple `<Story>` blocks per page. Marketing / external docs / design system site.
- **Workbench mode** (`/workbench/*`) — Storybook tone. Left story tree, central preview, right panels (Controls / a11y / Actions / Code). Component development.

URL-toggleable, both surfaces sourced from the same data (stories + tokens). That single split is Vellum's main differentiator.

## V2+ candidates (after V1 lands)

- Extra chrome skeletons: `editorial`, `dense`
- **Visual regression integration** (Chromatic-style, snapshot output)
- **Test runner** (play function, interaction tests)
- **Composition** (multi-site federation)
- **Addon SDK** (3rd-party panel extensions)
- Tailwind config extraction
- Figma Tokens Studio sync
- AI token inference (extract from Tailwind classes / CSS)
- Sandpack / react-live inline editing

## Non-goals

- **Framework breadth (no).** V1 is React-only. Vue / Svelte are V2 considerations.
- **Storybook addon SDK compatibility (no).** Story format (CSF) is compatible; addon API is a separate model. Provide a migration guide only.
- **Hosting SaaS (no).** OSS library + static build. Host on Vercel / Netlify.
- **Universal theme engine (no).** Colors alone can't carry every aesthetic — that's why chrome skeletons exist.
- **Built-in visual regression engine (no).** V1 emits a manifest external tools (Chromatic et al.) can consume. Snapshot diff is V2.

## Success criteria

**At V1 launch (first month):**
- GitHub stars 500+
- At least one external design system migrates docs to Vellum
- `vellum init` → first page within 5 minutes

**Six months:**
- 5,000+ monthly npm installs
- 20% of new shadcn-style OSS design systems pick Vellum for docs
- 10+ "switched from Storybook to Vellum" tweets / blog posts

**Twelve months:**
- One of the de facto options in the React design-system docs category
- At least one well-known design system ships new docs built on Vellum

## Wow factor (lead marketing hooks)

Two hooks because two entry paths:

### Hook #1 — for design system maintainers

> "Drop your `design.md`. Watch your docs rebuild itself."

30-second demo: edit one line of `design.md` → sidebar, header, code blocks, controls re-skin live.

### Hook #2 — for Storybook users

> "Point Vellum at your `.stories.tsx`. Get both a Storybook AND a docs site."

30-second demo: run `vellum init` in a Storybook project → two URLs (`/workbench` = Storybook replacement, `/docs` = docs site from the same stories). 1-hour migration.

Both hooks come from the same product — that's the key. "Came for Workbench, got the docs site free" / "Came for docs, got Workbench too."

## Competitive landscape

| Category | Examples | Relation to Vellum |
|---|---|---|
| Component workbench | Storybook, Ladle, Histoire | Direct replacement — Workbench mode + CSF migration |
| Docs frameworks | Fumadocs, Nextra, Mintlify | Adjacent — Vellum can sit on top of Fumadocs |
| Design system SaaS | Supernova, zeroheight | Different price tier and audience — OSS complement |
| Custom builds | shadcn docs, Radix docs | The cost Vellum is trying to eliminate — extract the shared base |

**One-line positioning:** Vellum builds "Storybook + design system docs site" from one data source (stories + tokens). If you only need one of those, the other comes free.
