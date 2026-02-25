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
  MOCK_ROWS_DATA,
} from '../../../Table/ui/__stories__/tableTestData.js';

ensureReactivityProvider();

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      dataSchema: TABLE_SCHEMA,
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
    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'data.age' });

    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });
    expect(cellFSM.isCellInSelection('row-1', 'data.name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-1', 'data.age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'data.name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'data.age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-3', 'data.name')).toBe(false);
    expect(cellFSM.isCellInSelection('row-1', 'data.active')).toBe(false);

    await userEvent.click(canvas.getByTestId('cell-row-3-data.name'));
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(false);
    });
    await userEvent.keyboard('{Escape}');

    // --- Shift-arrow selection ---
    await userEvent.click(canvas.getByTestId('cell-row-2-data.age'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-data.age')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    await userEvent.keyboard('{Shift>}{ArrowDown}{/Shift}');
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });
    expect(cellFSM.isCellInSelection('row-2', 'data.age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-3', 'data.age')).toBe(true);

    await userEvent.keyboard('{Shift>}{ArrowRight}{/Shift}');
    expect(cellFSM.isCellInSelection('row-2', 'data.age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'data.active')).toBe(true);
    expect(cellFSM.isCellInSelection('row-3', 'data.age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-3', 'data.active')).toBe(true);

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(false);
    });
    await userEvent.keyboard('{Escape}');

    // --- Mouse drag ---
    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    cellFSM.dragStart({ rowId: 'row-1', field: 'data.name' });
    cellFSM.dragExtend({ rowId: 'row-2', field: 'data.age' });

    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });
    expect(cellFSM.isCellInSelection('row-1', 'data.name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-1', 'data.age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'data.name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'data.age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-3', 'data.name')).toBe(false);

    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(false);
    });
    await userEvent.keyboard('{Escape}');

    // --- Copy range ---
    const clipboard = mockClipboard();

    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'data.age' });
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    await userEvent.keyboard('{Control>}c{/Control}');
    await waitFor(() => {
      expect(clipboard.getText()).toBe('Alice\t30\nBob\t25');
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await userEvent.keyboard('{Escape}');

    // --- Paste range ---
    clipboard.setText('X\t99\nY\t88');

    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'data.age' });
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    await userEvent.keyboard('{Control>}v{/Control}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveTextContent('X');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.age')).toHaveTextContent('99');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-data.name')).toHaveTextContent('Y');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-data.age')).toHaveTextContent('88');
    });
    expect(canvas.getByTestId('cell-row-3-data.name')).toHaveTextContent(
      'Charlie',
    );

    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await userEvent.keyboard('{Escape}');

    // --- Delete range ---
    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'data.age' });
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    await userEvent.keyboard('{Delete}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveTextContent('');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.age')).toHaveTextContent('0');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-data.name')).toHaveTextContent('');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-data.age')).toHaveTextContent('0');
    });
    expect(canvas.getByTestId('cell-row-3-data.name')).toHaveTextContent(
      'Charlie',
    );
    expect(canvas.getByTestId('cell-row-3-data.age')).toHaveTextContent('35');

    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await userEvent.keyboard('{Escape}');

    // --- Drag after column reorder ---
    state.columnsModel.moveColumnToStart('data.active');

    await waitFor(() => {
      expect(canvas.getByTestId('header-data.active')).toBeVisible();
    });

    cellFSM.dragStart({ rowId: 'row-1', field: 'data.active' });
    cellFSM.dragExtend({ rowId: 'row-2', field: 'data.age' });

    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });
    expect(cellFSM.isCellInSelection('row-1', 'data.active')).toBe(true);
    expect(cellFSM.isCellInSelection('row-1', 'data.name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-1', 'data.age')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'data.active')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'data.name')).toBe(true);
    expect(cellFSM.isCellInSelection('row-2', 'data.age')).toBe(true);

    await userEvent.click(canvas.getByTestId('cell-row-1-data.active'));
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(false);
    });
    await userEvent.keyboard('{Escape}');

    // --- Clear on edit ---
    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveAttribute(
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
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveTextContent('Z');
    });

    await userEvent.keyboard('{Escape}');
  },
};
