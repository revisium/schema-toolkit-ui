import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { ensureReactivityProvider } from '../../../../../lib/initReactivity.js';
import { FilterFieldType } from '../../../../shared/field-types.js';
import { ColumnsModel } from '../../../../Columns/model/ColumnsModel.js';
import { SortModel } from '../../../../Sortings/model/SortModel.js';
import { FilterModel } from '../../../../Filters/model/FilterModel.js';
import { ColumnHeader } from '../ColumnHeader.js';

ensureReactivityProvider();

import type { ColumnSpec } from '../../../../Columns/model/types.js';

const ALL_COLUMNS: ColumnSpec[] = [
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
  {
    field: 'data.email',
    label: 'Email',
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
  },
];

interface WrapperProps {
  withSort?: boolean;
  withFilter?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  columns?: ColumnSpec[];
  columnIndex?: number;
}

const Wrapper = observer(
  ({
    withSort = false,
    withFilter = false,
    sortField,
    sortDirection,
    columns,
    columnIndex = 0,
  }: WrapperProps) => {
    const cols = columns ?? ALL_COLUMNS;

    const [state] = useState(() => {
      const columnsModel = new ColumnsModel();
      columnsModel.init(cols);
      columnsModel.reorderColumns(cols.map((c) => c.field));

      const sortModel = new SortModel();
      sortModel.init(cols);
      if (sortField && sortDirection) {
        sortModel.addSort(sortField, sortDirection);
      }

      const filterModel = new FilterModel();
      filterModel.init(cols);

      return { columnsModel, sortModel, filterModel };
    });

    const column = cols[columnIndex];

    return (
      <Flex
        height="40px"
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="gray.50"
      >
        <ColumnHeader
          column={column}
          columnsModel={state.columnsModel}
          sortModel={withSort ? state.sortModel : undefined}
          filterModel={withFilter ? state.filterModel : undefined}
        />
      </Flex>
    );
  },
);

const meta: Meta<typeof Wrapper> = {
  component: Wrapper as any,
  title: 'TableEditor/Header/ColumnHeader',
  decorators: [
    (Story) => (
      <Box p={4} width="400px">
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Wrapper>;

export const Default: Story = {};

export const WithSortModel: Story = {
  args: { withSort: true },
};

export const WithSortActive: Story = {
  args: { withSort: true, sortField: 'data.name', sortDirection: 'asc' },
};

export const WithSortAndFilter: Story = {
  args: { withSort: true, withFilter: true },
};

export const DeprecatedColumn: Story = {
  args: {
    columns: [
      {
        field: 'data.oldField',
        label: 'Old Field',
        fieldType: FilterFieldType.String,
        isSystem: false,
        isDeprecated: true,
        hasFormula: false,
      },
    ],
  },
};

export const FormulaColumn: Story = {
  args: {
    columns: [
      {
        field: 'data.computed',
        label: 'Computed',
        fieldType: FilterFieldType.String,
        isSystem: false,
        isDeprecated: false,
        hasFormula: true,
      },
    ],
  },
};
