import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

const r = (p: string) => resolve(__dirname, p);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@vellum/core': r('../../packages/core/src/index.ts'),
      '@vellum/adapter-w3c': r('../../packages/adapter-w3c/src/index.ts'),
      '@vellum/adapter-shadcn': r('../../packages/adapter-shadcn/src/index.ts'),
      '@vellum/adapter-md': r('../../packages/adapter-md/src/index.ts'),
      '@vellum/story': r('../../packages/story/src/index.ts'),
      '@vellum/preview': r('../../packages/preview/src/index.ts'),
      '@vellum/react': r('../../packages/react/src/index.ts'),
      '@vellum/react/mdx': r('../../packages/react/src/mdx.ts'),
      '@vellum/chrome-minimal-docs': r('../../packages/chrome-minimal-docs/src/index.tsx'),
      '@vellum/chrome-minimal-workbench': r('../../packages/chrome-minimal-workbench/src/index.tsx'),
      '@vellum/chrome-brutalist-docs': r('../../packages/chrome-brutalist-docs/src/index.tsx'),
      '@vellum/chrome-brutalist-workbench': r('../../packages/chrome-brutalist-workbench/src/index.tsx'),
    },
  },
  server: { port: 5173 },
});
