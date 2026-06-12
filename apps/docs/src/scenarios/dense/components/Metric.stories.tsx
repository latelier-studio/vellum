import type { Meta, StoryObj } from '@vellum/react';
import { Metric } from './Metric.js';

const meta: Meta<typeof Metric> = {
  title: 'Dashboard/Metric',
  component: Metric,
  args: { label: 'Active sessions', value: '1,284', delta: '+12.4%', trend: 'up' },
  argTypes: {
    label: { control: 'text', description: 'Metric label.' },
    value: { control: 'text', description: 'Current value (formatted).' },
    delta: { control: 'text', description: 'Delta vs. prior period.' },
    trend: { control: 'inline-radio', options: ['up', 'down', 'flat'], description: 'Delta direction.' },
    unit: { control: 'text', description: 'Optional unit suffix.' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Sessions: Story = {};
export const Revenue: Story = { args: { label: 'MRR', value: '$48.2k', delta: '+8.1%', trend: 'up' } };
export const Errors: Story = { args: { label: 'Error rate', value: '0.23%', delta: '−0.04%', trend: 'down' } };
export const Latency: Story = { args: { label: 'P95 latency', value: '142', unit: 'ms', delta: '+2ms', trend: 'flat' } };
