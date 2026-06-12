import type { ComponentType } from 'react';
import type { ChromeId } from '@vellum/core';
import { DocsChrome as MinimalDocs } from '@vellum/chrome-minimal-docs';
import { WorkbenchChrome as MinimalWorkbench } from '@vellum/chrome-minimal-workbench';
import { DocsChrome as BrutalistDocs } from '@vellum/chrome-brutalist-docs';
import { WorkbenchChrome as BrutalistWorkbench } from '@vellum/chrome-brutalist-workbench';

type DocsChromeProps = React.ComponentProps<typeof MinimalDocs>;
type WorkbenchChromeProps = React.ComponentProps<typeof MinimalWorkbench>;

export const DOCS_CHROMES: Record<ChromeId, ComponentType<DocsChromeProps>> = {
  minimal: MinimalDocs,
  brutalist: BrutalistDocs,
  // editorial / dense are V2 — fall back to minimal until shipped
  editorial: MinimalDocs,
  dense: MinimalDocs,
};

export const WORKBENCH_CHROMES: Record<ChromeId, ComponentType<WorkbenchChromeProps>> = {
  minimal: MinimalWorkbench,
  brutalist: BrutalistWorkbench,
  editorial: MinimalWorkbench,
  dense: MinimalWorkbench,
};
