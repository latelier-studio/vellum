import { useManifest, useTokens } from '@vellum/react';
import { formatOKLCH, type NormalizedTokens } from '@vellum/core';

/**
 * Docs root.
 * No hardcoded marketing copy — content is a visual reading of the user's design.md:
 * brand name → palette → typography → spacing → component index.
 * Each scenario gets a different "feel" because every block is rendered with its own tokens.
 */
export function OverviewPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const tokens = useTokens();
  const manifest = useManifest();
  const brand = tokens.meta.name ?? 'Design System';

  return (
    <article style={{ display: 'grid', gap: 'var(--vellum-space-12)' }}>
      <Hero brand={brand} totalComponents={manifest.components.length} />
      <PaletteSection tokens={tokens} />
      <TypeSection />
      <SpaceSection tokens={tokens} />
      <ComponentIndex
        components={manifest.components.map((c) => ({
          id: c.id,
          name: c.name,
          group: c.title.includes('/') ? c.title.split('/')[0]! : 'Components',
          stories: c.stories.length,
        }))}
        onNavigate={onNavigate}
      />
    </article>
  );
}

function Hero({ brand, totalComponents }: { brand: string; totalComponents: number }) {
  return (
    <header style={{ display: 'grid', gap: 'var(--vellum-space-4)' }}>
      <MonoCaps>Design System</MonoCaps>
      <h1
        style={{
          margin: 0,
          fontFamily: 'var(--vellum-font-display)',
          fontSize: 'clamp(56px, 9vw, 112px)',
          lineHeight: 0.92,
          letterSpacing: '-0.035em',
          fontWeight: 600,
          color: 'var(--vellum-color-fg)',
        }}
      >
        {brand}
      </h1>
      <div style={{ display: 'flex', gap: 'var(--vellum-space-6)', alignItems: 'baseline', marginTop: 'var(--vellum-space-2)' }}>
        <MonoCaps>
          {totalComponents} {totalComponents === 1 ? 'Component' : 'Components'}
        </MonoCaps>
      </div>
    </header>
  );
}

function shortOKLCH(c: { l: number; c: number; h: number }): string {
  const fmt = (n: number, d = 2) => Number(n.toFixed(d)).toString();
  return `oklch ${fmt(c.l)} ${fmt(c.c)} ${fmt(c.h, 0)}`;
}

