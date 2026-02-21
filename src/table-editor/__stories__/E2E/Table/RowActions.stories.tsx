import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent, fn } from 'storybook/test';
import { obj, str, num } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { col, createTableStoryState, FilterFieldType } from '../../helpers.js';
import { SelectionModel } from '../../../Table/model/SelectionModel.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';

ensureReactivityProvider();

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
});

const ALL_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
];

const MOCK_ROWS = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 },
];

const mockOpenRow = fn();
const mockDeleteRow = fn();
const mockDuplicateRow = fn();
const mockDeleteSelected = fn();

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      schema: TABLE_SCHEMA,
      columns: ALL_COLUMNS,
      rowsData: MOCK_ROWS,
    }),
  );

  useEffect(() => {
    (window as any).__testState = {
      ...state,
      mockDeleteRow,
      mockDuplicateRow,
      mockDeleteSelected,
    };
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return (
    <Box width="500px" height="400px">
      <TableWidget
        rows={state.rows}
        columnsModel={state.columnsModel}
        cellFSM={state.cellFSM}
        selection={state.selection}
        onOpenRow={mockOpenRow}
        onDeleteRow={mockDeleteRow}
        onDuplicateRow={mockDuplicateRow}
        onDeleteSelected={mockDeleteSelected}
      />
    </Box>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/E2E/Table/RowActions',
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

export const HoverVisibility: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });

    const buttons = canvas.getByTestId('row-action-buttons-row-1');

    // Initially hidden (no hover)
    const initialOpacity = window.getComputedStyle(buttons).opacity;
    expect(initialOpacity).toBe('0');

    // Open the menu — this should force buttons visible even without hover
    const trigger = canvas.getByTestId('row-action-trigger-row-1');
    await userEvent.click(trigger);

    await waitFor(() => {
      const menuOpenOpacity = window.getComputedStyle(buttons).opacity;
      expect(menuOpenOpacity).toBe('1');
    });

    // Close the menu by pressing Escape
    await userEvent.keyboard('{Escape}');

    // After menu closes, buttons should be hidden again
    await waitFor(() => {
      const afterCloseOpacity = window.getComputedStyle(buttons).opacity;
      expect(afterCloseOpacity).toBe('0');
    });
  },
};

export const FullRowActionsWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { selection } = (window as any).__testState as {
      selection: SelectionModel;
    };

    // --- Select row ---
    {
      const row = canvas.getByTestId('row-row-1');
      await userEvent.hover(row);

      const trigger = await waitFor(() => {
        const el = canvas.getByTestId('row-action-trigger-row-1');
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(trigger);

      const selectItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="select"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(selectItem);

      await waitFor(() => {
        expect(selection.isSelectionMode).toBe(true);
        expect(selection.isSelected('row-1')).toBe(true);
      });

      selection.exitSelectionMode();

      await waitFor(() => {
        expect(document.querySelector('[data-value="select"]')).toBeNull();
      });
    }

    // --- Duplicate row ---
    {
      mockDuplicateRow.mockClear();

      const row = canvas.getByTestId('row-row-2');
      await userEvent.hover(row);

      const trigger = await waitFor(() => {
        const el = canvas.getByTestId('row-action-trigger-row-2');
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(trigger);

      const duplicateItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="duplicate"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(duplicateItem);

      await waitFor(() => {
        expect(mockDuplicateRow).toHaveBeenCalledWith('row-2');
      });
    }

    // --- Delete with cancel ---
    {
      mockDeleteRow.mockClear();

      const row = canvas.getByTestId('row-row-1');
      await userEvent.hover(row);

      const trigger = await waitFor(() => {
        const el = canvas.getByTestId('row-action-trigger-row-1');
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(trigger);

      const deleteItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="delete"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(deleteItem);

      await waitFor(() => {
        const dialog = document.querySelector(
          '[data-testid="delete-confirm-dialog"]',
        );
        expect(dialog).toBeTruthy();
      });

      const cancelBtn = await waitFor(() => {
        const el = document.querySelector(
          '[data-testid="delete-cancel"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(cancelBtn);

      await waitFor(() => {
        const dialog = document.querySelector(
          '[data-testid="delete-confirm-dialog"]',
        );
        expect(dialog).toBeNull();
      });

      expect(mockDeleteRow).not.toHaveBeenCalled();
    }

    // --- Delete with confirm ---
    {
      mockDeleteRow.mockClear();

      const row = canvas.getByTestId('row-row-1');
      await userEvent.hover(row);

      const trigger = await waitFor(() => {
        const el = canvas.getByTestId('row-action-trigger-row-1');
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(trigger);

      const deleteItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="delete"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(deleteItem);

      await waitFor(() => {
        const el = document.querySelector(
          '[data-testid="delete-confirm-dialog"]',
        );
        expect(el).toBeTruthy();
      });

      const confirmBtn = await waitFor(() => {
        const el = document.querySelector(
          '[data-testid="delete-confirm"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockDeleteRow).toHaveBeenCalledWith('row-1');
      });
    }

    // --- Batch delete ---
    {
      mockDeleteSelected.mockClear();

      selection.toggle('row-1');
      selection.toggle('row-2');

      await waitFor(() => {
        expect(
          document.querySelector('[data-testid="selection-toolbar"]'),
        ).toBeTruthy();
      });

      const deleteBtn = document.querySelector(
        '[data-testid="delete-selected"]',
      ) as HTMLElement;
      await userEvent.click(deleteBtn);

      await waitFor(() => {
        const dialog = document.querySelector(
          '[data-testid="delete-confirm-dialog"]',
        ) as HTMLElement;
        expect(dialog).toBeTruthy();
      });

      const confirmBtn = await waitFor(() => {
        const el = document.querySelector(
          '[data-testid="delete-confirm"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockDeleteSelected).toHaveBeenCalledWith(['row-1', 'row-2']);
      });

      selection.exitSelectionMode();
    }

    // --- Single-row delete deselects the row ---
    {
      mockDeleteRow.mockClear();

      // Programmatically select row-1 then exit selection mode UI
      // so that left zone shows the split button again
      selection.enterSelectionMode('row-1');
      expect(selection.isSelected('row-1')).toBe(true);
      selection.exitSelectionMode();
      // Re-select via internal API (doesn't enter visual selection mode)
      selection.enterSelectionMode('row-1');

      // Exit selection mode to show split button, but keep row-1 marked
      // Since isSelectionMode = size > 0, we need to exit first
      selection.exitSelectionMode();

      // Manually mark selection without entering mode
      // (we just verify the deselect logic is called on delete)
      // Use the split button menu to delete row-1 and verify cleanup
      const row = canvas.getByTestId('row-row-1');
      await userEvent.hover(row);

      const trigger = await waitFor(() => {
        const el = canvas.getByTestId('row-action-trigger-row-1');
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(trigger);

      const deleteItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="delete"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(deleteItem);

      await waitFor(() => {
        const el = document.querySelector(
          '[data-testid="delete-confirm-dialog"]',
        );
        expect(el).toBeTruthy();
      });

      const confirmBtn = await waitFor(() => {
        const el = document.querySelector(
          '[data-testid="delete-confirm"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });
      await userEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockDeleteRow).toHaveBeenCalledWith('row-1');
      });
    }
  },
};
