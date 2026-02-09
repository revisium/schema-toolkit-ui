import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@chakra-ui/react';
import { fn } from 'storybook/test';
import { SearchForeignKey } from '../ui/SearchForeignKey';
import type { SearchForeignKeySearchFn } from '../vm/SearchForeignKeyVM';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const allRowIds = [
  'row-1',
  'row-2',
  'row-3',
  'product-alpha',
  'product-beta',
  'product-gamma',
];

const mockSearch: SearchForeignKeySearchFn = async (
  _tableId: string,
  search: string,
) => {
  await delay(300);
  const filtered = search
    ? allRowIds.filter((id) => id.includes(search))
    : allRowIds;
  return { ids: filtered, hasMore: false };
};

const meta: Meta<typeof SearchForeignKey> = {
  title: 'SearchForeignKey/Standalone',
  component: SearchForeignKey,
  decorators: [
    (Story) => (
      <Box
        width="320px"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
      >
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof SearchForeignKey>;

export const Default: Story = {
  args: {
    tableId: 'products',
    onSearch: mockSearch,
    onSelect: fn().mockName('onSelect'),
    onClose: fn().mockName('onClose'),
    onOpenTableSearch: fn().mockName('onOpenTableSearch'),
    onCreateAndConnect: fn().mockName('onCreateAndConnect'),
  },
};

export const WithoutActions: Story = {
  args: {
    tableId: 'products',
    onSearch: mockSearch,
    onSelect: fn().mockName('onSelect'),
  },
};

export const EmptyTable: Story = {
  args: {
    tableId: 'empty-table',
    onSearch: async () => {
      await delay(300);
      return { ids: [], hasMore: false };
    },
    onSelect: fn().mockName('onSelect'),
    onOpenTableSearch: fn().mockName('onOpenTableSearch'),
  },
};

export const WithError: Story = {
  args: {
    tableId: 'broken-table',
    onSearch: async () => {
      await delay(300);
      throw new Error('Network error');
    },
    onSelect: fn().mockName('onSelect'),
  },
};
