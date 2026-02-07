import type { Meta, StoryObj } from '@storybook/react';
import { UpdatingStoryWrapper, updatingBaseMeta } from './shared';
import {
  allPrimitivesSchema,
  nestedObjectSchema,
  arrayFieldsSchema,
  foreignKeysSchema,
  systemRefsSchema,
} from './schemas';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'SchemaEditor/FieldTypes',
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

export const AllPrimitives: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={allPrimitivesSchema}
      tableId="primitives"
      hint="All primitive field types: string, number, boolean."
    />
  ),
};

export const NestedObjects: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={nestedObjectSchema}
      tableId="users"
      hint="Nested object structure: user.profile.firstName/lastName."
    />
  ),
};

export const ArrayFields: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={arrayFieldsSchema}
      tableId="data"
      hint="Various array types: strings, numbers, objects, and 2D arrays."
    />
  ),
};

export const ForeignKeys: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={foreignKeysSchema}
      tableId="posts"
      hint="Foreign key fields referencing other tables. Click 'Connect table' to change reference."
    />
  ),
};

export const SystemRefs: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={systemRefsSchema}
      tableId="media"
      hint="System refs: File (uploads), RowCreatedAt, RowUpdatedAt (timestamps)."
    />
  ),
};
