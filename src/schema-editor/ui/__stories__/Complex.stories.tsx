import type { Meta, StoryObj } from '@storybook/react';
import { UpdatingStoryWrapper, updatingBaseMeta } from './shared';
import { deepNestedSchema, largeSchema, mixedComplexSchema } from './schemas';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'SchemaEditor/Complex',
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

export const DeepNested: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={deepNestedSchema}
      tableId="data"
      hint="Deeply nested structure (5 levels). Test expand/collapse behavior."
    />
  ),
};

export const LargeSchema: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={largeSchema}
      tableId="data"
      hint="Schema with 20 fields. Auto-collapsed to improve initial load."
    />
  ),
};

export const MixedComplex: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={mixedComplexSchema}
      tableId="orders"
      hint="Complex schema with: foreign keys, nested objects, arrays, formulas, and system refs."
    />
  ),
};
