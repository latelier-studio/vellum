import type { Meta, StoryObj } from '@vellum/react';
import { Button } from './Button.js';

const meta: Meta<typeof Button> = {
  title: 'Inputs/Button',
  component: Button,
  args: { children: 'Share', variant: 'primary', onClick: () => {} },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'ghost'], description: 'Visual variant.' },
    icon: { control: 'text', description: 'Emoji or icon prefix.' },
    children: { control: 'text', description: 'Label.' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Ghost: Story = { args: { variant: 'ghost', children: 'Cancel' } };
export const WithIcon: Story = { args: { icon: '✨', children: 'New page' } };
export const Long: Story = { args: { children: 'Subscribe to this page' } };
