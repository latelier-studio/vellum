import type { Meta, StoryObj } from '@vellum/react';
import { Input } from './Input.js';

const meta: Meta<typeof Input> = {
  title: 'Forms/Input',
  component: Input,
  args: {
    placeholder: 'Type here…',
    value: '',
    size: 'md',
    disabled: false,
    invalid: false,
    onChange: () => {},
  },
  argTypes: {
    size: { control: 'select', options: ['sm', 'md', 'lg'], description: 'Size scale.' },
    placeholder: { control: 'text', description: 'Placeholder shown when empty.' },
    value: { control: 'text', description: 'Current value.' },
    disabled: { control: 'boolean', description: 'Disabled state.' },
    invalid: { control: 'boolean', description: 'Error state.' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm', placeholder: 'Small' } };
export const Large: Story = { args: { size: 'lg', placeholder: 'Large' } };
export const Filled: Story = { args: { value: 'orange881217@gmail.com' } };
export const Invalid: Story = { args: { value: 'not an email', invalid: true } };
export const Disabled: Story = { args: { disabled: true, value: 'Read only' } };
