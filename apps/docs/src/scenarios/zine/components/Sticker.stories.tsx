import type { Meta, StoryObj } from '@vellum/react';
import { Sticker } from './Sticker.js';

const meta: Meta<typeof Sticker> = {
  title: 'Print/Sticker',
  component: Sticker,
  args: { children: 'NEW! ISSUE 04', rotation: -4, color: 'accent' },
  argTypes: {
    rotation: { control: 'number', description: 'Rotation in degrees.' },
    color: { control: 'select', options: ['accent', 'ink', 'paper'], description: 'Color stamp.' },
    children: { control: 'text', description: 'Label.' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Accent: Story = {};
export const Ink: Story = { args: { color: 'ink', children: 'SOLD OUT', rotation: 6 } };
export const Paper: Story = { args: { color: 'paper', children: 'ISSUE 04 · 2026', rotation: -8 } };
export const Square: Story = { args: { rotation: 0, children: 'LIMITED 250' } };
