import type { Meta, StoryObj } from '@vellum/react';
import { Button } from './Button.js';

const meta: Meta<typeof Button> = {
  title: 'Print/Button',
  component: Button,
  args: { children: 'BUY THE ZINE', stamp: 'shout', onClick: () => {} },
  argTypes: {
    stamp: { control: 'select', options: ['shout', 'whisper', 'ink'], description: 'Visual stamp.' },
    children: { control: 'text', description: 'Label.' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Shout: Story = {};
export const Whisper: Story = { args: { stamp: 'whisper', children: 'Subscribe' } };
export const Ink: Story = { args: { stamp: 'ink', children: 'Read · Issue 04' } };
export const Wide: Story = { args: { children: 'Risograph Pressed Bi-Monthly' } };
