import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import { simpleSchema, formulaWithErrorSchema } from './schemas';
import { ObjectNodeVM } from '../../../vm/ObjectNodeVM';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'SchemaEditor/Errors',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const InvalidTableNameEmpty: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId=""
      hint="Empty table name - should show validation error on root node and in Review Errors."
    />
  ),
};

export const InvalidTableNameSystemPrefix: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="__system"
      hint="Table name starting with __ is reserved - should show validation error."
    />
  ),
};

export const InvalidTableNameSpaces: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="my table"
      hint="Table name with spaces - should show validation error."
    />
  ),
};

export const InvalidTableNameSpecialChars: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="table@name!"
      hint="Table name with special characters - should show validation error."
    />
  ),
};

export const DuplicateFieldNames: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Add a new field and name it 'title' (duplicate) - should show validation error."
      setupViewModel={(vm) => {
        const root = vm.rootNodeVM as ObjectNodeVM;
        root.addProperty('title');
      }}
    />
  ),
};

export const EmptyFieldName: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Field with empty name - should show validation error. (Added empty field)"
      setupViewModel={(vm) => {
        const root = vm.rootNodeVM as ObjectNodeVM;
        root.addProperty('');
      }}
    />
  ),
};

export const FormulaError: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={formulaWithErrorSchema}
      mode="updating"
      tableId="broken-formulas"
      hint="Formula references non-existent field - should show formula error."
    />
  ),
};

export const MultipleErrors: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={formulaWithErrorSchema}
      mode="updating"
      tableId="__invalid"
      hint="Multiple errors: invalid table name + formula error. Click 'Review Errors' to see all."
      setupViewModel={(vm) => {
        const root = vm.rootNodeVM as ObjectNodeVM;
        root.addProperty('');
      }}
    />
  ),
};

export const CreatingWithInvalidName: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="creating"
      tableId="__new"
      hint="Creating mode with invalid table name - should show 'Review Errors' button."
    />
  ),
};
