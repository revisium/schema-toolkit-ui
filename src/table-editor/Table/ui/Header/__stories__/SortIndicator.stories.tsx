import { Box, Flex } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { ensureReactivityProvider } from '../../../../../lib/initReactivity.js';
import type { ColumnSpec } from '../../../../Columns/model/types.js';
import { FilterFieldType } from '../../../../shared/field-types.js';
import { SortModel } from '../../../../Sortings/model/SortModel.js';
import { SortIndicator } from '../SortIndicator.js';

ensureReactivityProvider();

const TEST_FIELDS: ColumnSpec[] = [
  {
    field: 'data.name',
    label: 'Name',
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'data.age',
    label: 'Age',
    fieldType: FilterFieldType.Number,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
  {
    field: 'data.active',
    label: 'Active',
    fieldType: FilterFieldType.Boolean,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
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
  args: { sorts: [], displayField: 'data.name' },
};

export const AscendingSort: Story = {
  args: {
    sorts: [{ field: 'data.name', direction: 'asc' }],
    displayField: 'data.name',
  },
};

export const DescendingSort: Story = {
  args: {
    sorts: [{ field: 'data.name', direction: 'desc' }],
    displayField: 'data.name',
  },
};

export const MultiSortFirst: Story = {
  args: {
    sorts: [
      { field: 'data.name', direction: 'asc' },
      { field: 'data.age', direction: 'desc' },
    ],
    displayField: 'data.name',
  },
};

export const MultiSortSecond: Story = {
  args: {
    sorts: [
      { field: 'data.name', direction: 'asc' },
      { field: 'data.age', direction: 'desc' },
    ],
    displayField: 'data.age',
  },
};
