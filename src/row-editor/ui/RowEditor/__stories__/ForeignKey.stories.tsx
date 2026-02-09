import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { StoryWrapper, baseMeta } from './shared';
import { foreignKeyFieldSchema, mixedFieldsSchema } from './schemas';
import type { RowEditorCallbacks } from '../../../vm/types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const allRowIds = [
  'row-1',
  'row-2',
  'row-3',
  'product-alpha',
  'product-beta',
  'product-gamma',
];

const navigateAction = fn().mockName('onNavigateToForeignKey');
const openTableSearchAction = fn().mockName('onOpenTableSearch');
const createAndConnectAction = fn().mockName('onCreateAndConnect');

const mockCallbacks: RowEditorCallbacks = {
  onSearchForeignKey: async (_tableId: string, search: string) => {
    await delay(300);
    const filtered = search
      ? allRowIds.filter((id) => id.includes(search))
      : allRowIds;
    return { ids: filtered, hasMore: false };
  },
  onNavigateToForeignKey: (tableId: string, rowId: string) => {
    navigateAction(tableId, rowId);
  },
  onOpenTableSearch: async (tableId: string) => {
    openTableSearchAction(tableId);
    await delay(200);
    return 'searched-row-id';
  },
  onCreateAndConnect: async (tableId: string) => {
    createAndConnectAction(tableId);
    await delay(200);
    return 'new-row-id';
  },
};

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/ForeignKey',
};
export default meta;

type Story = StoryObj<typeof StoryWrapper>;

export const Default: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={foreignKeyFieldSchema}
      initialValue={{ name: 'Laptop', productId: 'row-1' }}
      callbacks={mockCallbacks}
      hint="Foreign key field with searchable dropdown. Click the value to open the picker."
    />
  ),
};

export const EmptyValue: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={foreignKeyFieldSchema}
      callbacks={mockCallbacks}
      hint="Foreign key field with empty value. Shows warning icon."
    />
  ),
};

export const WithNavigation: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={foreignKeyFieldSchema}
      initialValue={{ name: 'Laptop', productId: 'product-alpha' }}
      callbacks={mockCallbacks}
      hint="Foreign key with navigation arrow. Click the arrow icon to navigate."
    />
  ),
};

export const ReadOnly: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={foreignKeyFieldSchema}
      initialValue={{ name: 'Laptop', productId: 'row-2' }}
      mode="reading"
      callbacks={mockCallbacks}
      hint="Read-only foreign key field. No editing or navigation available."
    />
  ),
};

export const EmptySearchResults: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={foreignKeyFieldSchema}
      initialValue={{ name: 'Test', productId: '' }}
      callbacks={{
        ...mockCallbacks,
        onSearchForeignKey: async () => {
          await delay(300);
          return { ids: [], hasMore: false };
        },
      }}
      hint="Foreign key with no available rows in the target table."
    />
  ),
};

export const MixedFields: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={mixedFieldsSchema}
      initialValue={{
        title: 'Widget',
        price: 9.99,
        active: true,
        categoryId: 'row-1',
      }}
      callbacks={mockCallbacks}
      hint="Mixed fields: regular string, number, boolean, foreign key, and file."
    />
  ),
};
