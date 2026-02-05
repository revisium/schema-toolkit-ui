import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn, screen, userEvent } from 'storybook/test';
import { CreatingStoryWrapper, creatingBaseMeta } from '../../shared';
import { emptyObjectSchema } from '../../schemas';
import {
  addField,
  changeType,
  setFormula,
  setDescription,
  setDefaultValue,
  setBooleanDefaultValue,
  selectForeignKey,
  changeArrayItemsType,
  setArrayItemsFormula,
  setArrayItemsDescription,
  clickCreateTableButton,
  confirmCreateTable,
  expandField,
  expectCollapsed,
  expectExpanded,
  expectReadonly,
  expectTypeLabel,
  expectDragIcon,
  expectNoDragIcon,
} from '../test-utils';

const meta: Meta<typeof CreatingStoryWrapper> = {
  ...creatingBaseMeta,
  title: 'V3/SchemaEditor/E2E/Creating',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof CreatingStoryWrapper>;

/**
 * E2E Test: Create a complex schema with:
 * - All primitive types (string, number, boolean)
 * - Nested objects
 * - Arrays (of primitives and objects)
 * - Foreign keys
 * - Formulas with dependencies
 * - Descriptions
 * - Default values
 */
export const ComplexSchemaWithAllFeatures: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="orders"
      hint="E2E Test: Create complex schema with all features"
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // ============ ADD PRIMITIVE FIELDS ============

    // 1. Add "id" field (string) with description
    await addField(canvas, 'root', 'id');
    await setDescription(canvas, 'root-0', 'Unique order identifier');

    // Verify: first field has no drag icon (no object to move to)
    await expectNoDragIcon(canvas, 'root-0');

    // 2. Add "price" field (number) with default value
    await addField(canvas, 'root', 'price');
    await changeType(canvas, 'root-1', 'Number');
    await setDefaultValue(canvas, 'root-1', '100');

    // 3. Add "quantity" field (number) with default value
    await addField(canvas, 'root', 'quantity');
    await changeType(canvas, 'root-2', 'Number');
    await setDefaultValue(canvas, 'root-2', '1');

    // 4. Add "isActive" field (boolean) with default value true
    await addField(canvas, 'root', 'isActive');
    await changeType(canvas, 'root-3', 'Boolean');
    await setBooleanDefaultValue(canvas, 'root-3', true);

    // ============ ADD COMPUTED FIELDS WITH FORMULAS ============

    // 5. Add "total" field (number) with formula = price * quantity
    await addField(canvas, 'root', 'total');
    await changeType(canvas, 'root-4', 'Number');
    await setFormula(canvas, 'root-4', 'price * quantity');

    // 6. Add "inStock" field (boolean) with formula = quantity > 0
    await addField(canvas, 'root', 'inStock');
    await changeType(canvas, 'root-5', 'Boolean');
    await setFormula(canvas, 'root-5', 'quantity > 0');

    // 7. Add "summary" field (string) with formula using concat
    await addField(canvas, 'root', 'summary');
    // String is default type, no need to change
    await setFormula(canvas, 'root-6', 'concat("Order: ", id)');

    // ============ ADD NESTED OBJECT ============

    // 8. Add "customer" object with nested fields
    await addField(canvas, 'root', 'customer');
    await changeType(canvas, 'root-7', 'Object');

    // Verify: after creating object, other fields now have drag icon
    await expectDragIcon(canvas, 'root-0');
    // Verify: object itself has no drag icon (only one drop target - itself)
    await expectNoDragIcon(canvas, 'root-7');

    // Add nested fields to customer object
    await waitFor(() =>
      expect(
        canvas.getByTestId('root-7-create-field-button'),
      ).toBeInTheDocument(),
    );

    // Add "name" inside customer with description
    await addField(canvas, 'root-7', 'name');
    await setDescription(canvas, 'root-7-0', 'Customer full name');

    // Add "email" inside customer with default value
    await addField(canvas, 'root-7', 'email');
    await setDefaultValue(canvas, 'root-7-1', 'user@example.com');

    // ============ ADD ARRAY OF PRIMITIVES ============

    // 9. Add "tags" array of strings with items description and formula
    await addField(canvas, 'root', 'tags');
    await changeType(canvas, 'root-8', 'Array');
    await setArrayItemsDescription(canvas, 'root-8', 'Tag value');
    await setArrayItemsFormula(canvas, 'root-8', 'upper(id)');

    // Verify array was created
    await waitFor(async () => {
      const typeLabels = canvas.getAllByTestId('root-8-select-type-button');
      const hasArrayType = typeLabels.some((el) => el.textContent === 'array');
      await expect(hasArrayType).toBe(true);
    });

    // 10. Add "scores" array of numbers with items formula
    await addField(canvas, 'root', 'scores');
    await changeType(canvas, 'root-9', 'Array');
    await changeArrayItemsType(canvas, 'root-9', 'Number');
    await setArrayItemsFormula(canvas, 'root-9', 'round(random() * 5)');

    // 11. Add "flags" array of booleans with items description and formula
    await addField(canvas, 'root', 'flags');
    await changeType(canvas, 'root-10', 'Array');
    await changeArrayItemsType(canvas, 'root-10', 'Boolean');
    await setArrayItemsDescription(canvas, 'root-10', 'Flag value');
    await setArrayItemsFormula(canvas, 'root-10', 'isActive');

    // ============ ADD ARRAY OF OBJECTS ============

    // 12. Add "items" array of objects
    await addField(canvas, 'root', 'items');
    await changeType(canvas, 'root-11', 'Array');

    // Change array items type to Object
    await waitFor(async () => {
      const typeButtons = canvas.getAllByTestId('root-11-select-type-button');
      await expect(typeButtons.length).toBeGreaterThanOrEqual(2);
    });

    await changeArrayItemsType(canvas, 'root-11', 'Object');

    // Add fields inside array items object
    await waitFor(() =>
      expect(
        canvas.getByTestId('root-11-0-create-field-button'),
      ).toBeInTheDocument(),
    );

    // Add "productId" field inside items[*]
    await addField(canvas, 'root-11-0', 'productId');

    // Add "amount" field inside items[*] with default value
    await addField(canvas, 'root-11-0', 'amount');
    await changeType(canvas, 'root-11-0-1', 'Number');
    await setDefaultValue(canvas, 'root-11-0-1', '1');

    // ============ ADD FOREIGN KEY ============

    // 13. Add "categoryId" foreign key with description
    await addField(canvas, 'root', 'categoryId');
    await changeType(canvas, 'root-12', 'ForeignKeyString');
    await selectForeignKey(canvas, 'root-12', 'categories');
    await setDescription(canvas, 'root-12', 'Reference to categories table');

    // ============ ADD SYSTEM FIELDS ============

    // 14. Add "sysId" system field (RowId)
    await addField(canvas, 'root', 'sysId');
    await changeType(canvas, 'root-13', 'RowId');
    await expectTypeLabel(canvas, 'root-13', 'id');

    // 15. Add "sysCreatedId" system field (RowCreatedId)
    await addField(canvas, 'root', 'sysCreatedId');
    await changeType(canvas, 'root-14', 'RowCreatedId');
    await expectTypeLabel(canvas, 'root-14', 'createdId');

    // 16. Add "sysVersionId" system field (RowVersionId)
    await addField(canvas, 'root', 'sysVersionId');
    await changeType(canvas, 'root-15', 'RowVersionId');
    await expectTypeLabel(canvas, 'root-15', 'versionId');

    // 17. Add "sysCreatedAt" system field (RowCreatedAt)
    await addField(canvas, 'root', 'sysCreatedAt');
    await changeType(canvas, 'root-16', 'RowCreatedAt');
    await expectTypeLabel(canvas, 'root-16', 'createdAt');

    // 18. Add "sysPublishedAt" system field (RowPublishedAt)
    await addField(canvas, 'root', 'sysPublishedAt');
    await changeType(canvas, 'root-17', 'RowPublishedAt');
    await expectTypeLabel(canvas, 'root-17', 'publishedAt');

    // 19. Add "sysUpdatedAt" system field (RowUpdatedAt)
    await addField(canvas, 'root', 'sysUpdatedAt');
    await changeType(canvas, 'root-18', 'RowUpdatedAt');
    await expectTypeLabel(canvas, 'root-18', 'updatedAt');

    // 20. Add "sysHash" system field (RowHash)
    await addField(canvas, 'root', 'sysHash');
    await changeType(canvas, 'root-19', 'RowHash');
    await expectTypeLabel(canvas, 'root-19', 'hash');

    // 21. Add "sysSchemaHash" system field (RowSchemaHash)
    await addField(canvas, 'root', 'sysSchemaHash');
    await changeType(canvas, 'root-20', 'RowSchemaHash');
    await expectTypeLabel(canvas, 'root-20', 'schemaHash');

    // 22. Add "avatar" File field with description
    await addField(canvas, 'root', 'avatar');
    await changeType(canvas, 'root-21', 'File');

    // Verify File shows ref label, not "object"
    await expectTypeLabel(canvas, 'root-21', 'File');

    // Verify File ref field can have description added
    await setDescription(canvas, 'root-21', 'User avatar image');

    // Verify File field is collapsed by default
    await expectCollapsed(canvas, 'root-21');

    // Expand File field
    await expandField(canvas, 'root-21');
    await expectExpanded(canvas, 'root-21');

    // Verify File children are readonly (check first child - status)
    await expectReadonly(canvas, 'root-21-0');

    // ============ ADD ARRAY OF FILES ============

    // 23. Add "attachments" array of File refs
    await addField(canvas, 'root', 'attachments');
    await changeType(canvas, 'root-22', 'Array');

    // Wait for array to be created with items type button
    await waitFor(async () => {
      const typeButtons = canvas.getAllByTestId('root-22-select-type-button');
      await expect(typeButtons.length).toBeGreaterThanOrEqual(2);
    });

    // Change array items type from string to File via submenu
    await changeArrayItemsType(canvas, 'root-22', 'File');

    // Verify items type shows "File" label
    // Note: ArrayItemsView uses parent's dataTestId for the type button
    await waitFor(async () => {
      const typeButtons = canvas.getAllByTestId('root-22-select-type-button');
      const itemsTypeButton = typeButtons.find(
        (btn: HTMLElement) => btn.textContent !== 'array',
      );
      await expect(itemsTypeButton?.textContent).toBe('File');
    });

    // ============ ADD ARRAY OF FOREIGN KEYS ============

    // 24. Add "relatedProductIds" array of foreign keys
    await addField(canvas, 'root', 'relatedProductIds');
    await changeType(canvas, 'root-23', 'Array');

    // Wait for array to be created with items type button
    await waitFor(async () => {
      const typeButtons = canvas.getAllByTestId('root-23-select-type-button');
      await expect(typeButtons.length).toBeGreaterThanOrEqual(2);
    });

    // Change array items type from string to ForeignKeyString
    await changeArrayItemsType(canvas, 'root-23', 'ForeignKeyString');

    // Verify items type shows "ForeignKey" label
    await waitFor(async () => {
      const typeButtons = canvas.getAllByTestId('root-23-select-type-button');
      const itemsTypeButton = typeButtons.find(
        (btn: HTMLElement) => btn.textContent !== 'array',
      );
      await expect(itemsTypeButton?.textContent).toBe('ForeignKey');
    });

    // Select the foreign key table for items
    // ForeignKeyValue is rendered in ArrayItemsChildren with dataTestId = root-23-0
    const connectButton = await canvas.findByTestId(
      'root-23-0-connect-foreign-key',
    );
    await userEvent.click(connectButton);

    await waitFor(async () => {
      const tableButton = screen.getByRole('button', { name: 'products' });
      await expect(tableButton).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'products' }));

    // ============ ADD MARKDOWN FIELD ============

    // 25. Add "description" markdown field
    await addField(canvas, 'root', 'description');
    await changeType(canvas, 'root-24', 'Markdown');

    // Verify Markdown shows "Markdown" label
    await expectTypeLabel(canvas, 'root-24', 'Markdown');

    // Verify Markdown field can have description added
    await setDescription(canvas, 'root-24', 'Rich text description');

    // ============ CREATE TABLE ============

    await clickCreateTableButton(canvas);

    // Wait for dialog
    await waitFor(() =>
      expect(screen.getByText('Create Table "orders"')).toBeInTheDocument(),
    );

    await confirmCreateTable();

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
        id: {
          type: 'string',
          default: '',
          description: 'Unique order identifier',
        },
        price: { type: 'number', default: 100 },
        quantity: { type: 'number', default: 1 },
        isActive: { type: 'boolean', default: true },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * quantity' },
        },
        inStock: {
          type: 'boolean',
          default: false,
          readOnly: true,
          'x-formula': { version: 1, expression: 'quantity > 0' },
        },
        summary: {
          type: 'string',
          default: '',
          readOnly: true,
          'x-formula': { version: 1, expression: 'concat("Order: ", id)' },
        },
        customer: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              default: '',
              description: 'Customer full name',
            },
            email: { type: 'string', default: 'user@example.com' },
          },
          additionalProperties: false,
          required: ['name', 'email'],
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
            default: '',
            description: 'Tag value',
            readOnly: true,
            'x-formula': { version: 1, expression: 'upper(../id)' },
          },
        },
        scores: {
          type: 'array',
          items: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': { version: 1, expression: 'round(random() * 5)' },
          },
        },
        flags: {
          type: 'array',
          items: {
            type: 'boolean',
            default: false,
            description: 'Flag value',
            readOnly: true,
            'x-formula': { version: 1, expression: '../isActive' },
          },
        },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              productId: { type: 'string', default: '' },
              amount: { type: 'number', default: 1 },
            },
            additionalProperties: false,
            required: ['productId', 'amount'],
          },
        },
        categoryId: {
          foreignKey: 'categories',
          type: 'string',
          default: '',
          description: 'Reference to categories table',
        },
        sysId: {
          $ref: 'urn:jsonschema:io:revisium:row-id-schema:1.0.0',
        },
        sysCreatedId: {
          $ref: 'urn:jsonschema:io:revisium:row-created-id-schema:1.0.0',
        },
        sysVersionId: {
          $ref: 'urn:jsonschema:io:revisium:row-version-id-schema:1.0.0',
        },
        sysCreatedAt: {
          $ref: 'urn:jsonschema:io:revisium:row-created-at-schema:1.0.0',
        },
        sysPublishedAt: {
          $ref: 'urn:jsonschema:io:revisium:row-published-at-schema:1.0.0',
        },
        sysUpdatedAt: {
          $ref: 'urn:jsonschema:io:revisium:row-updated-at-schema:1.0.0',
        },
        sysHash: {
          $ref: 'urn:jsonschema:io:revisium:row-hash-schema:1.0.0',
        },
        sysSchemaHash: {
          $ref: 'urn:jsonschema:io:revisium:row-schema-hash-schema:1.0.0',
        },
        avatar: {
          $ref: 'urn:jsonschema:io:revisium:file-schema:1.0.0',
          description: 'User avatar image',
        },
        attachments: {
          type: 'array',
          items: {
            $ref: 'urn:jsonschema:io:revisium:file-schema:1.0.0',
          },
        },
        relatedProductIds: {
          type: 'array',
          items: {
            foreignKey: 'products',
            type: 'string',
            default: '',
          },
        },
        description: {
          type: 'string',
          default: '',
          contentMediaType: 'text/markdown',
          description: 'Rich text description',
        },
      },
      additionalProperties: false,
      required: [
        'id',
        'price',
        'quantity',
        'isActive',
        'total',
        'inStock',
        'summary',
        'customer',
        'tags',
        'scores',
        'flags',
        'items',
        'categoryId',
        'sysId',
        'sysCreatedId',
        'sysVersionId',
        'sysCreatedAt',
        'sysPublishedAt',
        'sysUpdatedAt',
        'sysHash',
        'sysSchemaHash',
        'avatar',
        'attachments',
        'relatedProductIds',
        'description',
      ],
    });
  },
};
