import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor } from 'storybook/test';
import { CreatingStoryWrapper, creatingBaseMeta } from '../../shared';
import { emptyObjectSchema } from '../../schemas';

const meta: Meta<typeof CreatingStoryWrapper> = {
  ...creatingBaseMeta,
  title: 'V3/SchemaEditor/E2E/Creating/ErrorInteractions',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof CreatingStoryWrapper>;

export const ErrorIndicatorInteraction: Story = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="test"
      hint="E2E Test: Create duplicate fields and verify renaming fixes the issue"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Add first field named "myField"
    let addButton = await canvas.findByTestId('root-create-field-button');
    await userEvent.click(addButton);

    await waitFor(() =>
      expect(canvas.getByTestId('root-0')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-0'), 'myField');
    await userEvent.click(document.body);

    // Add second field with same name (duplicate)
    addButton = await canvas.findByTestId('root-create-field-button');
    await userEvent.click(addButton);

    await waitFor(() =>
      expect(canvas.getByTestId('root-1')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-1'), 'myField');
    await userEvent.click(document.body);

    // Verify both fields exist
    await waitFor(() => {
      expect(canvas.getByTestId('root-0').textContent).toBe('myField');
      expect(canvas.getByTestId('root-1').textContent).toBe('myField');
    });

    // Fix the duplicate by renaming the second field
    const field1 = canvas.getByTestId('root-1');
    await userEvent.clear(field1);
    await userEvent.type(field1, 'uniqueField');
    await userEvent.click(document.body);

    // Verify the field was renamed
    await waitFor(() => {
      expect(canvas.getByTestId('root-1').textContent).toBe('uniqueField');
    });

    // Verify first field is still myField
    await waitFor(() => {
      expect(canvas.getByTestId('root-0').textContent).toBe('myField');
    });
  },
};
