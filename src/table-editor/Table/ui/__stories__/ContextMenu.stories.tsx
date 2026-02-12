import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  col,
  createTableStoryState,
  FilterFieldType,
  mockClipboard,
} from '../../../__stories__/helpers.js';
import { CellFSM } from '../../model/CellFSM.js';
import { TableWidget } from '../TableWidget.js';

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

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      schema: TABLE_SCHEMA,
      columns: TEST_COLUMNS,
      rowsData: MOCK_ROWS_DATA,
    }),
  );

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
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

    const events: string[] = [];
    const track = (name: string) => () => events.push(name);
    editItem.addEventListener('pointerdown', track('pointerdown'));
    editItem.addEventListener('pointerup', track('pointerup'));
    editItem.addEventListener('mousedown', track('mousedown'));
    editItem.addEventListener('mouseup', track('mouseup'));
    editItem.addEventListener('click', track('click'));

    await userEvent.click(editItem);

    const eventsSnapshot = [...events];

    await waitFor(
      () => {
        expect(cellFSM.isCellEditing('row-1', 'name')).toBe(true);
      },
      { timeout: 3000 },
    ).catch((err) => {
      throw new Error(
        `Edit mode not entered. Events on editItem: [${eventsSnapshot.join(', ')}]. ` +
          `Menu still visible: ${!!document.querySelector('[data-value="edit"]')}. ` +
          `FSM state: ${JSON.stringify(cellFSM.getDebugState?.() ?? 'no debug')}. ` +
          `Original: ${err.message}`,
      );
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
