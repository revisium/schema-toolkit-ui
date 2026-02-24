import type { Meta, StoryObj } from '@storybook/react';
import { FilterFieldType } from '../../../../shared/field-types.js';
import { StoryWrapper, createSchema } from './helpers.js';

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Cell',
  decorators: [(Story) => <Story />],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const StringCell: Story = {
  args: {
    field: 'data.name',
    fieldType: FilterFieldType.String,
    schema: createSchema({ name: 'string' }),
    initialData: { name: 'Hello World' },
  },
};

export const NumberCell: Story = {
  args: {
    field: 'data.age',
    fieldType: FilterFieldType.Number,
    schema: createSchema({ age: 'number' }),
    initialData: { age: 42 },
  },
};

export const BooleanTrue: Story = {
  args: {
    field: 'data.active',
    fieldType: FilterFieldType.Boolean,
    schema: createSchema({ active: 'boolean' }),
    initialData: { active: true },
  },
};

export const BooleanFalse: Story = {
  args: {
    field: 'data.active',
    fieldType: FilterFieldType.Boolean,
    schema: createSchema({ active: 'boolean' }),
    initialData: { active: false },
  },
};

export const EmptyString: Story = {
  args: {
    field: 'data.name',
    fieldType: FilterFieldType.String,
    schema: createSchema({ name: 'string' }),
    initialData: { name: '' },
  },
};

export const LongText: Story = {
  args: {
    field: 'data.name',
    fieldType: FilterFieldType.String,
    schema: createSchema({ name: 'string' }),
    initialData: {
      name: 'This is a very long text value that should be truncated in the cell renderer to demonstrate overflow handling behavior',
    },
  },
};

export const NegativeNumber: Story = {
  args: {
    field: 'data.age',
    fieldType: FilterFieldType.Number,
    schema: createSchema({ age: 'number' }),
    initialData: { age: -42 },
  },
};

export const DecimalNumber: Story = {
  args: {
    field: 'data.age',
    fieldType: FilterFieldType.Number,
    schema: createSchema({ age: 'number' }),
    initialData: { age: 3.14159 },
  },
};
