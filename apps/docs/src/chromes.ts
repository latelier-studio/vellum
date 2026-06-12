import type { ComponentType } from 'react';
import type { ChromeId } from '@vellum/core';
import { DocsChrome as MinimalDocs } from '@vellum/chrome-minimal-docs';
import { WorkbenchChrome as MinimalWorkbench } from '@vellum/chrome-minimal-workbench';
import { DocsChrome as BrutalistDocs } from '@vellum/chrome-brutalist-docs';
import { WorkbenchChrome as BrutalistWorkbench } from '@vellum/chrome-brutalist-workbench';
import { DocsChrome as EditorialDocs } from '@vellum/chrome-editorial-docs';
import { WorkbenchChrome as EditorialWorkbench } from '@vellum/chrome-editorial-workbench';
import { DocsChrome as DenseDocs } from '@vellum/chrome-dense-docs';
import { WorkbenchChrome as DenseWorkbench } from '@vellum/chrome-dense-workbench';

type DocsChromeProps = React.ComponentProps<typeof MinimalDocs>;
type WorkbenchChromeProps = React.ComponentProps<typeof MinimalWorkbench>;

export const DOCS_CHROMES: Record<ChromeId, ComponentType<DocsChromeProps>> = {
  minimal: MinimalDocs,
  brutalist: BrutalistDocs,
  editorial: EditorialDocs,
  dense: DenseDocs,
};

export const WORKBENCH_CHROMES: Record<ChromeId, ComponentType<WorkbenchChromeProps>> = {
  minimal: MinimalWorkbench,
  brutalist: BrutalistWorkbench,
  editorial: EditorialWorkbench,
  dense: DenseWorkbench,
};
