# Storybook migration example

This stub demonstrates the CSF-3 import-line change required to run an existing
Storybook story under Vellum.

```diff
- import type { Meta, StoryObj } from '@storybook/react';
+ import type { Meta, StoryObj } from '@vellum/react';

  import { Button } from './Button';

  const meta: Meta<typeof Button> = {
    component: Button,
    args: { children: 'Click me' },
  };
  export default meta;

  export const Default: StoryObj<typeof meta> = {};
  export const Loading: StoryObj<typeof meta> = { args: { loading: true } };
```

That's the entire migration for the common case. Vellum's `Meta` / `StoryObj`
types match Storybook 7+'s shape, and the same module is consumed by Docs mode
and Workbench mode.
