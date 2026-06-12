import type { Meta, StoryObj } from '@vellum/react';
import { Slider } from './Slider.js';

const meta: Meta<typeof Slider> = {
  title: 'Inputs/Slider',
  component: Slider,
  args: { value: 40, max: 100, label: 'Volume', tone: 'accent' },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100, step: 1 }, description: 'Current value.' },
    max: { control: { type: 'range', min: 10, max: 200, step: 10 }, description: 'Max value.' },
    label: { control: 'text', description: 'Visible label.' },
    tone: { control: 'inline-radio', options: ['accent', 'neutral'], description: 'Tonal accent.' },
  },
  decorators: [
    (Story) => (
      <div
        style={{
          padding: 20,
          background: 'color-mix(in oklab, var(--vellum-color-accent) 6%, transparent)',
          borderRadius: 'var(--vellum-radius-md)',
        }}
      >
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FullBar: Story = {
  args: { value: 100, label: 'Loaded' },
  play: ({ canvasElement }) => {
    const bar = canvasElement.querySelector('[role="progressbar"]');
    if (bar) bar.setAttribute('data-vellum-played', 'true');
  },
};

export const Quiet: Story = {
  args: { value: 8, tone: 'neutral', label: 'Brightness' },
};

export const Experimental: Story = {
  args: { value: 50, label: 'Hidden from sidebar' },
  tags: ['hidden'],
};
