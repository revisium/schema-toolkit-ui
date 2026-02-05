import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor, fn, screen } from 'storybook/test';
import {
  CreatingStoryWrapper,
  UpdatingStoryWrapper,
  creatingBaseMeta,
} from './shared';
import { emptyObjectSchema, simpleSchema } from './schemas';

const meta: Meta<typeof CreatingStoryWrapper> = {
  ...creatingBaseMeta,
  title: 'V3/SchemaEditor/Interactions',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof CreatingStoryWrapper>;

export const AddFieldAndRename: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="users"
      hint="Test: Add a field and rename it"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click "Field" button to add a new field
    const addButton = await canvas.findByTestId('root-create-field-button');
    await userEvent.click(addButton);

    // Wait for the new field input to appear and type the name
    await waitFor(async () => {
      const fieldInput = canvas.getByTestId('root-0');
      await expect(fieldInput).toBeInTheDocument();
    });

    const fieldInput = canvas.getByTestId('root-0');
    await userEvent.type(fieldInput, 'username');

    // Verify field was created with the name
    await expect(fieldInput).toHaveTextContent('username');
  },
};

export const AddMultipleFields: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="products"
      hint="Test: Add multiple fields"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Add first field
    const addButton = await canvas.findByTestId('root-create-field-button');
    await userEvent.click(addButton);

    await waitFor(async () => {
      const field1 = canvas.getByTestId('root-0');
      await expect(field1).toBeInTheDocument();
    });

    const field1 = canvas.getByTestId('root-0');
    await userEvent.type(field1, 'name');

    // Add second field
    await userEvent.click(addButton);

    await waitFor(async () => {
      const field2 = canvas.getByTestId('root-1');
      await expect(field2).toBeInTheDocument();
    });

    const field2 = canvas.getByTestId('root-1');
    await userEvent.type(field2, 'price');

    // Add third field
    await userEvent.click(addButton);

    await waitFor(async () => {
      const field3 = canvas.getByTestId('root-2');
      await expect(field3).toBeInTheDocument();
    });

    const field3 = canvas.getByTestId('root-2');
    await userEvent.type(field3, 'quantity');

    // Verify all fields exist
    await expect(canvas.getByTestId('root-0')).toHaveTextContent('name');
    await expect(canvas.getByTestId('root-1')).toHaveTextContent('price');
    await expect(canvas.getByTestId('root-2')).toHaveTextContent('quantity');
  },
};

export const ChangeFieldType: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="items"
      hint="Test: Add field and change its type to number"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Add a field
    const addButton = await canvas.findByTestId('root-create-field-button');
    await userEvent.click(addButton);

    await waitFor(async () => {
      const field = canvas.getByTestId('root-0');
      await expect(field).toBeInTheDocument();
    });

    const field = canvas.getByTestId('root-0');
    await userEvent.type(field, 'count');

    // Click on type selector to open menu
    const typeButton = await canvas.findByTestId('root-0-select-type-button');
    await userEvent.click(typeButton);

    // Select "number" type from menu
    await waitFor(async () => {
      const numberOption = screen.getByTestId('root-0-menu-type-Number');
      await expect(numberOption).toBeInTheDocument();
    });

    const numberOption = screen.getByTestId('root-0-menu-type-Number');
    await userEvent.click(numberOption);

    // Verify type changed to number
    await waitFor(async () => {
      const typeLabel = canvas.getByTestId('root-0-select-type-button');
      await expect(typeLabel).toHaveTextContent('number');
    });
  },
};

export const CreateTableWithFields: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="orders"
      hint="Test: Create table with fields and click Create Table"
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Add fields
    const addButton = await canvas.findByTestId('root-create-field-button');

    // Add "orderId" field
    await userEvent.click(addButton);
    await waitFor(async () => {
      const field = canvas.getByTestId('root-0');
      await expect(field).toBeInTheDocument();
    });
    await userEvent.type(canvas.getByTestId('root-0'), 'orderId');

    // Add "total" field
    await userEvent.click(addButton);
    await waitFor(async () => {
      const field = canvas.getByTestId('root-1');
      await expect(field).toBeInTheDocument();
    });
    await userEvent.type(canvas.getByTestId('root-1'), 'total');

    // Click "Create Table" button
    const createButton = await canvas.findByTestId(
      'schema-editor-create-button',
    );
    await userEvent.click(createButton);

    // Wait for dialog to open (dialog is in Portal, use screen)
    await waitFor(async () => {
      const dialogTitle = screen.getByText('Create Table "orders"');
      await expect(dialogTitle).toBeInTheDocument();
    });

    // Find and click Create Table button in dialog (dialog is in Portal, use screen)
    const dialogCreateButton = screen.getByRole('button', {
      name: 'Create Table',
    });
    await userEvent.click(dialogCreateButton);

    // Verify onCreateTable was called
    await waitFor(async () => {
      await expect(args.onCreateTable).toHaveBeenCalled();
    });
  },
};

export const ApplyChangesToExistingSchema: StoryObj<
  typeof UpdatingStoryWrapper
