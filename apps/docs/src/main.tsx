import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { App } from './App.js';
import { ErrorBoundary } from './ErrorBoundary.js';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root mount node');
createRoot(root).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
