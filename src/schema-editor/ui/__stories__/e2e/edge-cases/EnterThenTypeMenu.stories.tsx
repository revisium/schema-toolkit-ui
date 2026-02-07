import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor, fn, screen } from 'storybook/test';
import { CreatingStoryWrapper, creatingBaseMeta } from '../../shared';
import { emptyObjectSchema } from '../../schemas';

const meta: Meta<typeof CreatingStoryWrapper> = {
  ...creatingBaseMeta,
  title: 'SchemaEditor/E2E/EdgeCases/EnterThenTypeMenu',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof CreatingStoryWrapper>;

export const TypeMenuStaysOpenAfterEnterCreatedField: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId=""
      hint="E2E: Type menu should stay open after field created via Enter"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for root field to appear and be focused
    await waitFor(() => {
      expect(canvas.queryByTestId('root')).toBeInTheDocument();
    });

    const rootField = canvas.getByTestId('root');
    await waitFor(() => {
      expect(rootField).toHaveFocus();
    });

    // Type table name
    await userEvent.type(rootField, 'users');
    await expect(rootField).toHaveTextContent('users');

    // Press Enter to create a new field
    await userEvent.keyboard('{Enter}');

    // Wait for the new field to appear and be focused
    await waitFor(() => {
      expect(canvas.queryByTestId('root-0')).toBeInTheDocument();
    });

    const newField = canvas.getByTestId('root-0');
    await waitFor(() => {
      expect(newField).toHaveFocus();
    });

    // Type field name
    await userEvent.type(newField, 'name');
    await expect(newField).toHaveTextContent('name');

    // Click on the type selector button to open the type menu
    const typeButton = await canvas.findByTestId('root-0-select-type-button');
    await userEvent.click(typeButton);

    // Wait for any deferred focus returns to fire (setTimeout(0) in deferReturnFocus)
    await new Promise((r) => setTimeout(r, 50));

    // The type menu should still be open and visible after the delay
    const menuOption = screen.queryByTestId('root-0-menu-type-String');
    await expect(menuOption).toBeInTheDocument();

    // Select Number type to verify the menu is fully functional
    const numberOption = screen.getByTestId('root-0-menu-type-Number');
    await userEvent.click(numberOption);

    // Verify type changed
    await waitFor(async () => {
      const typeLabel = canvas.getByTestId('root-0-select-type-button');
      await expect(typeLabel).toHaveTextContent('number');
    });
  },
};
