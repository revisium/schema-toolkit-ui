import type { Meta, StoryObj } from '@storybook/react';
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
