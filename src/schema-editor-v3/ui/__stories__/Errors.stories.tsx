import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, userEvent, waitFor } from 'storybook/test';
import {
  CreatingStoryWrapper,
  UpdatingStoryWrapper,
  creatingBaseMeta,
  updatingBaseMeta,
} from './shared';
import {
  emptyObjectSchema,
  simpleSchema,
  formulaWithErrorSchema,
} from './schemas';

const creatingMeta: Meta<typeof CreatingStoryWrapper> = {
  ...creatingBaseMeta,
  title: 'V3/SchemaEditor/Errors/Creating',
};

const updatingMeta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'V3/SchemaEditor/Errors/Updating',
};

export default creatingMeta;
type CreatingStory = StoryObj<typeof CreatingStoryWrapper>;
type UpdatingStory = StoryObj<typeof UpdatingStoryWrapper>;

// ============ CREATING MODE ERRORS ============

export const DuplicateFieldName: CreatingStory = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="users"
      hint="Duplicate field name error. Click 'Review Errors'."
      setupStore={(vm) => {
        vm.tree.rootAccessor.actions.addProperty('name');
        vm.tree.rootAccessor.actions.addProperty('name');
      }}
    />
  ),
};

export const InvalidTableNameSystemPrefix: CreatingStory = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="__system"
      hint="Table name starting with __ is reserved - should show validation error."
    />
  ),
};

export const EmptyTableName: CreatingStory = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId=""
      hint="Empty table name - should show validation error."
    />
  ),
};

export const InvalidTableNameSpaces: CreatingStory = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="my table"
      hint="Table name with spaces - should show validation error."
    />
  ),
};

export const InvalidTableNameSpecialChars: CreatingStory = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="table@name!"
      hint="Table name with special characters - should show validation error."
    />
  ),
};

export const EmptyFieldName: CreatingStory = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="products"
      hint="Field with empty name - should show validation error. (Added empty field)"
      setupStore={(vm) => {
        vm.tree.rootAccessor.actions.addProperty('');
      }}
    />
  ),
};

export const MultipleErrors: CreatingStory = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="__invalid"
      hint="Multiple errors: invalid table name + duplicate field. Click 'Review Errors'."
      setupStore={(vm) => {
        vm.tree.rootAccessor.actions.addProperty('field');
        vm.tree.rootAccessor.actions.addProperty('field');
      }}
    />
  ),
};

// ============ UPDATING MODE ERRORS ============

export const FormulaError: UpdatingStory = {
  ...updatingMeta,
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={formulaWithErrorSchema}
      tableId="broken-formulas"
      hint="Formula references non-existent field - should show formula error."
    />
  ),
};

export const UpdatingDuplicateFieldNames: UpdatingStory = {
  ...updatingMeta,
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="products"
      hint="Add a new field and name it 'title' (duplicate) - should show validation error."
      setupStore={(vm) => {
        vm.tree.rootAccessor.actions.addProperty('title');
      }}
    />
  ),
};

export const UpdatingMultipleErrors: UpdatingStory = {
  ...updatingMeta,
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={formulaWithErrorSchema}
      tableId="__invalid"
      hint="Multiple errors: invalid table name + formula error. Click 'Review Errors' to see all."
      setupStore={(vm) => {
        vm.tree.rootAccessor.actions.addProperty('');
      }}
    />
  ),
};

/**
 * E2E Test: Create duplicate fields and fix them
 */
export const ErrorIndicatorInteraction: CreatingStory = {
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
