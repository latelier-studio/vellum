import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { renderCSSVariables, type NormalizedTokens } from '@vellum/core';
import type { StoryManifest } from '@vellum/story';

export type VellumContextValue = {
  tokens: NormalizedTokens;
  manifest: StoryManifest;
  setTokens: (next: NormalizedTokens) => void;
};

const VellumContext = createContext<VellumContextValue | null>(null);

export function VellumProvider({
  tokens: initialTokens,
  manifest,
  children,
}: {
  tokens: NormalizedTokens;
  manifest: StoryManifest;
  children: ReactNode;
}) {
  const [tokens, setTokens] = useState(initialTokens);
  const css = useMemo(() => renderCSSVariables(tokens), [tokens]);
  const value = useMemo<VellumContextValue>(
    () => ({ tokens, manifest, setTokens }),
    [tokens, manifest],
  );

  return (
    <VellumContext.Provider value={value}>
      <style data-vellum-tokens>{css}</style>
      {children}
    </VellumContext.Provider>
  );
}

export function useVellum(): VellumContextValue {
  const v = useContext(VellumContext);
  if (!v) throw new Error('useVellum must be used within <VellumProvider>');
  return v;
}

export function useTokens(): NormalizedTokens {
  return useVellum().tokens;
}

export function useManifest(): StoryManifest {
  return useVellum().manifest;
}
