import type { Meta, StoryObj } from '@storybook/react';
import { UpdatingStoryWrapper, updatingBaseMeta } from './shared';
import { simpleSchema, nestedObjectSchema } from './schemas';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'V3/SchemaEditor/Changes',
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

export const FieldAdded: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="products"
      hint="A field has been added. Click 'Apply Changes' to see the diff."
      setupStore={(vm) => {
        vm.tree.rootAccessor.actions.addProperty('newField');
      }}
    />
  ),
};

export const FieldRemoved: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="products"
      hint="A field has been removed. Click 'Apply Changes' to see the diff."
      setupStore={(vm) => {
        const children = vm.tree.getChildAccessors(
          vm.tree.schemaModel.root.id(),
        );
        const firstChild = children[0];
        if (firstChild) {
          firstChild.actions.remove();
        }
      }}
    />
  ),
};

export const FieldRenamed: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="products"
      hint="A field has been renamed. Click 'Apply Changes' to see the diff."
      setupStore={(vm) => {
        const children = vm.tree.getChildAccessors(
          vm.tree.schemaModel.root.id(),
        );
        const firstChild = children[0];
        if (firstChild) {
          firstChild.actions.rename('renamedField');
        }
      }}
    />
  ),
};

export const TypeChanged: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="products"
      hint="A field type has been changed (string to number). Click 'Apply Changes'."
      setupStore={(vm) => {
        const children = vm.tree.getChildAccessors(
          vm.tree.schemaModel.root.id(),
        );
        const firstChild = children[0];
        if (firstChild) {
          firstChild.actions.changeType('Number');
        }
      }}
    />
  ),
};

export const TableRenamed: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleSchema}
      tableId="products"
      hint="The table has been renamed. Click 'Apply Changes' to see the diff."
      setupStore={(vm) => {
        vm.tree.rootAccessor.actions.rename('renamedTable');
      }}
    />
  ),
};

export const MultipleChanges: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={nestedObjectSchema}
      tableId="users"
      hint="Multiple changes: field added, field removed, field renamed. Click 'Apply Changes'."
      setupStore={(vm) => {
        vm.tree.rootAccessor.actions.addProperty('newField');

        const children = vm.tree.getChildAccessors(
          vm.tree.schemaModel.root.id(),
        );
        const userAccessor = children.find((a) => a.label.name === 'user');
        if (userAccessor) {
          const userChildren = vm.tree.getChildAccessors(userAccessor.nodeId);
          if (userChildren[0]) {
            userChildren[0].actions.rename('renamedProfile');
          }
        }
      }}
    />
  ),
};