> = {
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

export const ValidationErrorOnDuplicateField: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="test"
      hint="Test: Create duplicate field names and verify error"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const addButton = await canvas.findByTestId('root-create-field-button');

    // Add first field named "name"
    await userEvent.click(addButton);
    await waitFor(async () => {
      const field = canvas.getByTestId('root-0');
      await expect(field).toBeInTheDocument();
    });
    await userEvent.type(canvas.getByTestId('root-0'), 'name');

    // Add second field also named "name" (duplicate)
    await userEvent.click(addButton);
    await waitFor(async () => {
      const field = canvas.getByTestId('root-1');
      await expect(field).toBeInTheDocument();
    });
    await userEvent.type(canvas.getByTestId('root-1'), 'name');

    // Click blur to trigger validation
    await userEvent.click(document.body);

    // Click "Review Errors" button (should appear when there are errors)
    await waitFor(async () => {
      const reviewButton = canvas.getByTestId(
        'schema-editor-review-errors-button',
      );
      await expect(reviewButton).toBeInTheDocument();
    });

    const reviewButton = canvas.getByTestId(
      'schema-editor-review-errors-button',
    );
    await userEvent.click(reviewButton);

    // Verify error dialog shows duplicate field error (dialog is in Portal, use screen)
    await waitFor(async () => {
      const errorMessage = screen.getByText(/fix the following errors/i);
      await expect(errorMessage).toBeInTheDocument();
    });
  },
};

export const CancelCreation: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="test"
      hint="Test: Click close button to cancel"
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Click close button
    const closeButton = await canvas.findByTestId('close-create-table-button');
    await userEvent.click(closeButton);

    // Verify onCancel was called
    await waitFor(async () => {
      await expect(args.onCancel).toHaveBeenCalled();
    });
  },
};

export const SwitchViewMode: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="test"
      hint="Test: Switch between Tree and JSON view"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify we start in Tree mode (root node should be visible)
    await waitFor(async () => {
      const rootNode = canvas.getByTestId('root');
      await expect(rootNode).toBeInTheDocument();
    });

    // Find the schema editor and hover to show view switcher
    const schemaEditor = await canvas.findByTestId('schema-editor-v3-creating');
    await userEvent.hover(schemaEditor);

    // Click on view mode switcher to open menu
    const viewSwitcher = await canvas.findByTestId('view-mode-switcher');
    await userEvent.click(viewSwitcher);

    // Select JSON from menu (menu is in Portal, use screen)
    await waitFor(async () => {
      const jsonOption = screen.getByTestId('row-editor-mode-json');
      await expect(jsonOption).toBeInTheDocument();
    });

    const jsonOption = screen.getByTestId('row-editor-mode-json');
    await userEvent.click(jsonOption);

    // Verify JSON view is now shown (CodeMirror container should appear)
    await waitFor(async () => {
      const codeElement = canvasElement.querySelector('.cm-editor');
      await expect(codeElement).toBeInTheDocument();
    });
  },
};

export const AddNestedObjectField: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="users"
      hint="Test: Add an object field with nested properties"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Add a field
    const addButton = await canvas.findByTestId('root-create-field-button');
    await userEvent.click(addButton);

    await waitFor(async () => {
      const field = canvas.getByTestId('root-0');
      await expect(field).toBeInTheDocument();
    });

    const field = canvas.getByTestId('root-0');
    await userEvent.type(field, 'address');

    // Change type to object
    const typeButton = await canvas.findByTestId('root-0-select-type-button');
    await userEvent.click(typeButton);

    await waitFor(async () => {
      const objectOption = screen.getByTestId('root-0-menu-type-Object');
      await expect(objectOption).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('root-0-menu-type-Object'));

    // Wait for the object to be created and expand button to appear
    await waitFor(async () => {
      const nestedAddButton = canvas.getByTestId('root-0-create-field-button');
      await expect(nestedAddButton).toBeInTheDocument();
    });

    // Add nested field inside address object
    const nestedAddButton = canvas.getByTestId('root-0-create-field-button');
    await userEvent.click(nestedAddButton);

    await waitFor(async () => {
      const nestedField = canvas.getByTestId('root-0-0');
      await expect(nestedField).toBeInTheDocument();
    });

    const nestedField = canvas.getByTestId('root-0-0');
    await userEvent.type(nestedField, 'street');

    // Verify nested field was created
    await expect(nestedField).toHaveTextContent('street');
  },
};

export const AddArrayField: Story = {
  args: {
    onCreateTable: fn(),
    onCancel: fn(),
  },
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="posts"
      hint="Test: Add an array field"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Add a field
    const addButton = await canvas.findByTestId('root-create-field-button');
    await userEvent.click(addButton);

    await waitFor(async () => {
      const field = canvas.getByTestId('root-0');
      await expect(field).toBeInTheDocument();
    });

    const field = canvas.getByTestId('root-0');
    await userEvent.type(field, 'tags');

    // Change type to array
    const typeButton = await canvas.findByTestId('root-0-select-type-button');
    await userEvent.click(typeButton);

    await waitFor(async () => {
      const arrayOption = screen.getByTestId('root-0-menu-type-Array');
      await expect(arrayOption).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId('root-0-menu-type-Array'));

    // Verify array was created (one of the type buttons should show "array")
    await waitFor(async () => {
      const typeLabels = canvas.getAllByTestId('root-0-select-type-button');
      const hasArrayType = typeLabels.some((el) => el.textContent === 'array');
      await expect(hasArrayType).toBe(true);
    });
  },
};
