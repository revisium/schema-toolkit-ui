import type { Meta, StoryObj } from '@storybook/react';
import { FilterFieldType } from '../../../../shared/field-types.js';
import { StoryWrapper, createSchema } from './helpers.js';

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Cell/Readonly',
  decorators: [(Story) => <Story />],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const FormulaCell: Story = {
  args: {
    field: 'data.greeting',
    fieldType: FilterFieldType.String,
    schema: createSchema({
      name: 'string',
      greeting: { type: 'string', readOnly: true, formula: '"Hello, " + name' },
    }),
    initialData: { name: 'Alice' },
  },
};

export const ReadonlyNumberCell: Story = {
  args: {
    field: 'data.total',
    fieldType: FilterFieldType.Number,
    schema: createSchema({
      total: { type: 'number', readOnly: true },
    }),
    initialData: { total: 1998 },
  },
};

export const ReadonlyBooleanCell: Story = {
  args: {
    field: 'data.expensive',
    fieldType: FilterFieldType.Boolean,
    schema: createSchema({
      expensive: { type: 'boolean', readOnly: true },
    }),
    initialData: { expensive: true },
  },
};
