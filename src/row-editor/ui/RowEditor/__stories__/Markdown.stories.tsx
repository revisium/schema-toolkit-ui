import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import { markdownSchema } from './schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Markdown',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

const SAMPLE_MARKDOWN = `# Welcome

This is a **markdown** field with rich content.

## Features

- Bold text with **asterisks**
- *Italic* text
- \`inline code\`
- [Links](https://example.com)

## Code Block

\`\`\`typescript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

> Blockquote example

1. First item
2. Second item
3. Third item
`;

export const Empty: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={markdownSchema}
      hint="Markdown field renders as a textarea editor. Click to expand."
    />
  ),
};

export const WithContent: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={markdownSchema}
      initialValue={{
        title: 'My Article',
        content: SAMPLE_MARKDOWN,
        summary: 'A short summary of the article.',
      }}
      hint="Markdown field with pre-filled content. Expand to edit."
    />
  ),
};

export const ReadOnly: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={markdownSchema}
      initialValue={{
        title: 'Published Article',
        content: SAMPLE_MARKDOWN,
        summary: 'Read-only mode.',
      }}
      mode="reading"
      hint="Read-only markdown field. Content is visible but not editable."
    />
  ),
};
