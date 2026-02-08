import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../shared';
import {
  rootStringSchema,
  rootNumberSchema,
  rootBooleanSchema,
  rootArrayOfStringsSchema,
} from '../schemas';
import {
  editStringField,
  editNumberField,
  selectBoolean,
  addArrayItem,
  expectFieldValue,
  expectRowExists,
} from './test-utils';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/E2E/RootTypes',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const RootStringEditing: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper {...args} schema={rootStringSchema} initialValue="Hello" />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await editStringField(canvas, 'root', 'World');
    await expectFieldValue(canvas, 'root', 'World');
  },
};

export const RootNumberEditing: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper {...args} schema={rootNumberSchema} initialValue={42} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await editNumberField(canvas, 'root', '99');
    await expectFieldValue(canvas, 'root', '99');
  },
};

export const RootBooleanEditing: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper {...args} schema={rootBooleanSchema} initialValue={false} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await selectBoolean(canvas, 'root', true);

    await waitFor(() => {
      const editor = canvas.getByTestId('root-editor');
      expect(editor).toHaveTextContent('true');
    });
  },
};

export const RootArrayAddDelete: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={rootArrayOfStringsSchema}
      initialValue={['apple']}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectRowExists(canvas, 'root-0');

    await addArrayItem(canvas, 'root');
    await expectRowExists(canvas, 'root-1');

    await addArrayItem(canvas, 'root');
    await expectRowExists(canvas, 'root-2');

    await waitFor(() => {
      const items = canvas.queryAllByTestId(/^root-\d+$/);
      expect(items).toHaveLength(3);
    });
  },
};
