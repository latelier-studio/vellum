import type { Meta, StoryObj } from '@vellum/react';
import { Card } from './Card.js';

const meta: Meta<typeof Card> = {
  title: 'Surfaces/Card',
  component: Card,
  args: {
    title: 'Pricing plan',
    subtitle: 'Everything you need, nothing you don’t.',
    elevated: false,
    children: 'Cards group related content into a single visual unit.',
  },
  argTypes: {
    title: { control: 'text', description: 'Card heading.' },
    subtitle: { control: 'text', description: 'Subtitle below the heading.' },
    elevated: { control: 'boolean', description: 'Show an elevated shadow.' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Elevated: Story = {
  args: { elevated: true },
};

export const HeadlessBody: Story = {
  args: { title: undefined, subtitle: undefined, children: 'A card without a heading.' },
};
