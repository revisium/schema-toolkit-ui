import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { createTableStoryState, mockClipboard } from '../../helpers.js';
import { CellFSM } from '../../../Table/model/CellFSM.js';
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
  title: 'TableEditor/E2E/Table/ContextMenu',
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

export const FullContextMenuWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const clipboard = mockClipboard();

    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    // --- 1. Single cell context menu ---
    const nameCell = canvas.getByTestId('cell-row-1-data.name');
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
    const nameCell2 = canvas.getByTestId('cell-row-2-data.name');
    await waitFor(() => {
      expect(nameCell2).toHaveAttribute('tabindex', '0');
      expect(nameCell).toHaveAttribute('tabindex', '-1');
    });

    // cleanup: exit focus
    await userEvent.keyboard('{Escape}');

    // --- 2. Copy path ---
    const ageCell = canvas.getByTestId('cell-row-2-data.age');
    await userEvent.pointer({ keys: '[MouseRight]', target: ageCell });

    const copyPathItem = await waitFor(() => {
      const el = document.querySelector('[data-value="copy-json-path"]');
      expect(el).toBeTruthy();
      return el as HTMLElement;
    });

    await userEvent.click(copyPathItem);

    await waitFor(() => {
      expect(clipboard.getText()).toBe('row-2/data.age');
    });

    // --- 3. Range context menu ---
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

    const cellInRange = canvas.getByTestId('cell-row-1-data.name');
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

    // cleanup: clear selection and focus
    await userEvent.click(canvas.getByTestId('cell-row-1-data.name'));
    await userEvent.keyboard('{Escape}');

    // --- 4. Edit from context menu ---
    const editTargetCell = canvas.getByTestId('cell-row-1-data.name');
    await userEvent.click(editTargetCell);
    await waitFor(() => {
      expect(editTargetCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.pointer({ keys: '[MouseRight]', target: editTargetCell });

    const editItem = await waitFor(() => {
      const el = document.querySelector('[data-value="edit"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(editItem).not.toHaveAttribute('data-disabled');

    await userEvent.click(editItem);

    await waitFor(() => {
      expect(cellFSM.isCellEditing('row-1', 'data.name')).toBe(true);
    });

    await userEvent.keyboard('{Escape}');

    // cleanup: exit focus
    await userEvent.keyboard('{Escape}');

    // --- 5. Range focus restore ---
    const anchorCell = canvas.getByTestId('cell-row-1-data.name');
    await userEvent.click(anchorCell);
    await waitFor(() => {
      expect(anchorCell).toHaveAttribute('tabindex', '0');
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'data.age' });
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    const nonAnchorCell = canvas.getByTestId('cell-row-2-data.name');
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

export const RightClickTransferBetweenCells: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    // Focus cell A and open context menu
    const cellA = canvas.getByTestId('cell-row-1-data.name');
    await userEvent.click(cellA);
    await waitFor(() => {
      expect(cellA).toHaveAttribute('tabindex', '0');
    });

    await userEvent.pointer({ keys: '[MouseRight]', target: cellA });

    await waitFor(() => {
      expect(document.querySelector('[data-value="copy-value"]')).toBeTruthy();
    });

    // Right-click cell B while menu on cell A is open
    const cellB = canvas.getByTestId('cell-row-2-data.age');
    await userEvent.pointer({ keys: '[MouseRight]', target: cellB });

    // Menu should now be open on cell B
    await waitFor(() => {
      const el = document.querySelector('[data-value="copy-value"]');
      expect(el).toBeTruthy();
      expect(el).toBeVisible();
    });

    // Cell B should be focused
    await waitFor(() => {
      expect(cellFSM.isCellFocused('row-2', 'data.age')).toBe(true);
    });

    // Close and verify
    await userEvent.keyboard('{Escape}');

    await waitFor(() => {
      expect(document.querySelector('[data-value="copy-value"]')).toBeNull();
    });

    expect(cellB).toHaveAttribute('tabindex', '0');
    expect(document.activeElement).toBe(cellB);

    await userEvent.keyboard('{Escape}');
  },
};
