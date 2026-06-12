import type { Meta, StoryObj } from '@vellum/react';
import { Button } from './Button.js';

const meta: Meta<typeof Button> = {
  title: 'Inputs/Button',
  component: Button,
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'md',
    disabled: false,
    loading: false,
    onClick: () => {},
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'ghost', 'destructive'],
      description: 'Visual variant of the button.',
    },
    size: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Size scale.' },
    disabled: { control: 'boolean', description: 'Disabled state.' },
    loading: { control: 'boolean', description: 'Loading state — shows a spinner.' },
    children: { control: 'text', description: 'Button label.' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Ghost: Story = {
  args: { variant: 'ghost', children: 'Ghost button' },
};

export const Destructive: Story = {
  args: { variant: 'destructive', children: 'Delete' },
};

export const Small: Story = {
  args: { size: 'sm', children: 'Small' },
};

export const Large: Story = {
  args: { size: 'lg', children: 'Large' },
};

export const Loading: Story = {
  args: { loading: true, children: 'Loading…' },
};

export const Disabled: Story = {
  args: { disabled: true, children: 'Disabled' },
};

/** Demonstrates a story-level decorator (centers the button on a tinted strip). */
export const WithDecorator: Story = {
  args: { children: 'Wrapped' },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: '12px 24px',
          background: 'color-mix(in oklab, var(--vellum-color-accent) 8%, transparent)',
          border: '1px dashed var(--vellum-color-accent)',
          borderRadius: 'var(--vellum-radius-md)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};

/** Demonstrates a play function — focuses the button after mount. */
export const Autofocus: Story = {
  args: { children: 'Focused on mount' },
  play: ({ canvasElement }) => {
    const btn = canvasElement.querySelector('button');
    btn?.focus();
  },
};
