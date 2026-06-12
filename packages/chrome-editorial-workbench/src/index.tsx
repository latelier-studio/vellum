import { WorkbenchChrome as MinimalWorkbench } from '@vellum/chrome-minimal-workbench';
import type { ComponentProps } from 'react';

/**
 * Editorial Workbench chrome.
 *
 * Workbench is primarily a tool surface — brand expression lives in the docs
 * chrome. Editorial-workbench inherits minimal-workbench's layout and applies
 * an editorial CSS-variable scope so accents/typography reflect the token set
 * without re-implementing the entire workbench tree.
 */
export type WorkbenchChromeProps = ComponentProps<typeof MinimalWorkbench>;

export function WorkbenchChrome(props: WorkbenchChromeProps) {
  return (
    <div data-vellum-chrome="editorial" style={{ fontFamily: 'var(--vellum-font-body)' }}>
      <MinimalWorkbench {...props} />
    </div>
  );
}
