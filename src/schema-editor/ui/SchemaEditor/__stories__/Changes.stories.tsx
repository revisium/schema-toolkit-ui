import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import { simpleSchema } from './schemas';
import { ObjectNodeVM } from '../../../vm/ObjectNodeVM';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'SchemaEditor/Changes',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const AddField: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Field 'newField' added. Click 'Apply Changes' to see the change."
      setupViewModel={(vm) => {
        const root = vm.rootNodeVM as ObjectNodeVM;
        root.addProperty('newField');
      }}
    />
  ),
};

export const RemoveField: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Field 'description' removed. Click 'Apply Changes' to see the change."
      setupViewModel={(vm) => {
        const root = vm.rootNodeVM as ObjectNodeVM;
        const descField = root.children.find((c) => c.name === 'description');
        if (descField) {
          root.removeProperty(descField);
        }
      }}
    />
  ),
};

export const RenameField: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Field 'title' renamed to 'name'. Click 'Apply Changes' to see the change."
      setupViewModel={(vm) => {
        const root = vm.rootNodeVM as ObjectNodeVM;
        const titleField = root.children.find((c) => c.name === 'title');
        if (titleField) {
          titleField.rename('name');
        }
      }}
    />
  ),
};

export const ChangeFieldType: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Field 'price' changed from number to string. Click 'Apply Changes' to see transformation info."
      setupViewModel={(vm) => {
        const root = vm.rootNodeVM as ObjectNodeVM;
        const priceField = root.children.find((c) => c.name === 'price');
        if (priceField) {
          priceField.changeType('String');
        }
      }}
    />
  ),
};

export const RenameTable: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Table renamed from 'products' to 'items'. Click 'Apply Changes' to see both table rename and no schema changes."
      setupViewModel={(vm) => {
        vm.setTableId('items');
      }}
    />
  ),
};

export const RenameTableInvalid: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Table renamed to invalid name '__items'. Should show error on root node and in Review Errors."
      setupViewModel={(vm) => {
        vm.setTableId('__items');
      }}
    />
  ),
};

export const RenameTableAndFields: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Table renamed + field renamed + field added. Click 'Apply Changes' to see combined changes."
      setupViewModel={(vm) => {
        vm.setTableId('catalog-items');
        const root = vm.rootNodeVM as ObjectNodeVM;
        const titleField = root.children.find((c) => c.name === 'title');
        if (titleField) {
          titleField.rename('name');
        }
        root.addProperty('sku');
      }}
    />
  ),
};

export const MultipleChanges: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="Multiple changes: add, remove, rename, type change. Click 'Apply Changes' to see all."
      setupViewModel={(vm) => {
        const root = vm.rootNodeVM as ObjectNodeVM;
        root.addProperty('sku');
        root.addProperty('category');
        const descField = root.children.find((c) => c.name === 'description');
        if (descField) {
          root.removeProperty(descField);
        }
        const titleField = root.children.find((c) => c.name === 'title');
        if (titleField) {
          titleField.rename('name');
        }
        const stockField = root.children.find((c) => c.name === 'inStock');
        if (stockField) {
          stockField.changeType('String');
        }
      }}
    />
  ),
};

export const NoChanges: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleSchema}
      mode="updating"
      tableId="products"
      hint="No changes made - 'Apply Changes' button should be hidden."
    />
  ),
};
