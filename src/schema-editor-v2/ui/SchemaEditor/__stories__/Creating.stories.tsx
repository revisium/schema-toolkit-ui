import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import { emptyObjectSchema, simpleSchema } from './schemas';
import { ObjectNodeVM } from '../../../vm/ObjectNodeVM';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'V2/SchemaEditor/Creating',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const EmptySchema: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      mode="creating"
      tableId="new-table"
      hint="Empty schema - add fields using the + button, then click 'Create Table'."
    />
  ),
};

export const WithFieldsAdded: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      mode="creating"
      tableId="users"
      hint="Schema with fields already added. Click 'Create Table' to see dialog."
      setupViewModel={(vm) => {
        const root = vm.rootNodeVM as ObjectNodeVM;
        root.addProperty('name');
        root.addProperty('email');
        root.addProperty('age');
      }}
    />
  ),
};

export const WithValidationError: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      mode="creating"
      tableId="users"
      hint="Schema with duplicate field name error. Click 'Review Errors'."
      setupViewModel={(vm) => {
        const root = vm.rootNodeVM as ObjectNodeVM;
        root.addProperty('name');
        root.addProperty('name');
      }}
    />
  ),
};

export const WithInvalidTableName: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="creating"
      tableId="__reserved"
      hint="Invalid table name (starts with __). Click 'Review Errors'."
    />
  ),
};

export const WithEmptyTableName: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="creating"
      tableId=""
      hint="Empty table name. Click 'Review Errors'."
    />
  ),
};

export const ReadyToCreate: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="creating"
      tableId="products"
      hint="Valid schema ready to create. Click 'Create Table' to see dialog."
    />
  ),
};
