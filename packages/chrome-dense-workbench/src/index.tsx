import { WorkbenchChrome as MinimalWorkbench } from '@vellum/chrome-minimal-workbench';
import type { ComponentProps } from 'react';

/**
 * Dense Workbench chrome.
 *
 * Inherits minimal-workbench layout; the dense tone (small mono labels,
 * tight spacing) flows from the design.md tokens chosen by the consumer.
 */
export type WorkbenchChromeProps = ComponentProps<typeof MinimalWorkbench>;

export function WorkbenchChrome(props: WorkbenchChromeProps) {
  return (
    <div data-vellum-chrome="dense" style={{ fontSize: 12 }}>
      <MinimalWorkbench {...props} />
    </div>
  );
}
