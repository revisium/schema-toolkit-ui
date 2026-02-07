import type { Meta, StoryObj } from '@storybook/react';
import { UpdatingStoryWrapper, updatingBaseMeta } from './shared';
import {
  simpleSchema,
  arrayOfStringsSchema,
  arrayOfNumbersSchema,
  arrayOfObjectsSchema,
  arrayOfArraysSchema,
  primitiveStringSchema,
  primitiveNumberSchema,
  primitiveBooleanSchema,
} from './schemas';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'SchemaEditor/RootTypes',
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

export const ObjectRoot: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="products"
      hint="Standard object root type - the most common schema structure."
    />
  ),
};

export const ArrayOfStrings: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={arrayOfStringsSchema}
      tableId="tags"
      hint="Root is an array of strings."
    />
  ),
};

export const ArrayOfNumbers: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={arrayOfNumbersSchema}
      tableId="scores"
      hint="Root is an array of numbers."
    />
  ),
};

export const ArrayOfObjects: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={arrayOfObjectsSchema}
      tableId="items"
      hint="Root is an array of objects."
    />
  ),
};

export const ArrayOfArrays: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={arrayOfArraysSchema}
      tableId="matrix"
      hint="Root is a 2D array (array of arrays)."
    />
  ),
};

export const PrimitiveString: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={primitiveStringSchema}
      tableId="config"
      hint="Root is a primitive string type."
    />
  ),
};

export const PrimitiveNumber: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={primitiveNumberSchema}
      tableId="counter"
      hint="Root is a primitive number type."
    />
  ),
};

export const PrimitiveBoolean: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={primitiveBooleanSchema}
      tableId="flag"
      hint="Root is a primitive boolean type."
    />
  ),
};
