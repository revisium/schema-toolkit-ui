import { Box, Flex } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ensureReactivityProvider } from '../../../../../lib/initReactivity.js';
import { col, FilterFieldType } from '../../../../__stories__/helpers.js';
import { SortModel } from '../../../../Sortings/model/SortModel.js';
import { SortIndicator } from '../SortIndicator.js';

ensureReactivityProvider();

const TEST_FIELDS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
];

interface WrapperProps {
  sorts: Array<{ field: string; direction: 'asc' | 'desc' }>;
  displayField: string;
}

const Wrapper = observer(({ sorts, displayField }: WrapperProps) => {
  const [sortModel] = useState(() => {
    const model = new SortModel();
    model.init(TEST_FIELDS);
    for (const s of sorts) {
      model.addSort(s.field, s.direction);
    }
    return model;
  });

  return (
    <Flex gap={4} alignItems="center">
      <Box fontSize="sm" color="gray.600">
        {displayField}:
      </Box>
      <SortIndicator field={displayField} sortModel={sortModel} />
    </Flex>
  );
});

const meta: Meta<typeof Wrapper> = {
  component: Wrapper as any,
  title: 'TableEditor/Header/SortIndicator',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Wrapper>;

export const NoSort: Story = {
  args: { sorts: [], displayField: 'name' },
};

export const AscendingSort: Story = {
  args: { sorts: [{ field: 'name', direction: 'asc' }], displayField: 'name' },
};

export const DescendingSort: Story = {
  args: {
    sorts: [{ field: 'name', direction: 'desc' }],
    displayField: 'name',
  },
};

export const MultiSortFirst: Story = {
  args: {
    sorts: [
      { field: 'name', direction: 'asc' },
      { field: 'age', direction: 'desc' },
    ],
    displayField: 'name',
  },
};

export const MultiSortSecond: Story = {
  args: {
    sorts: [
      { field: 'name', direction: 'asc' },
      { field: 'age', direction: 'desc' },
    ],
    displayField: 'age',
  },
};
