import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn, userEvent } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../shared';
import { simpleSchema } from '../schemas';
import { editStringField, expectFieldValue } from './test-utils';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/E2E/CommitRevert',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const SaveDisabledInitially: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={simpleSchema} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const saveButton = await canvas.findByRole('button', { name: /Save/ });
    const revertButton = canvas.getByRole('button', { name: /Revert/ });

    await expect(saveButton).toBeDisabled();
    await expect(revertButton).toBeDisabled();
  },
};

export const SaveEnabledAfterEdit: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={simpleSchema} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await editStringField(canvas, 'name', 'Test');

    await waitFor(() => {
      const saveButton = canvas.getByRole('button', { name: /Save/ });
      expect(saveButton).not.toBeDisabled();
    });

    const revertButton = canvas.getByRole('button', { name: /Revert/ });
    await expect(revertButton).not.toBeDisabled();
  },
};

export const RevertRestoresValues: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={simpleSchema}
      initialValue={{ name: 'Original', email: '', age: 0, active: false }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectFieldValue(canvas, 'name', 'Original');
    await editStringField(canvas, 'name', 'Changed');
    await expectFieldValue(canvas, 'name', 'Changed');

    const revertButton = canvas.getByRole('button', { name: /Revert/ });
    await userEvent.click(revertButton);

    await expectFieldValue(canvas, 'name', 'Original');

    await waitFor(() => {
      const saveButton = canvas.getByRole('button', { name: /Save/ });
      expect(saveButton).toBeDisabled();
    });
  },
};

export const SaveCommitsAndDisables: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => <StoryWrapper {...args} schema={simpleSchema} />,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await editStringField(canvas, 'name', 'Saved Value');

    const saveButton = canvas.getByRole('button', { name: /Save/ });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(args.onSave).toHaveBeenCalled();
    });

    await waitFor(() => {
      const saveBtn = canvas.getByRole('button', { name: /Save/ });
      expect(saveBtn).toBeDisabled();
    });
  },
};
