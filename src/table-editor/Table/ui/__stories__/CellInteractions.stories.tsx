import { useState } from 'react';
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

const StoryWrapper = observer(() => {
  const [state] = useState(() => {
    const columnsModel = new ColumnsModel();
    columnsModel.init(TEST_COLUMNS);
    const selection = new SelectionModel();
    const cellFSM = new CellFSM();

    const tableModel = createTableModel({
      tableId: 'test-table',
      schema: TABLE_SCHEMA as any,
      rows: MOCK_ROWS_DATA.map((data, i) => ({
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

  return (
    <Box width="600px" height="400px" borderWidth="1px" borderColor="gray.200">
      <TableWidget
        rows={state.rows}
        columnsModel={state.columnsModel}
        cellFSM={state.cellFSM}
        selection={state.selection}
      />
    </Box>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/TableWidget/CellInteractions',
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

export const CellInteractions: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const cellName = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(cellName);
    await waitFor(() => {
      expect(cellName).toHaveAttribute('tabindex', '0');
    });

    const cellRow2 = canvas.getByTestId('cell-row-2-name');
    await userEvent.click(cellRow2);
    await waitFor(() => {
      expect(cellRow2).toHaveAttribute('tabindex', '0');
      expect(cellName).toHaveAttribute('tabindex', '-1');
    });

    await userEvent.keyboard('{ArrowDown}');
    const cellRow3 = canvas.getByTestId('cell-row-3-name');
    await waitFor(() => {
      expect(cellRow3).toHaveAttribute('tabindex', '0');
      expect(cellRow2).toHaveAttribute('tabindex', '-1');
    });

    await userEvent.keyboard('{ArrowRight}');
    const cellRow3Age = canvas.getByTestId('cell-row-3-age');
    await waitFor(() => {
      expect(cellRow3Age).toHaveAttribute('tabindex', '0');
      expect(cellRow3).toHaveAttribute('tabindex', '-1');
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-active')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await userEvent.dblClick(canvas.getByTestId('cell-row-1-name'));
    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated');
    input.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent(
        'Updated',
      );
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.dblClick(canvas.getByTestId('cell-row-1-age'));
    const numInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(numInput);
    await userEvent.type(numInput, '77');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveTextContent('77');
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('X');
    const charInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(charInput.value).toBe('X');
    charInput.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('X');
    });

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('1');
    const digitInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(digitInput.value).toBe('1');
    digitInput.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('1');
    });

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{Delete}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('');
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '-1',
      );
    });
  },
};
