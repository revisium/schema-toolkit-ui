import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor, fn, screen } from 'storybook/test';
import { UpdatingStoryWrapper, updatingBaseMeta } from '../../shared';
import { simpleSchema } from '../../schemas';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'SchemaEditor/E2E/Updating/BasicInteractions',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

export const ApplyChangesToExistingSchema: Story = {
  args: {
    onApplyChanges: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="products"
      hint="Test: Modify existing schema and apply changes"
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Add a new field to existing schema
    const addButton = await canvas.findByTestId('root-create-field-button');
    await userEvent.click(addButton);

    await waitFor(async () => {
      const newField = canvas.getByTestId('root-4');
      await expect(newField).toBeInTheDocument();
    });

    const newField = canvas.getByTestId('root-4');
    await userEvent.type(newField, 'category');

    // Click "Apply Changes" button
    const applyButton = await canvas.findByTestId(
      'schema-editor-approve-button',
    );
    await userEvent.click(applyButton);

    // Wait for dialog to open (dialog is in Portal, use screen)
    await waitFor(async () => {
      const dialogTitle = screen.getByText('Review Changes for "products"');
      await expect(dialogTitle).toBeInTheDocument();
    });

    // Verify the change is shown in dialog (dialog is in Portal, use screen)
    // Look for "was added" text which is specific to the dialog change description
    await waitFor(async () => {
      const changeText = screen.getByText(/was added/);
      await expect(changeText).toBeInTheDocument();
    });

    // Click Apply Changes button in dialog (dialog is in Portal, use screen)
    const dialogApplyButton = screen.getByRole('button', {
      name: /Apply Changes/,
    });
    await userEvent.click(dialogApplyButton);

    // Verify onApplyChanges was called
    await waitFor(async () => {
      await expect(args.onApplyChanges).toHaveBeenCalled();
    });
  },
};
