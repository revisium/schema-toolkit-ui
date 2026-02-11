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
  title: 'TableEditor/TableWidget/ContextMenu',
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

export const ContextMenuSingleCell: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nameCell = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(nameCell);
    await waitFor(() => {
      expect(nameCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.pointer({ keys: '[MouseRight]', target: nameCell });

    await waitFor(() => {
      const el = document.querySelector('[data-value="copy-value"]');
      expect(el).toBeTruthy();
      expect(el).toBeVisible();
    });

    await waitFor(() => {
      expect(
        document.querySelector('[data-value="copy-json-path"]'),
      ).toBeTruthy();
      expect(document.querySelector('[data-value="paste"]')).toBeTruthy();
      expect(document.querySelector('[data-value="clear"]')).toBeTruthy();
    });

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(document.querySelector('[data-value="copy-value"]')).toBeNull();
    });

    expect(nameCell).toHaveAttribute('tabindex', '0');
    expect(document.activeElement).toBe(nameCell);

    await userEvent.keyboard('{ArrowDown}');
    const nameCell2 = canvas.getByTestId('cell-row-2-name');
    await waitFor(() => {
      expect(nameCell2).toHaveAttribute('tabindex', '0');
      expect(nameCell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const ContextMenuCopyPath: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const clipboard = mockClipboard();

    const ageCell = canvas.getByTestId('cell-row-2-age');
    await userEvent.pointer({ keys: '[MouseRight]', target: ageCell });

    const copyPathItem = await waitFor(() => {
      const el = document.querySelector('[data-value="copy-json-path"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });

    await userEvent.click(copyPathItem);

    await waitFor(() => {
      expect(clipboard.getText()).toBe('row-2/age');
    });
  },
};

export const ContextMenuRange: Story = {
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

    cellFSM.selectTo({ rowId: 'row-2', field: 'age' });
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    const cellInRange = canvas.getByTestId('cell-row-1-name');
    await userEvent.pointer({ keys: '[MouseRight]', target: cellInRange });

    await waitFor(() => {
      const el = document.querySelector('[data-value="copy-range"]');
      expect(el).toBeTruthy();
      expect(el).toBeVisible();
    });

    await waitFor(() => {
      expect(document.querySelector('[data-value="paste-range"]')).toBeTruthy();
      expect(document.querySelector('[data-value="clear-range"]')).toBeTruthy();
      expect(document.querySelector('[data-value="copy-value"]')).toBeNull();
    });

    await userEvent.keyboard('{Escape}');

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await userEvent.keyboard('{Escape}');
  },
};

export const ContextMenuEdit: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    const nameCell = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(nameCell);
    await waitFor(() => {
      expect(nameCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.pointer({ keys: '[MouseRight]', target: nameCell });

    const editItem = await waitFor(() => {
      const el = document.querySelector('[data-value="edit"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(editItem).not.toHaveAttribute('data-disabled');

    await userEvent.click(editItem);

    await waitFor(() => {
      expect(cellFSM.isCellEditing('row-1', 'name')).toBe(true);
    });

    await userEvent.keyboard('{Escape}');
  },
};

export const ContextMenuRangeFocusRestore: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    const anchorCell = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(anchorCell);
    await waitFor(() => {
      expect(anchorCell).toHaveAttribute('tabindex', '0');
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'age' });
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    const nonAnchorCell = canvas.getByTestId('cell-row-2-name');
    await userEvent.pointer({ keys: '[MouseRight]', target: nonAnchorCell });

    await waitFor(() => {
      expect(document.querySelector('[data-value="copy-range"]')).toBeTruthy();
    });

    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(document.querySelector('[data-value="copy-range"]')).toBeNull();
    });

    expect(cellFSM.hasSelection).toBe(true);
    expect(document.activeElement).toBe(anchorCell);

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(false);
    });

    await userEvent.keyboard('{Escape}');
  },
};
