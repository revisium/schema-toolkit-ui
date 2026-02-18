import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import type { JsonSchema } from '@revisium/schema-toolkit';
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

ensureReactivityProvider();

const TABLE_SCHEMA = {
  type: 'object' as const,
  properties: {
    name: { type: 'string', default: '' },
    age: { type: 'number', default: 0 },
    active: { type: 'boolean', default: false },
  },
  additionalProperties: false,
  required: ['name', 'age', 'active'],
};

const TEST_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
];

const MOCK_ROWS_DATA = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
  { name: 'Charlie', age: 35, active: true },
  { name: 'Diana', age: 28, active: true },
  { name: 'Eve', age: 22, active: false },
];

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

const MANY_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
  col('email', FilterFieldType.String),
  col('score', FilterFieldType.Number),
  col('city', FilterFieldType.String),
];

const MANY_COLUMNS_SCHEMA = {
  type: 'object' as const,
  properties: {
    name: { type: 'string', default: '' },
    age: { type: 'number', default: 0 },
    active: { type: 'boolean', default: false },
    email: { type: 'string', default: '' },
    score: { type: 'number', default: 0 },
    city: { type: 'string', default: '' },
  },
  additionalProperties: false,
  required: ['name', 'age', 'active', 'email', 'score', 'city'],
};

const MANY_COLUMNS_ROWS = [
  {
    name: 'Alice',
    age: 30,
    active: true,
    email: 'alice@example.com',
    score: 95,
    city: 'New York',
  },
  {
    name: 'Bob',
    age: 25,
    active: false,
    email: 'bob@example.com',
    score: 80,
    city: 'London',
  },
  {
    name: 'Charlie',
    age: 35,
    active: true,
    email: 'charlie@example.com',
    score: 72,
    city: 'Tokyo',
  },
  {
    name: 'Diana',
    age: 28,
    active: true,
    email: 'diana@example.com',
    score: 88,
    city: 'Paris',
  },
  {
    name: 'Eve',
    age: 22,
    active: false,
    email: 'eve@example.com',
    score: 91,
    city: 'Berlin',
  },
];

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

const FORMULA_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    item: { type: 'string', default: '' },
    price: { type: 'number', default: 0 },
    quantity: { type: 'number', default: 0 },
    total: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'price * quantity' },
    },
    expensive: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'total > 100' },
    },
  },
  additionalProperties: false,
  required: ['item', 'price', 'quantity', 'total', 'expensive'],
} as JsonSchema;

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

const READONLY_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: '', readOnly: true },
    age: { type: 'number', default: 0, readOnly: true },
    active: { type: 'boolean', default: false, readOnly: true },
  },
  additionalProperties: false,
  required: ['name', 'age', 'active'],
} as JsonSchema;

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
