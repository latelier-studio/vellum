import type { Meta, StoryObj } from '@vellum/react';
import { Article } from './Article.js';

const meta: Meta<typeof Article> = {
  title: 'Editorial/Article',
  component: Article,
  args: {
    kicker: 'Field Notes',
    title: 'The long-form return',
    byline: 'Eli Carter',
    issue: 'Issue 04',
  },
  argTypes: {
    kicker: { control: 'text', description: 'Section label.' },
    title: { control: 'text', description: 'Headline.' },
    byline: { control: 'text', description: 'Author.' },
    issue: { control: 'text', description: 'Issue tag.' },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Cover: Story = {};

export const Essay: Story = {
  args: {
    kicker: 'Essay',
    title: 'When chrome wears your tokens',
    byline: 'V. Studio',
    issue: 'Vol. 01',
  },
};
