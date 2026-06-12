import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

type State = { error: Error | null; info: ErrorInfo | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ error, info });
    // eslint-disable-next-line no-console
    console.error('[vellum] caught:', error.message, '\n', error.stack, '\n', info.componentStack);
  }

  render() {
    const { error, info } = this.state;
    if (error) {
      return (
        <div style={{ padding: 32, fontFamily: 'ui-monospace, monospace', whiteSpace: 'pre-wrap' }}>
          <h1 style={{ marginBottom: 16, fontSize: 18 }}>Vellum error</h1>
          <p style={{ color: 'crimson' }}>{error.message}</p>
          <pre style={{ background: '#f5f5f5', padding: 12, fontSize: 11, overflow: 'auto' }}>
            {error.stack}
          </pre>
          {info ? (
            <pre style={{ background: '#fafafa', padding: 12, fontSize: 11, overflow: 'auto' }}>
              {info.componentStack}
            </pre>
          ) : null}
        </div>
      );
    }
    return this.props.children;
  }
}
