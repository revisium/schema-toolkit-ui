import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn, userEvent } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../shared';
import { simpleSchema, markdownSchema } from '../schemas';
import {
  editStringField,
  editNumberField,
  selectBoolean,
  expectFieldValue,
  expandField,
} from './test-utils';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/E2E/PrimitiveEditing',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const EditStringField: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={simpleSchema} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await editStringField(canvas, 'name', 'John Doe');
    await expectFieldValue(canvas, 'name', 'John Doe');
  },
};

export const EditNumberField: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={simpleSchema} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await editNumberField(canvas, 'age', '25');
    await expectFieldValue(canvas, 'age', '25');
  },
};

export const EditBooleanField: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={simpleSchema} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await selectBoolean(canvas, 'active', true);

    await waitFor(() => {
      const editor = canvas.getByTestId('active-editor');
      expect(editor).toHaveTextContent('true');
    });
  },
};

export const EditMultipleFields: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={simpleSchema} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await editStringField(canvas, 'name', 'Alice');
    await editStringField(canvas, 'email', 'alice@test.com');
    await editNumberField(canvas, 'age', '30');

    await expectFieldValue(canvas, 'name', 'Alice');
    await expectFieldValue(canvas, 'email', 'alice@test.com');
    await expectFieldValue(canvas, 'age', '30');
  },
};

export const EditMarkdownField: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={markdownSchema} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expandField(canvas, 'content');

    const editor = await canvas.findByTestId('content-editor');
    expect(editor).toBeInTheDocument();

    await userEvent.click(editor);
    await userEvent.type(editor, '# Hello World');
    editor.blur();

    await waitFor(() => {
      expect(editor).toHaveValue('# Hello World');
    });
  },
};
