import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import {
  allPrimitivesSchema,
  nestedObjectSchema,
  arrayFieldsSchema,
  foreignKeysSchema,
  systemRefsSchema,
} from './schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'V2/SchemaEditor/FieldTypes',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const AllPrimitives: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={allPrimitivesSchema}
      mode="updating"
      tableId="primitives"
      hint="All primitive field types: string, number, boolean."
    />
  ),
};

export const NestedObjects: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={nestedObjectSchema}
      mode="updating"
      tableId="users"
      hint="Nested object structure: user.profile.firstName/lastName."
    />
  ),
};

export const ArrayFields: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={arrayFieldsSchema}
      mode="updating"
      tableId="data"
      hint="Various array types: strings, numbers, objects, and 2D arrays."
    />
  ),
};

export const ForeignKeys: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={foreignKeysSchema}
      mode="updating"
      tableId="posts"
      hint="Foreign key fields referencing other tables. Click 'Connect table' to change reference."
    />
  ),
};

export const SystemRefs: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={systemRefsSchema}
      mode="updating"
      tableId="media"
      hint="System refs: File (uploads), RowCreatedAt, RowUpdatedAt (timestamps)."
    />
  ),
};
