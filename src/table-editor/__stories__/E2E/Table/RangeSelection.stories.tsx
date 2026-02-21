import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  createTableStoryState,
  mockClipboard,
  type TableStoryState,
} from '../../helpers.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';
import {
  TABLE_SCHEMA,
  TEST_COLUMNS,
  MOCK_ROWS_DATA,
} from '../../../Table/ui/__stories__/tableTestData.js';

ensureReactivityProvider();

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
    <Box width="600px" height="400px">
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
  title: 'TableEditor/E2E/Table/RangeSelection',
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

export const FullRangeSelectionWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableStoryState;
    const { cellFSM } = state;

    // --- Shift-click selection ---
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

    // --- Shift-arrow selection ---
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

    // --- Mouse drag ---
    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
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

    // --- Copy range ---
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

    // --- Paste range ---
    clipboard.setText('X\t99\nY\t88');

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

    // --- Delete range ---
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

    // --- Drag after column reorder ---
    state.columnsModel.moveColumnToStart('active');

    await waitFor(() => {
      expect(canvas.getByTestId('header-active')).toBeVisible();
    });

    cellFSM.dragStart({ rowId: 'row-1', field: 'active' });
    cellFSM.dragExtend({ rowId: 'row-2', field: 'age' });

    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });
    expect(cellFSM.isCellInSelection('row-1', 'active')).toBe(true);
    expect(cellFSM.isCellInSelection('row-1', 'name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-1', 'age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'active')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'age')).toBe(true);

    await userEvent.click(canvas.getByTestId('cell-row-1-active'));
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(false);
    });
    await userEvent.keyboard('{Escape}');

    // --- Clear on edit ---
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

    await userEvent.keyboard('{Escape}');
  },
};
