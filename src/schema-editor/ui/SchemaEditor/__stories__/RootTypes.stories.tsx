import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import {
  emptyObjectSchema,
  simpleSchema,
  arrayOfStringsSchema,
  arrayOfNumbersSchema,
  arrayOfObjectsSchema,
  arrayOfArraysSchema,
  primitiveStringSchema,
  primitiveNumberSchema,
  primitiveBooleanSchema,
} from './schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'SchemaEditor/RootTypes',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const ObjectRoot: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Default root type: object with properties."
    />
  ),
};

export const EmptyObjectRoot: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={emptyObjectSchema}
      mode="creating"
      tableId="new-table"
      hint="Empty object root - add fields to create schema."
    />
  ),
};

export const ArrayOfStrings: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={arrayOfStringsSchema}
      mode="updating"
      tableId="tags"
      hint="Root is array of strings."
    />
  ),
};

export const ArrayOfNumbers: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={arrayOfNumbersSchema}
      mode="updating"
      tableId="scores"
      hint="Root is array of numbers."
    />
  ),
};

export const ArrayOfObjects: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={arrayOfObjectsSchema}
      mode="updating"
      tableId="items"
      hint="Root is array of objects with name and value fields."
    />
  ),
};

export const ArrayOfArrays: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={arrayOfArraysSchema}
      mode="updating"
      tableId="matrix"
      hint="Root is array of arrays (2D array of strings)."
    />
  ),
};

export const PrimitiveString: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={primitiveStringSchema}
      mode="updating"
      tableId="config-value"
      hint="Root is primitive string type."
    />
  ),
};

export const PrimitiveNumber: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={primitiveNumberSchema}
      mode="updating"
      tableId="counter"
      hint="Root is primitive number type."
    />
  ),
};

export const PrimitiveBoolean: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={primitiveBooleanSchema}
      mode="updating"
      tableId="feature-flag"
      hint="Root is primitive boolean type."
    />
  ),
};
