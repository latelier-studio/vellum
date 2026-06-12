import type { Meta, StoryObj } from '@vellum/react';
import { Button } from './Button.js';

const meta: Meta<typeof Button> = {
  title: 'Actions/Button',
  component: Button,
  args: { children: 'Deploy', variant: 'primary', size: 'md', onClick: () => {} },
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'destructive'], description: 'Visual variant.' },
    size: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Size.' },
    disabled: { control: 'boolean', description: 'Disabled state.' },
    children: { control: 'text', description: 'Label.' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', children: 'Cancel' } };
export const Destructive: Story = { args: { variant: 'destructive', children: 'Delete project' } };
export const Small: Story = { args: { size: 'sm', children: 'Small' } };
export const Disabled: Story = { args: { disabled: true, children: 'Deploying…' } };
