import type { Meta, StoryObj } from '@vellum/react';
import { Badge } from './Badge.js';

const meta: Meta<typeof Badge> = {
  title: 'Data Display/Badge',
  component: Badge,
  args: { status: 'production' },
  argTypes: {
    status: { control: 'select', options: ['production', 'preview', 'building', 'error'], description: 'Deployment status.' },
    children: { control: 'text', description: 'Label override.' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Production: Story = {};
export const Preview: Story = { args: { status: 'preview' } };
export const Building: Story = { args: { status: 'building' } };
export const Error: Story = { args: { status: 'error' } };
