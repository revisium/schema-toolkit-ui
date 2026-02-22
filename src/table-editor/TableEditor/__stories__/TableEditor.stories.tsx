import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
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
import type {
  TableEditorCallbacks,
  TableEditorBreadcrumb,
} from '../model/TableEditorCore.js';
import { TableEditor } from '../ui/TableEditor.js';
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

const STORY_BREADCRUMBS: TableEditorBreadcrumb[] = [
  { label: 'Database', dataTestId: 'breadcrumb-0' },
  { label: 'invoices', dataTestId: 'breadcrumb-1' },
];

export interface StoryWrapperProps {
  state: TableEditorStoryState;
}

export const StoryWrapper = observer(({ state }: StoryWrapperProps) => {
  return (
    <Box width="800px" height="500px">
      <TableEditor viewModel={state.core} />
    </Box>
  );
});

const onOpenRow = fn().mockName('onOpenRow');
const onDuplicateRow = fn().mockName('onDuplicateRow');

const defaultCallbacks: TableEditorCallbacks = {
  onBreadcrumbClick: noop,
  onCreateRow: noop,
  onOpenRow,
  onDuplicateRow,
};

const DefaultWrapper = observer(() => {
  const [state] = useState(() =>
    createTableEditorStoryState({
      schema: TABLE_SCHEMA,
      columns: TEST_COLUMNS,
      rowsData: MOCK_ROWS_DATA,
      breadcrumbs: STORY_BREADCRUMBS,
      callbacks: defaultCallbacks,
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
          breadcrumbs: STORY_BREADCRUMBS,
          callbacks: defaultCallbacks,
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
          breadcrumbs: STORY_BREADCRUMBS,
          callbacks: defaultCallbacks,
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
          breadcrumbs: STORY_BREADCRUMBS,
          callbacks: defaultCallbacks,
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
      const [state] = useState(() =>
        createTableEditorStoryState({
          schema: READONLY_SCHEMA,
          columns: TEST_COLUMNS,
          rowsData: MOCK_ROWS_DATA,
          readonly: true,
          breadcrumbs: STORY_BREADCRUMBS,
          callbacks: { onOpenRow },
        }),
      );

      return <StoryWrapper state={state} />;
    });

    return <Wrapper />;
  },
};
