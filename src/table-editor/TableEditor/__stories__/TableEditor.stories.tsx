import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import {
  obj,
  str,
  num,
  bool,
  numFormula,
  boolFormula,
} from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../lib/initReactivity.js';
import {
  col,
  createTableEditorStoryState,
  FilterFieldType,
  type TableEditorStoryState,
} from '../../__stories__/helpers.js';
import { FilterWidget } from '../../Filters/ui/FilterWidget.js';
import { SearchWidget } from '../../Search/ui/SearchWidget.js';
import { SortingsWidget } from '../../Sortings/ui/SortingsWidget.js';
import { RowCountWidget } from '../../Status/ui/RowCountWidget.js';
import { ViewSettingsBadge } from '../../Status/ui/ViewSettingsBadge.js';
import { TableWidget } from '../../Table/ui/TableWidget.js';
import {
  TABLE_SCHEMA,
  TEST_COLUMNS,
  MOCK_ROWS_DATA,
  MANY_COLUMNS,
  MANY_COLUMNS_SCHEMA,
  MANY_COLUMNS_ROWS,
} from './tableEditorTestData.js';

ensureReactivityProvider();

const noop = () => {};

export interface StoryWrapperProps {
  state: TableEditorStoryState;
  readonly?: boolean;
}

export const StoryWrapper = observer(
  ({ state, readonly = false }: StoryWrapperProps) => {
    const columns = state.core.columns.visibleColumns;

    return (
      <Box
        width="800px"
        height="500px"
        display="flex"
        flexDirection="column"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <Flex
          px={3}
          py={2}
          gap={2}
          alignItems="center"
          borderBottom="1px solid"
          borderColor="gray.100"
        >
          <SearchWidget model={state.core.search} />
          <FilterWidget model={state.core.filters} availableFields={columns} />
          <SortingsWidget
            model={state.core.sorts}
            availableFields={columns}
            onChange={noop}
          />
        </Flex>

        <Box flex={1}>
          <TableWidget
            rows={state.rows}
            columnsModel={state.core.columns}
            cellFSM={state.core.cellFSM}
            selection={state.core.selection}
            sortModel={state.core.sorts}
            filterModel={state.core.filters}
            onDeleteRow={readonly ? undefined : noop}
            onDuplicateRow={readonly ? undefined : noop}
            onDeleteSelected={readonly ? undefined : noop}
          />
        </Box>

        <Flex
          px={3}
          py={2}
          alignItems="center"
          justifyContent="space-between"
          borderTop="1px solid"
          borderColor="gray.100"
        >
          <RowCountWidget model={state.rowCount} />
          <ViewSettingsBadge model={state.core.viewBadge} />
        </Flex>
      </Box>
    );
  },
);

const DefaultWrapper = observer(() => {
  const [state] = useState(() =>
    createTableEditorStoryState({
      schema: TABLE_SCHEMA,
      columns: TEST_COLUMNS,
      rowsData: MOCK_ROWS_DATA,
    }),
  );

  return <StoryWrapper state={state} />;
});

const meta: Meta<typeof DefaultWrapper> = {
  component: DefaultWrapper as any,
  title: 'TableEditor/TableEditor',
  excludeStories: ['StoryWrapper'],
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof DefaultWrapper>;

export const Default: Story = {};

export const ManyColumns: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableEditorStoryState({
          schema: MANY_COLUMNS_SCHEMA,
          columns: MANY_COLUMNS,
          rowsData: MANY_COLUMNS_ROWS,
        }),
      );

      return <StoryWrapper state={state} />;
    });

    return <Wrapper />;
  },
};

export const EmptyTable: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableEditorStoryState({
          schema: TABLE_SCHEMA,
          columns: TEST_COLUMNS,
          rowsData: [],
        }),
      );

      return <StoryWrapper state={state} />;
    });

    return <Wrapper />;
  },
};

const FORMULA_SCHEMA = obj({
  item: str(),
  price: num(),
  quantity: num(),
  total: numFormula('price * quantity'),
  expensive: boolFormula('total > 100'),
});

const FORMULA_COLUMNS = [
  col('item', FilterFieldType.String, { label: 'Item' }),
  col('price', FilterFieldType.Number, { label: 'Price' }),
  col('quantity', FilterFieldType.Number, { label: 'Qty' }),
  col('total', FilterFieldType.Number, { label: 'Total', hasFormula: true }),
  col('expensive', FilterFieldType.Boolean, {
    label: 'Expensive?',
    hasFormula: true,
  }),
];

const FORMULA_ROWS = [
  { item: 'Laptop', price: 999, quantity: 2 },
  { item: 'Mouse', price: 25, quantity: 3 },
  { item: 'Monitor', price: 450, quantity: 1 },
];

export const WithFormulas: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableEditorStoryState({
          schema: FORMULA_SCHEMA,
          columns: FORMULA_COLUMNS,
          rowsData: FORMULA_ROWS,
        }),
      );

      return <StoryWrapper state={state} />;
    });

    return <Wrapper />;
  },
};

const READONLY_SCHEMA = obj({
  name: str({ readOnly: true }),
  age: num({ readOnly: true }),
  active: bool({ readOnly: true }),
});

export const Readonly: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() => {
        const s = createTableEditorStoryState({
          schema: READONLY_SCHEMA,
          columns: TEST_COLUMNS,
          rowsData: MOCK_ROWS_DATA,
        });
        s.core.viewBadge.setCanSave(false);
        return s;
      });

      return <StoryWrapper state={state} readonly />;
    });

    return <Wrapper />;
  },
};
