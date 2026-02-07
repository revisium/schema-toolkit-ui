import type { Meta, StoryObj } from '@storybook/react';
import { CreatingStoryWrapper, creatingBaseMeta } from './shared';
import { emptyObjectSchema, simpleSchema } from './schemas';

const meta: Meta<typeof CreatingStoryWrapper> = {
  ...creatingBaseMeta,
  title: 'V3/SchemaEditor/Creating',
};
export default meta;
type Story = StoryObj<typeof CreatingStoryWrapper>;

export const EmptySchema: Story = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="new-table"
      hint="Empty schema - add fields using the + button, then click 'Create Table'."
    />
  ),
};

export const WithFieldsAdded: Story = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="users"
      hint="Schema with fields already added. Click 'Create Table' to see dialog."
      setupStore={(vm) => {
        vm.tree.rootAccessor.actions.addProperty('name');
        vm.tree.rootAccessor.actions.addProperty('email');
        vm.tree.rootAccessor.actions.addProperty('age');
        vm.tree.keyboard.deactivate();
      }}
    />
  ),
};

export const WithValidationError: Story = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      tableId="users"
      hint="Schema with duplicate field name error. Click 'Review Errors'."
      setupStore={(vm) => {
        vm.tree.rootAccessor.actions.addProperty('name');
        vm.tree.rootAccessor.actions.addProperty('name');
        vm.tree.keyboard.deactivate();
      }}
    />
  ),
};

export const WithInvalidTableName: Story = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="__reserved"
      hint="Invalid table name (starts with __). Click 'Review Errors'."
    />
  ),
};

export const WithEmptyTableName: Story = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId=""
      hint="Empty table name. Click 'Review Errors'."
    />
  ),
};

export const ReadyToCreate: Story = {
  render: (args) => (
    <CreatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="products"
      hint="Valid schema ready to create. Click 'Create Table' to see dialog."
    />
  ),
};
