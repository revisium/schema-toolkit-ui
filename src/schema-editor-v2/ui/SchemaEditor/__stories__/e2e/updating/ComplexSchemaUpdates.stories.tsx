import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor, fn, screen } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../../shared';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'V2/SchemaEditor/E2E/Updating',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

const initialSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', default: '' },
    name: { type: 'string', default: '' },
    price: { type: 'number', default: 0 },
  },
  additionalProperties: false,
  required: ['id', 'name', 'price'],
};

/**
 * E2E Test: Schema updates - add field and change type
 */
export const ComplexSchemaUpdates: Story = {
  args: {
    onCreateTable: fn(),
    onApplyChanges: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={initialSchema}
      mode="updating"
      tableId="products"
      hint="E2E Test: Schema updates"
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ============ ADD NEW FIELD ============
    const addButton = await canvas.findByTestId('root-create-field-button');
    await userEvent.click(addButton);
    await waitFor(() =>
      expect(canvas.getByTestId('root-3')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-3'), 'quantity');

    // ============ CHANGE FIELD TYPE ============
    // Change "price" from number to string
    const priceTypeBtn = await canvas.findByTestId('root-2-select-type-button');
    await userEvent.click(priceTypeBtn);
    await waitFor(() =>
      expect(screen.getByTestId('root-2-menu-type-String')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('root-2-menu-type-String'));

    // ============ APPLY CHANGES ============
    await userEvent.click(
      await canvas.findByTestId('schema-editor-approve-button'),
    );

    // Wait for dialog
    await waitFor(() =>
      expect(
        screen.getByText('Review Changes for "products"'),
      ).toBeInTheDocument(),
    );

    // Confirm changes
    await userEvent.click(
      screen.getByRole('button', { name: /Apply Changes/ }),
    );

    // Verify callback
    await waitFor(async () => {
      await expect(args.onApplyChanges).toHaveBeenCalled();
    });

    // Verify patches
    const callArgs = (args.onApplyChanges as ReturnType<typeof fn>).mock
      .calls[0][0] as {
      tableId: string;
      patches: unknown[];
      jsonPatches: unknown[];
    };
    await expect(callArgs.tableId).toBe('products');

    // Verify JSON patches contain expected operations
    // Note: /required is not patched - it's handled automatically on backend
    await expect(callArgs.jsonPatches).toEqual([
      {
        op: 'replace',
        path: '/properties/price',
        value: { type: 'string', default: '' },
      },
      {
        op: 'add',
        path: '/properties/quantity',
        value: { type: 'string', default: '' },
      },
    ]);
  },
};
