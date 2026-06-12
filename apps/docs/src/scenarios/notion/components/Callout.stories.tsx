import type { Meta, StoryObj } from '@vellum/react';
import { Callout } from './Callout.js';

const meta: Meta<typeof Callout> = {
  title: 'Content/Callout',
  component: Callout,
  args: {
    tone: 'info',
    emoji: '💡',
    children: 'Blocks like this draw the eye without raising the voice.',
  },
  argTypes: {
    tone: { control: 'select', options: ['info', 'warning', 'success', 'quote'], description: 'Visual tone.' },
    emoji: { control: 'text', description: 'Emoji icon.' },
    children: { control: 'text', description: 'Content.' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Warning: Story = { args: { tone: 'warning', emoji: '⚠️', children: 'Heads up — this action cannot be undone.' } };
export const Success: Story = { args: { tone: 'success', emoji: '✅', children: 'Saved 2 minutes ago.' } };
export const Quote: Story = { args: { tone: 'quote', emoji: '"', children: 'The best designs disappear, they get out of your way.' } };
