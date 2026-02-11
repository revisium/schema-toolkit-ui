import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import type { JsonSchema } from '@revisium/schema-toolkit';
import { createTableModel } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  col,
  FilterFieldType,
  mockClipboard,
} from '../../../__stories__/helpers.js';
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

  useEffect(() => {
    (window as any).__testState = state;
  }, [state]);

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
  title: 'TableEditor/TableWidget/RangeSelection',
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

export const RangeSelectionShiftClick: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    const cell11 = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(cell11);
    await waitFor(() => {
      expect(cell11).toHaveAttribute('tabindex', '0');
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'age' });

    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    expect(cellFSM.isCellInSelection('row-1', 'name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-1', 'age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-3', 'name')).toBe(false);
    expect(cellFSM.isCellInSelection('row-1', 'active')).toBe(false);

    await userEvent.click(canvas.getByTestId('cell-row-3-name'));
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(false);
    });

    await userEvent.keyboard('{Escape}');
  },
};

export const RangeSelectionShiftArrow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    await userEvent.click(canvas.getByTestId('cell-row-2-age'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-age')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });
    expect(cellFSM.isCellInSelection('row-2', 'age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-3', 'age')).toBe(true);

    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(cellFSM.isCellInSelection('row-2', 'age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'active')).toBe(true);
    expect(cellFSM.isCellInSelection('row-3', 'age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-3', 'active')).toBe(true);

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(false);
    });

    await userEvent.keyboard('{Escape}');
  },
};

export const RangeMouseDrag: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    const cell11 = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(cell11);
    await waitFor(() => {
      expect(cell11).toHaveAttribute('tabindex', '0');
    });

    cellFSM.dragStart({ rowId: 'row-1', field: 'name' });
    cellFSM.dragExtend({ rowId: 'row-2', field: 'age' });

    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });
    expect(cellFSM.isCellInSelection('row-1', 'name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-1', 'age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-3', 'name')).toBe(false);

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(false);
    });

    await userEvent.keyboard('{Escape}');
  },
};

export const RangeCopy: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    const clipboard = mockClipboard();

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'age' });
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    await userEvent.keyboard('{Control>}c{/Control}');
    await waitFor(() => {
      expect(clipboard.getText()).toBe('Alice\t30\nBob\t25');
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await userEvent.keyboard('{Escape}');
  },
};

export const RangePaste: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    mockClipboard('X\t99\nY\t88');

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'age' });
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    await userEvent.keyboard('{Control>}v{/Control}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('X');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveTextContent('99');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('Y');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-age')).toHaveTextContent('88');
    });

    expect(canvas.getByTestId('cell-row-3-name')).toHaveTextContent('Charlie');

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await userEvent.keyboard('{Escape}');
  },
};

export const RangeDelete: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('Alice');
    expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('Bob');

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'age' });
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    await userEvent.keyboard('{Delete}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveTextContent('0');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-age')).toHaveTextContent('0');
    });

    expect(canvas.getByTestId('cell-row-3-name')).toHaveTextContent('Charlie');
    expect(canvas.getByTestId('cell-row-3-age')).toHaveTextContent('35');

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await userEvent.keyboard('{Escape}');
  },
};

export const RangeClearOnEdit: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    await userEvent.keyboard('Z');
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(false);
    });

    const charInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(charInput.value).toBe('Z');

    charInput.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('Z');
    });

    expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('Bob');

    await userEvent.keyboard('{Escape}');
  },
};
