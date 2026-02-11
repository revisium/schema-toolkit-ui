import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import type { JsonSchema } from '@revisium/schema-toolkit';
import { createTableModel } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { col, FilterFieldType } from '../../../__stories__/helpers.js';
import { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';
import { CellFSM } from '../../model/CellFSM.js';
import { RowVM } from '../../model/RowVM.js';
import { SelectionModel } from '../../model/SelectionModel.js';
import { TableWidget } from '../TableWidget.js';

ensureReactivityProvider();

const TABLE_SCHEMA: JsonSchema = {
  type: 'object',
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

interface StoryWrapperProps {
  rowCount?: number;
  showEmpty?: boolean;
}

const StoryWrapper = observer(
  ({ rowCount = 5, showEmpty = false }: StoryWrapperProps) => {
    const [state] = useState(() => {
      const columnsModel = new ColumnsModel();
      columnsModel.init(TEST_COLUMNS);
      const selection = new SelectionModel();
      const cellFSM = new CellFSM();

      const rowsData = showEmpty ? [] : MOCK_ROWS_DATA.slice(0, rowCount);

      const tableModel = createTableModel({
        tableId: 'test-table',
        schema: TABLE_SCHEMA as any,
        rows: rowsData.map((data, i) => ({
          rowId: `row-${i + 1}`,
          data,
        })),
      });

      const rows = tableModel.rows.map(
        (rowModel) => new RowVM(rowModel, rowModel.rowId, cellFSM, selection),
      );

      cellFSM.setNavigationContext(
        TEST_COLUMNS.map((c) => c.field),
        rows.map((r) => r.rowId),
      );

      return { columnsModel, selection, cellFSM, rows };
    });

    useEffect(() => {
      (window as any).__testState = state;
    }, [state]);

    return (
      <Box
        width="600px"
        height="400px"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <TableWidget
          rows={state.rows}
          columnsModel={state.columnsModel}
          cellFSM={state.cellFSM}
          selection={state.selection}
        />
      </Box>
    );
  },
);

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/TableWidget',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const Default: Story = {};

export const SingleRow: Story = {
  args: { rowCount: 1 },
};

export const EmptyTable: Story = {
  args: { showEmpty: true },
};

export const SelectionWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { selection } = (window as any).__testState as {
      selection: SelectionModel;
    };

    selection.toggle('row-1');

    await waitFor(() => {
      expect(canvas.getByTestId('selection-toolbar')).toBeVisible();
    });

    expect(selection.selectedCount).toBe(1);

    await userEvent.click(canvas.getByTestId('select-all'));

    await waitFor(() => {
      expect(selection.selectedCount).toBe(5);
    });

    await userEvent.click(canvas.getByTestId('exit-selection'));

    await waitFor(() => {
      expect(canvas.queryByTestId('selection-toolbar')).toBeNull();
    });
  },
};

export const HeadersRendered: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByTestId('header-name')).toBeVisible();
      expect(canvas.getByTestId('header-age')).toBeVisible();
      expect(canvas.getByTestId('header-active')).toBeVisible();
    });

    expect(canvas.getByTestId('header-name')).toHaveTextContent('Name');
    expect(canvas.getByTestId('header-age')).toHaveTextContent('Age');
    expect(canvas.getByTestId('header-active')).toHaveTextContent('Active');
  },
};

export const MultipleRowsRendered: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByTestId('row-row-1')).toBeVisible();
      expect(canvas.getByTestId('row-row-5')).toBeVisible();
    });

    expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('Alice');
    expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('Bob');
    expect(canvas.getByTestId('cell-row-3-name')).toHaveTextContent('Charlie');
  },
};
