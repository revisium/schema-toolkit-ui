import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../shared';
import { simpleSchema, arraySchema } from '../schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/E2E/ReadOnlyMode',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const FieldsNotEditable: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={simpleSchema}
      initialValue={{
        name: 'Read Only',
        email: 'ro@test.com',
        age: 25,
        active: false,
      }}
      mode="reading"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const editor = canvas.queryByTestId('name-editor');
      expect(editor).not.toBeInTheDocument();
    });
  },
};

export const NoSaveRevertButtons: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={simpleSchema}
      initialValue={{ name: 'Read Only', email: '', age: 0, active: false }}
      mode="reading"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const saveButton = canvas.queryByRole('button', { name: /Save/ });
      expect(saveButton).not.toBeInTheDocument();
    });

    const revertButton = canvas.queryByRole('button', { name: /Revert/ });
    await expect(revertButton).not.toBeInTheDocument();
  },
};

export const NoAddButton: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{ title: 'Article', tags: ['react'] }}
      mode="reading"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      const addButton = canvas.queryByTestId('tags-add-button');
      expect(addButton).not.toBeInTheDocument();
    });
  },
};
