import type { Meta, StoryObj } from '@vellum/react';
import { StatusPill } from './StatusPill.js';

const meta: Meta<typeof StatusPill> = {
  title: 'Data Display/StatusPill',
  component: StatusPill,
  args: { status: 'todo' },
  argTypes: {
    status: {
      control: 'select',
      options: ['backlog', 'todo', 'in-progress', 'in-review', 'done', 'canceled'],
      description: 'Issue status.',
    },
    children: { control: 'text', description: 'Label override.' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Todo: Story = {};
export const InProgress: Story = { args: { status: 'in-progress' } };
export const InReview: Story = { args: { status: 'in-review' } };
export const Done: Story = { args: { status: 'done' } };
export const Backlog: Story = { args: { status: 'backlog' } };
export const Canceled: Story = { args: { status: 'canceled' } };