function PaletteSection({ tokens }: { tokens: NormalizedTokens }) {
  const c = tokens.color;
  const swatches: Array<{ label: string; bg: string; fg: string; sample: string }> = [
    { label: 'fg', bg: formatOKLCH(c.fg), fg: formatOKLCH(c.bg), sample: shortOKLCH(c.fg) },
    { label: 'bg', bg: formatOKLCH(c.bg), fg: formatOKLCH(c.fg), sample: shortOKLCH(c.bg) },
    { label: 'accent', bg: formatOKLCH(c.accent), fg: formatOKLCH(c['accent-fg']), sample: shortOKLCH(c.accent) },
    { label: 'muted', bg: formatOKLCH(c.muted), fg: formatOKLCH(c['muted-fg']), sample: shortOKLCH(c.muted) },
    { label: 'border', bg: formatOKLCH(c.border), fg: formatOKLCH(c.fg), sample: shortOKLCH(c.border) },
  ];
  return (
    <Section index="01" title="Palette" caption={`${swatches.length} colors`}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--vellum-space-3)' }}>
        {swatches.map((s) => (
          <div
            key={s.label}
            style={{
              background: s.bg,
              color: s.fg,
              padding: 'var(--vellum-space-4)',
              border: '1px solid var(--vellum-color-border)',
              borderRadius: 'var(--vellum-radius-md)',
              minHeight: 96,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {s.label}
            </span>
            <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 10, opacity: 0.7, wordBreak: 'break-all' }}>{s.sample}</span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function TypeSection() {
  return (
    <Section index="02" title="Type" caption="display · body · mono">
      <div style={{ display: 'grid', gap: 'var(--vellum-space-4)' }}>
        <Specimen label="display" sample="The brand speaks first." family="var(--vellum-font-display)" size={48} weight={600} />
        <Specimen label="body" sample="Long-form documentation that has to read clean for hours." family="var(--vellum-font-body)" size={18} weight={400} />
        <Specimen label="mono" sample="border: 1px solid var(--vellum-color-border);" family="var(--vellum-font-mono)" size={14} weight={500} />
      </div>
    </Section>
  );
}

function Specimen({
  label,
  sample,
  family,
  size,
  weight,
}: {
  label: string;
  sample: string;
  family: string;
  size: number;
  weight: number;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 'var(--vellum-space-4)', alignItems: 'baseline' }}>
      <MonoCaps>{label}</MonoCaps>
      <div style={{ fontFamily: family, fontSize: size, fontWeight: weight, lineHeight: 1.2, color: 'var(--vellum-color-fg)' }}>
        {sample}
      </div>
    </div>
  );
}

function SpaceSection({ tokens }: { tokens: NormalizedTokens }) {
  const densityMul = tokens.space.density === 'compact' ? 0.85 : tokens.space.density === 'airy' ? 1.2 : 1;
  const stops = [2, 3, 4, 6, 8, 12];
  return (
    <Section index="03" title="Space" caption={`base ${tokens.space.base}px · ${tokens.space.density}`}>
      <div style={{ display: 'flex', gap: 'var(--vellum-space-3)', alignItems: 'flex-end' }}>
        {stops.map((n) => {
          const px = Math.round(tokens.space.base * n * densityMul);
          return (
            <div key={n} style={{ display: 'grid', gap: 6, justifyItems: 'center' }}>
              <div
                style={{
                  width: px,
                  height: px,
                  background: 'var(--vellum-color-accent)',
                  opacity: 0.85,
                  borderRadius: 'var(--vellum-radius-sm)',
                }}
              />
              <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 10, color: 'var(--vellum-color-muted-fg)' }}>
                {n} · {px}px
              </span>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function ComponentIndex({
  components,
  onNavigate,
}: {
  components: Array<{ id: string; name: string; group: string; stories: number }>;
  onNavigate: (path: string) => void;
}) {
  return (
    <Section index="04" title="Components" caption={`${components.length} items`}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 1 }}>
        {components.map((c, i) => (
          <li key={c.id}>
            <a
              href={`/docs/${c.id}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(`/docs/${c.id}`);
              }}
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr auto',
                alignItems: 'center',
                gap: 'var(--vellum-space-4)',
                paddingBlock: 'var(--vellum-space-3)',
                paddingInline: 'var(--vellum-space-2)',
                textDecoration: 'none',
                color: 'var(--vellum-color-fg)',
                borderTop: i === 0 ? '1px solid var(--vellum-color-border)' : 'none',
                borderBottom: '1px solid var(--vellum-color-border)',
                transition: 'background var(--vellum-duration-fast) var(--vellum-easing)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--vellum-color-muted)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 11, color: 'var(--vellum-color-accent)', fontWeight: 600 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                style={{
                  fontFamily: 'var(--vellum-font-display)',
                  fontSize: 'var(--vellum-text-lg)',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                }}
              >
                {c.name}
              </span>
              <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 11, color: 'var(--vellum-color-muted-fg)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                {c.group} · {c.stories} {c.stories === 1 ? 'story' : 'stories'}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Section({ index, title, caption, children }: { index: string; title: string; caption?: string; children: React.ReactNode }) {
  return (
    <section style={{ display: 'grid', gap: 'var(--vellum-space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 'var(--vellum-space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--vellum-space-3)', alignItems: 'baseline' }}>
          <span style={{ fontFamily: 'var(--vellum-font-mono)', fontSize: 11, color: 'var(--vellum-color-accent)', letterSpacing: '0.12em', fontWeight: 600 }}>
            {index}
          </span>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--vellum-font-display)',
              fontSize: 'var(--vellum-text-2xl)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'var(--vellum-color-fg)',
            }}
          >
            {title}
          </h2>
        </div>
        {caption ? <MonoCaps>{caption}</MonoCaps> : null}
      </div>
      {children}
    </section>
  );
}

function MonoCaps({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: 'var(--vellum-color-muted-fg)',
      }}
    >
      {children}
    </div>
  );
}
