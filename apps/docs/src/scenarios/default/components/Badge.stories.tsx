import type { Meta, StoryObj } from '@vellum/react';
import { Badge } from './Badge.js';

const meta: Meta<typeof Badge> = {
  title: 'Surfaces/Badge',
  component: Badge,
  args: {
    tone: 'neutral',
    children: 'BADGE',
  },
  argTypes: {
    tone: {
      control: 'select',
      options: ['neutral', 'accent', 'danger', 'success'],
      description: 'Visual tone.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Accent: Story = { args: { tone: 'accent', children: 'NEW' } };
export const Danger: Story = { args: { tone: 'danger', children: 'BREAKING' } };
export const Success: Story = { args: { tone: 'success', children: 'STABLE' } };
