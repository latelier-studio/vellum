import type { Meta, StoryObj } from '@vellum/react';
import { Button } from './Button.js';

const meta: Meta<typeof Button> = {
  title: 'Actions/Button',
  component: Button,
  args: { children: 'New issue', variant: 'primary', size: 'sm', onClick: () => {} },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'subtle'], description: 'Visual variant.' },
    size: { control: 'select', options: ['xs', 'sm', 'md'], description: 'Size.' },
    shortcut: { control: 'text', description: 'Keyboard shortcut hint shown as kbd.' },
    disabled: { control: 'boolean' },
    children: { control: 'text' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const WithShortcut: Story = { args: { shortcut: 'C', children: 'New issue' } };
export const Secondary: Story = { args: { variant: 'secondary', children: 'Save filter' } };
export const Subtle: Story = { args: { variant: 'subtle', children: 'Cancel' } };
export const Compact: Story = { args: { size: 'xs', children: 'Add label', shortcut: 'L' } };
