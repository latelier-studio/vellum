/**
 * postMessage protocol shared between chrome (parent) and preview iframe (child).
 *
 * The iframe is treated as untrusted UI surface — only the documented messages cross.
 */

export type PreviewMessageFromParent =
  | { type: 'preview:set-args'; storyId: string; args: Record<string, unknown> }
  | { type: 'preview:set-viewport'; viewport: ViewportSpec }
  | { type: 'preview:set-background'; value: string }
  | { type: 'preview:run-a11y' }
  | { type: 'preview:clear-actions' };

export type PreviewMessageFromChild =
  | { type: 'preview:ready'; storyId: string }
  | { type: 'preview:rendered'; storyId: string }
  | { type: 'preview:action'; name: string; args: unknown[] }
  | { type: 'preview:a11y-result'; result: A11yResult }
  | { type: 'preview:error'; message: string };

export type ViewportSpec = {
  id: string;
  name: string;
  width: number;
  height: number;
};

export const DEFAULT_VIEWPORTS: ViewportSpec[] = [
  { id: 'auto', name: 'Auto', width: 0, height: 0 },
  { id: 'mobile', name: 'Mobile', width: 375, height: 667 },
  { id: 'tablet', name: 'Tablet', width: 768, height: 1024 },
  { id: 'desktop', name: 'Desktop', width: 1280, height: 800 },
];

export type A11yViolation = {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical' | null;
  description: string;
  help: string;
  nodes: { html: string; target: string[] }[];
};

export type A11yResult = {
  violations: A11yViolation[];
  passes: number;
  incomplete: number;
};

/**
 * Wrap callable props in an args object so each invocation emits a postMessage
 * to the parent window. Non-function values pass through untouched.
 */
export function instrumentArgsForActions(
  args: Record<string, unknown>,
  storyId: string,
  post: (msg: PreviewMessageFromChild) => void,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (typeof v === 'function') {
      out[k] = (...callArgs: unknown[]) => {
        try {
          post({ type: 'preview:action', name: k, args: serializeArgs(callArgs) });
        } catch {
          /* ignore serialization errors */
        }
        return (v as (...x: unknown[]) => unknown)(...callArgs);
      };
    } else {
      out[k] = v;
    }
  }
  void storyId;
  return out;
}

function serializeArgs(args: unknown[]): unknown[] {
  return args.map((a) => {
    if (a === null || a === undefined) return a;
    if (typeof a === 'function') return `[Function ${a.name || 'anonymous'}]`;
    if (typeof a === 'object') {
      try {
        // SyntheticEvent and DOM nodes — strip to a small summary
        const proto = Object.getPrototypeOf(a)?.constructor?.name;
        if (proto && proto !== 'Object' && proto !== 'Array') {
          return `[${proto}]`;
        }
        return JSON.parse(JSON.stringify(a));
      } catch {
        return '[Unserializable]';
      }
    }
    return a;
  });
}
