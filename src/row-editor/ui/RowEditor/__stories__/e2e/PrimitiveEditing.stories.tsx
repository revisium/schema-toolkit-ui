import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../shared';
import { simpleSchema } from '../schemas';
import {
  editStringField,
  editNumberField,
  selectBoolean,
  expectFieldValue,
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
