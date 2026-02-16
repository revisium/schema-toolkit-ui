import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent, fn } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../../lib/initReactivity.js';
import {
  col,
  createTableStoryState,
  FilterFieldType,
} from '../../../../__stories__/helpers.js';
import { SelectionModel } from '../../../model/SelectionModel.js';
import { TableWidget } from '../../TableWidget.js';

ensureReactivityProvider();

const TABLE_SCHEMA = {
  type: 'object' as const,
  properties: {
    name: { type: 'string', default: '' },
    age: { type: 'number', default: 0 },
  },
  additionalProperties: false,
  required: ['name', 'age'],
};

const ALL_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
];

const MOCK_ROWS = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 },
];

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
    <Box width="500px" height="400px" borderWidth="1px" borderColor="gray.200">
      <TableWidget
        rows={state.rows}
        columnsModel={state.columnsModel}
        cellFSM={state.cellFSM}
        selection={state.selection}
        onDeleteRow={mockDeleteRow}
        onDuplicateRow={mockDuplicateRow}
        onDeleteSelected={mockDeleteSelected}
      />
    </Box>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/E2E/RowActions',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
  beforeEach: () => {
    mockDeleteRow.mockClear();
    mockDuplicateRow.mockClear();
    mockDeleteSelected.mockClear();
  },
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const SelectRow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { selection } = (window as any).__testState as {
      selection: SelectionModel;
    };

    const row = canvas.getByTestId('row-row-1');
    await userEvent.hover(row);

    const trigger = await waitFor(() => {
      const el = canvas.getByTestId('row-menu-trigger-row-1');
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(trigger);

    const selectItem = await waitFor(() => {
      const el = document.querySelector('[data-value="select"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(selectItem);

    await waitFor(() => {
      expect(selection.isSelectionMode).toBe(true);
      expect(selection.isSelected('row-1')).toBe(true);
    });
  },
};

export const DuplicateRow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });

    const row = canvas.getByTestId('row-row-2');
    await userEvent.hover(row);

    const trigger = await waitFor(() => {
      const el = canvas.getByTestId('row-menu-trigger-row-2');
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
  },
};

export const DeleteRowWithConfirm: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });

    const row = canvas.getByTestId('row-row-1');
    await userEvent.hover(row);

    const trigger = await waitFor(() => {
      const el = canvas.getByTestId('row-menu-trigger-row-1');
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(trigger);

    const deleteItem = await waitFor(() => {
      const el = document.querySelector('[data-value="delete"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(deleteItem);

    const dialog = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="delete-confirm-dialog"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(dialog).toBeVisible();

    const confirmBtn = document.querySelector(
      '[data-testid="delete-confirm"]',
    ) as HTMLElement;
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteRow).toHaveBeenCalledWith('row-1');
    });
  },
};

export const DeleteRowCancel: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });

    const row = canvas.getByTestId('row-row-1');
    await userEvent.hover(row);

    const trigger = await waitFor(() => {
      const el = canvas.getByTestId('row-menu-trigger-row-1');
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(trigger);

    const deleteItem = await waitFor(() => {
      const el = document.querySelector('[data-value="delete"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(deleteItem);

    await waitFor(() => {
      const dialog = document.querySelector(
        '[data-testid="delete-confirm-dialog"]',
      ) as HTMLElement;
      expect(dialog).toBeTruthy();
    });

    const cancelBtn = document.querySelector(
      '[data-testid="delete-cancel"]',
    ) as HTMLElement;
    await userEvent.click(cancelBtn);

    await waitFor(() => {
      const dialog = document.querySelector(
        '[data-testid="delete-confirm-dialog"]',
      );
      expect(dialog).toBeNull();
    });

    expect(mockDeleteRow).not.toHaveBeenCalled();
  },
};

export const BatchDeleteWithConfirm: Story = {
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
    selection.toggle('row-2');

    await waitFor(() => {
      expect(canvas.getByTestId('selection-toolbar')).toBeVisible();
    });

    const deleteBtn = canvas.getByTestId('delete-selected');
    await userEvent.click(deleteBtn);

    await waitFor(() => {
      const dialog = document.querySelector(
        '[data-testid="delete-confirm-dialog"]',
      ) as HTMLElement;
      expect(dialog).toBeTruthy();
    });

    const confirmBtn = document.querySelector(
      '[data-testid="delete-confirm"]',
    ) as HTMLElement;
    await userEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockDeleteSelected).toHaveBeenCalledWith(['row-1', 'row-2']);
    });
  },
};
