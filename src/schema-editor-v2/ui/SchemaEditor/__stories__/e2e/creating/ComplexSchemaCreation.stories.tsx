import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor, fn, screen } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../../shared';
import { emptyObjectSchema } from '../../schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'V2/SchemaEditor/E2E/Creating',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

/**
 * E2E Test: Create a complex schema with:
 * - All primitive types (string, number, boolean)
 * - Nested objects
 * - Arrays (of primitives and objects)
 * - Foreign keys
 * - Formulas with dependencies
 */
export const ComplexSchemaWithAllFeatures: Story = {
  args: {
    onCreateTable: fn(),
    onApplyChanges: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      mode="creating"
      tableId="orders"
      hint="E2E Test: Create complex schema with all features"
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const addButton = () => canvas.findByTestId('root-create-field-button');

    // ============ ADD PRIMITIVE FIELDS ============

    // 1. Add "id" field (string)
    await userEvent.click(await addButton());
    await waitFor(() =>
      expect(canvas.getByTestId('root-0')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-0'), 'id');

    // 2. Add "price" field (number)
    await userEvent.click(await addButton());
    await waitFor(() =>
      expect(canvas.getByTestId('root-1')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-1'), 'price');
    await userEvent.click(
      await canvas.findByTestId('root-1-select-type-button'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('root-1-menu-type-Number')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('root-1-menu-type-Number'));

    // 3. Add "quantity" field (number)
    await userEvent.click(await addButton());
    await waitFor(() =>
      expect(canvas.getByTestId('root-2')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-2'), 'quantity');
    await userEvent.click(
      await canvas.findByTestId('root-2-select-type-button'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('root-2-menu-type-Number')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('root-2-menu-type-Number'));

    // 4. Add "isActive" field (boolean)
    await userEvent.click(await addButton());
    await waitFor(() =>
      expect(canvas.getByTestId('root-3')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-3'), 'isActive');
    await userEvent.click(
      await canvas.findByTestId('root-3-select-type-button'),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('root-3-menu-type-Boolean'),
      ).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('root-3-menu-type-Boolean'));

    // ============ ADD COMPUTED FIELD WITH FORMULA ============

    // 5. Add "total" field with formula = price * quantity
    await userEvent.click(await addButton());
    await waitFor(() =>
      expect(canvas.getByTestId('root-4')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-4'), 'total');
    await userEvent.click(
      await canvas.findByTestId('root-4-select-type-button'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('root-4-menu-type-Number')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('root-4-menu-type-Number'));

    // Open settings and set formula
    const settingsButton = await canvas.findByTestId('root-4-setting-button');
    await userEvent.click(settingsButton);

    await waitFor(() =>
      expect(screen.getByText(/Formula/i)).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByText(/Formula/i));

    // Wait for formula input and type formula
    await waitFor(() =>
      expect(
        screen.getByPlaceholderText(/price \* quantity/i),
      ).toBeInTheDocument(),
    );
    const formulaInput = screen.getByPlaceholderText(/price \* quantity/i);
    await userEvent.type(formulaInput, 'price * quantity');

    // Close settings by clicking outside
    await userEvent.click(document.body);

    // ============ ADD NESTED OBJECT ============

    // 6. Add "customer" object with nested fields
    await userEvent.click(await addButton());
    await waitFor(() =>
      expect(canvas.getByTestId('root-5')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-5'), 'customer');
    await userEvent.click(
      await canvas.findByTestId('root-5-select-type-button'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('root-5-menu-type-Object')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('root-5-menu-type-Object'));

    // Add nested fields to customer object
    await waitFor(() =>
      expect(
        canvas.getByTestId('root-5-create-field-button'),
      ).toBeInTheDocument(),
    );

    // Add "name" inside customer
    await userEvent.click(canvas.getByTestId('root-5-create-field-button'));
    await waitFor(() =>
      expect(canvas.getByTestId('root-5-0')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-5-0'), 'name');

    // Add "email" inside customer
    await userEvent.click(canvas.getByTestId('root-5-create-field-button'));
    await waitFor(() =>
      expect(canvas.getByTestId('root-5-1')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-5-1'), 'email');

    // ============ ADD ARRAY OF PRIMITIVES ============

    // 7. Add "tags" array of strings
    await userEvent.click(await addButton());
    await waitFor(() =>
      expect(canvas.getByTestId('root-6')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-6'), 'tags');
    await userEvent.click(
      await canvas.findByTestId('root-6-select-type-button'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('root-6-menu-type-Array')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('root-6-menu-type-Array'));

    // Verify array was created
    await waitFor(async () => {
      const typeLabels = canvas.getAllByTestId('root-6-select-type-button');
      const hasArrayType = typeLabels.some((el) => el.textContent === 'array');
      await expect(hasArrayType).toBe(true);
    });

    // ============ ADD ARRAY OF OBJECTS ============

    // 8. Add "items" array of objects
    await userEvent.click(await addButton());
    await waitFor(() =>
      expect(canvas.getByTestId('root-7')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-7'), 'items');
    await userEvent.click(
      await canvas.findByTestId('root-7-select-type-button'),
    );
    await waitFor(() =>
      expect(screen.getByTestId('root-7-menu-type-Array')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('root-7-menu-type-Array'));

    // Change array items type to Object
    await waitFor(async () => {
      const typeButtons = canvas.getAllByTestId('root-7-select-type-button');
      await expect(typeButtons.length).toBeGreaterThanOrEqual(2);
    });

    // Find items type button (the one showing "string", not "array")
    const itemsTypeButtons = canvas.getAllByTestId('root-7-select-type-button');
    const itemsTypeButton = itemsTypeButtons.find(
      (btn) => btn.textContent === 'string',
    );
    if (itemsTypeButton) {
      await userEvent.click(itemsTypeButton);
      await waitFor(() =>
        expect(
          screen.getByTestId('root-7-menu-type-Object'),
        ).toBeInTheDocument(),
      );
      await userEvent.click(screen.getByTestId('root-7-menu-type-Object'));
    }

    // Add fields inside array items object
    await waitFor(() =>
      expect(
        canvas.getByTestId('root-7-0-create-field-button'),
      ).toBeInTheDocument(),
    );

    // Add "productId" field inside items[*]
    await userEvent.click(canvas.getByTestId('root-7-0-create-field-button'));
    await waitFor(() =>
      expect(canvas.getByTestId('root-7-0-0')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-7-0-0'), 'productId');

    // Add "amount" field inside items[*]
    await userEvent.click(canvas.getByTestId('root-7-0-create-field-button'));
    await waitFor(() =>
      expect(canvas.getByTestId('root-7-0-1')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-7-0-1'), 'amount');
    await userEvent.click(
      await canvas.findByTestId('root-7-0-1-select-type-button'),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('root-7-0-1-menu-type-Number'),
      ).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId('root-7-0-1-menu-type-Number'));

    // ============ ADD FOREIGN KEY ============

    // 9. Add "categoryId" foreign key
    await userEvent.click(await addButton());
    await waitFor(() =>
      expect(canvas.getByTestId('root-8')).toBeInTheDocument(),
    );
    await userEvent.type(canvas.getByTestId('root-8'), 'categoryId');
    await userEvent.click(
      await canvas.findByTestId('root-8-select-type-button'),
    );
    await waitFor(() =>
      expect(
        screen.getByTestId('root-8-menu-type-ForeignKeyString'),
      ).toBeInTheDocument(),
    );
    await userEvent.click(
      screen.getByTestId('root-8-menu-type-ForeignKeyString'),
    );

    // Select foreign key table
    await waitFor(() =>
      expect(
        canvas.getByTestId('root-8-connect-foreign-key'),
      ).toBeInTheDocument(),
    );
    await userEvent.click(canvas.getByTestId('root-8-connect-foreign-key'));

    // Select "categories" table from dialog
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'categories' }),
      ).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'categories' }));

    // ============ CREATE TABLE ============

    // Click Create Table button
    await userEvent.click(
      await canvas.findByTestId('schema-editor-create-button'),
    );

    // Wait for dialog and confirm
    await waitFor(() =>
      expect(screen.getByText('Create Table "orders"')).toBeInTheDocument(),
    );

    await userEvent.click(screen.getByRole('button', { name: 'Create Table' }));

    // Verify callback was called with correct data
    await waitFor(async () => {
      await expect(args.onCreateTable).toHaveBeenCalled();
    });

    // Verify schema structure
    const callArgs = (args.onCreateTable as ReturnType<typeof fn>).mock
      .calls[0][0] as { tableId: string; schema: object };

    await expect(callArgs.tableId).toBe('orders');
    await expect(callArgs.schema).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string', default: '' },
        price: { type: 'number', default: 0 },
        quantity: { type: 'number', default: 0 },
        isActive: { type: 'boolean', default: false },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * quantity' },
        },
        customer: {
          type: 'object',
          properties: {
            name: { type: 'string', default: '' },
            email: { type: 'string', default: '' },
          },
          additionalProperties: false,
          required: ['name', 'email'],
        },
        tags: {
          type: 'array',
          items: { type: 'string', default: '' },
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string', default: '' },
              amount: { type: 'number', default: 0 },
            },
            additionalProperties: false,
            required: ['productId', 'amount'],
          },
        },
        categoryId: {
          foreignKey: 'categories',
          type: 'string',
          default: '',
        },
      },
      additionalProperties: false,
      required: [
        'id',
        'price',
        'quantity',
        'isActive',
        'total',
        'customer',
        'tags',
        'items',
        'categoryId',
      ],
    });
  },
};
