import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn } from 'storybook/test';
import { CreatingStoryWrapper, creatingBaseMeta } from '../../shared';
import { emptyObjectSchema } from '../../schemas';

const meta: Meta<typeof CreatingStoryWrapper> = {
  ...creatingBaseMeta,
  title: 'SchemaEditor/E2E/Creating',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof CreatingStoryWrapper>;

/**
 * Verifies that when creating a table with an empty schema,
 * the root field name input is automatically focused so the user
 * can immediately start typing the table name.
 */
export const EmptySchemaAutoFocus: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId=""
      hint="E2E: Verify auto-focus on root field name in empty schema"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.queryByTestId('root')).toBeInTheDocument();
    });

    const rootField = canvas.getByTestId('root');

    await waitFor(() => {
      expect(rootField).toHaveFocus();
    });
  },
};
