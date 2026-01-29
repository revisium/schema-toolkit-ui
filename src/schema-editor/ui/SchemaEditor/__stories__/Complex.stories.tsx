import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import { deepNestedSchema, largeSchema, mixedComplexSchema } from './schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'SchemaEditor/Complex',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const DeepNesting: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={deepNestedSchema}
      mode="updating"
      tableId="nested"
      hint="Deep nesting: 4 levels of nested objects. Expand all to see structure."
    />
  ),
};

export const LargeSchema: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={largeSchema}
      mode="updating"
      tableId="large"
      hint="Large schema with 20 fields. Tests scrolling and performance."
    />
  ),
};

export const MixedComplex: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={mixedComplexSchema}
      mode="updating"
      tableId="orders"
      hint="Complex schema mixing: objects, arrays, foreign keys, formulas, and system refs."
    />
  ),
};
