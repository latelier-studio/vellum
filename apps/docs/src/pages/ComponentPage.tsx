import { ArgsTable, Story, useManifest } from '@vellum/react';
import { ModeTabs } from '../components/ModeTabs.js';

export function ComponentPage({
  componentId,
  onNavigate,
}: {
  componentId: string;
  onNavigate: (path: string) => void;
}) {
  const manifest = useManifest();
  const component = manifest.components.find((c) => c.id === componentId);
  if (!component) {
    return (
      <div
        style={{
          padding: 'var(--vellum-space-8)',
          border: '1px dashed var(--vellum-color-border)',
          borderRadius: 'var(--vellum-radius-md)',
          color: 'var(--vellum-color-muted-fg)',
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <div style={{ textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, marginBottom: 8 }}>
          404 · No such component
        </div>
        <code style={{ color: 'var(--vellum-color-fg)' }}>{componentId}</code>{' '}
        isn’t part of this design system.
      </div>
    );
  }

  const [group, name] = component.title.includes('/')
    ? (component.title.split('/') as [string, string])
    : ['Components', component.name];
  const firstStoryId = component.stories[0]?.id;
  const workbenchHref = firstStoryId ? `/workbench/${firstStoryId}` : '/workbench';
  const docsHref = `/docs/${component.id}`;

  return (
    <article>
      <header style={{ marginBottom: 'var(--vellum-space-10)' }}>
        <Breadcrumb group={group} name={name} />
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 'var(--vellum-space-6)',
            flexWrap: 'wrap',
            marginTop: 10,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: 'var(--vellum-font-display)',
              fontSize: 'clamp(40px, 6vw, 60px)',
              fontWeight: 600,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            {component.name}
          </h1>
          <ModeTabs current="docs" docsHref={docsHref} workbenchHref={workbenchHref} onNavigate={onNavigate} />
        </div>
      </header>

      <section style={{ marginBottom: 'var(--vellum-space-12)' }}>
        <SectionHeader index="01" label={`${component.stories.length} stories`} title="Stories" />
        <div>
          {component.stories.map((story, i) => (
            <Story key={story.id} of={story} index={i + 1} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          index="02"
          label={`${component.propsSchema?.props.length ?? 0} props`}
          title="API"
        />
        <ArgsTable of={component} />
      </section>
    </article>
  );
}

function Breadcrumb({ group, name }: { group: string; name: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 10,
        fontFamily: 'var(--vellum-font-mono)',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: 'var(--vellum-color-muted-fg)',
      }}
    >
      <span style={{ color: 'var(--vellum-color-accent)', fontWeight: 600 }}>{group}</span>
      <span aria-hidden>/</span>
      <span style={{ color: 'var(--vellum-color-fg)', fontWeight: 600 }}>{name}</span>
    </div>
  );
}

function SectionHeader({ index, label, title }: { index: string; label: string; title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 'var(--vellum-space-5)',
        paddingBottom: 'var(--vellum-space-3)',
        borderBottom: '1px solid var(--vellum-color-border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <span
          style={{
            fontFamily: 'var(--vellum-font-mono)',
            fontSize: 11,
            color: 'var(--vellum-color-accent)',
            fontWeight: 600,
            letterSpacing: '0.12em',
          }}
        >
          {index}
        </span>
        <h2
          style={{
            margin: 0,
            fontFamily: 'var(--vellum-font-display)',
            fontSize: 'var(--vellum-text-xl)',
            fontWeight: 600,
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
      </div>
      <span
        style={{
          fontFamily: 'var(--vellum-font-mono)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: 'var(--vellum-color-muted-fg)',
        }}
      >
        {label}
      </span>
    </div>
  );
}
