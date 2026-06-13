import { useEffect, useMemo, useState } from 'react';
import { VellumProvider, useTokens } from '@vellum/react';
import { DOCS_CHROMES, WORKBENCH_CHROMES } from './chromes.js';
import { SCENARIOS, DEFAULT_SCENARIO, type Scenario } from './scenarios.js';
import { ComponentPage } from './pages/ComponentPage.js';
import { OverviewPage } from './pages/OverviewPage.js';
import { PreviewPage } from './pages/PreviewPage.js';
import { FontLoader } from './FontLoader.js';

const SCENARIO_STORAGE_KEY = 'vellum.scenario.id';

export function App() {
  const [path, setPath] = useState<string>(() => window.location.pathname || '/docs');
  const [scenarioId, setScenarioId] = useState<string>(() => {
    try {
      return localStorage.getItem(SCENARIO_STORAGE_KEY) ?? DEFAULT_SCENARIO.id;
    } catch {
      return DEFAULT_SCENARIO.id;
    }
  });
  const scenario = useMemo<Scenario>(
    () => SCENARIOS.find((s) => s.id === scenarioId) ?? DEFAULT_SCENARIO,
    [scenarioId],
  );

  useEffect(() => {
    const onPop = () => setPath(window.location.pathname || '/docs');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SCENARIO_STORAGE_KEY, scenarioId);
    } catch {
      /* ignore */
    }
  }, [scenarioId]);

  // When the scenario changes, drop any URL that points at a component/story
  // the new scenario doesn't contain — otherwise the user sees "not found".
  useEffect(() => {
    const docsMatch = /^\/docs\/([^/]+)$/.exec(path);
    if (docsMatch) {
      const id = docsMatch[1]!;
      if (!scenario.manifest.components.some((c) => c.id === id)) {
        window.history.replaceState({}, '', '/docs');
        setPath('/docs');
      }
      return;
    }
    const workbenchMatch = /^\/workbench\/(.+)$/.exec(path);
    if (workbenchMatch) {
      const id = workbenchMatch[1]!;
      const exists = scenario.manifest.components.some((c) => c.stories.some((s) => s.id === id));
      if (!exists) {
        window.history.replaceState({}, '', '/workbench');
        setPath('/workbench');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario.id]);

  const navigate = (next: string) => {
    if (next === path) return;
    window.history.pushState({}, '', next);
    setPath(next);
  };

  const isPreview = /^\/preview\//.test(path);

  return (
    <VellumProvider key={scenario.id} tokens={scenario.tokens} manifest={scenario.manifest}>
      <FontLoader />
      {!isPreview ? <ScenarioPicker activeId={scenario.id} onPick={setScenarioId} /> : null}
      <Router path={path} onNavigate={navigate} />
    </VellumProvider>
  );
}

function Router({ path, onNavigate }: { path: string; onNavigate: (p: string) => void }) {
  const tokens = useTokens();
  const chromeId = tokens.meta.chrome;
  const DocsChrome = DOCS_CHROMES[chromeId] ?? DOCS_CHROMES.minimal;

  const previewMatch = /^\/preview\/(.+)$/.exec(path);
  if (previewMatch) {
    return <PreviewPage storyId={previewMatch[1]!} />;
  }

  // /workbench/<storyId> → /docs/<componentId>?view=workbench
  // The standalone workbench shell is still available in the chrome package for
  // users who want a full-screen workbench; the demo collapses both views onto
  // a single component URL so chrome and component context stay intact.
  const workbenchMatch = /^\/workbench(?:\/(.+))?$/.exec(path);
  if (workbenchMatch) {
    const storyId = workbenchMatch[1];
    const componentId = storyId ? storyId.split('--')[0] : undefined;
    const target = componentId ? `/docs/${componentId}?view=workbench` : '/docs';
    // useEffect would suffice but a direct call here means no flicker.
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', target);
      setTimeout(() => onNavigate(target.split('?')[0]!), 0);
    }
    return null;
  }

  const docsMatch = /^\/docs(?:\/([^/]+))?$/.exec(path);
  const componentId = docsMatch?.[1];

  return (
    <DocsChrome currentPath={path} onNavigate={onNavigate}>
      {componentId ? (
        <ComponentPage componentId={componentId} onNavigate={onNavigate} />
      ) : (
        <OverviewPage onNavigate={onNavigate} />
      )}
    </DocsChrome>
  );
}

function ScenarioPicker({ activeId, onPick }: { activeId: string; onPick: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const active = SCENARIOS.find((s) => s.id === activeId) ?? DEFAULT_SCENARIO;
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 50,
        fontFamily: 'ui-monospace, SFMono-Regular, monospace',
        fontSize: 11,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
      }}
    >
      {open ? (
        <div
          role="dialog"
          style={{
            marginBottom: 8,
            width: 340,
            background: '#0c0d12',
            color: '#e8e6dd',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 24px 48px -16px rgba(0,0,0,0.5)',
            padding: 12,
          }}
        >
          <div style={{ color: '#7d8093', padding: '2px 8px 10px', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: 8, fontSize: 10 }}>
            Drop a brand · Vellum stays the same
          </div>
          {SCENARIOS.map((s) => {
            const on = s.id === activeId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onPick(s.id);
                  setOpen(false);
                }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '12px 1fr',
                  alignItems: 'baseline',
                  gap: 10,
                  width: '100%',
                  textAlign: 'left',
                  background: on ? 'rgba(255, 176, 0, 0.08)' : 'transparent',
                  border: 0,
                  color: on ? '#ffb000' : '#e8e6dd',
                  padding: '10px 8px',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                <span aria-hidden style={{ width: 6, height: 6, marginTop: 6, background: on ? '#ffb000' : '#4a4e5c' }} />
                <span>
                  <span style={{ display: 'block' }}>
                    {s.label}
                    <span style={{ color: '#4a4e5c', marginLeft: 8, fontSize: 9 }}>
                      {s.manifest.components.length}c · {s.tokens.meta.chrome}
                    </span>
                  </span>
                  <span
                    style={{
                      display: 'block',
                      marginTop: 4,
                      textTransform: 'none',
                      letterSpacing: 'normal',
                      fontSize: 11,
                      color: on ? 'rgba(255, 176, 0, 0.78)' : '#7d8093',
                      lineHeight: 1.4,
                    }}
                  >
                    {s.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: '#0c0d12',
          color: '#ffb000',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          fontFamily: 'inherit',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          boxShadow: '0 12px 32px -16px rgba(0,0,0,0.4)',
        }}
      >
        <span aria-hidden style={{ width: 6, height: 6, background: '#ffb000' }} />
        <span style={{ color: '#e8e6dd' }}>brand:</span>
        <span>{active.label}</span>
      </button>
    </div>
  );
}
