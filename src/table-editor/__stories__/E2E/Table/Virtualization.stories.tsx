import { useCallback, useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, waitFor, within } from 'storybook/test';
import { obj, str, num } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { createTableStoryState, type TableStoryState } from '../../helpers.js';
import { SelectionModel } from '../../../Table/model/SelectionModel.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';

ensureReactivityProvider();

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
});

const noop = () => {};

const LargeTableWrapper = observer(
  ({ rowCount = 500 }: { rowCount?: number }) => {
    const rowsData = Array.from({ length: rowCount }, (_, i) => ({
      name: `User ${i + 1}`,
      age: 20 + (i % 50),
    }));

    const [state] = useState(() =>
      createTableStoryState({
        dataSchema: TABLE_SCHEMA,
        rowsData,
      }),
    );

    useEffect(() => {
      (window as any).__testState = state;
      return () => {
        delete (window as any).__testState;
      };
    }, [state]);

    return (
      <Box width="500px">
        <TableWidget
          rows={state.rows}
          columnsModel={state.columnsModel}
          cellFSM={state.cellFSM}
          selection={state.selection}
          onOpenRow={noop}
          onDeleteRow={noop}
          onDuplicateRow={noop}
          onDeleteSelected={noop}
        />
      </Box>
    );
  },
);

const PAGE_SIZE = 50;

const InfiniteScrollWrapper = observer(() => {
  const allRowsData = Array.from({ length: 200 }, (_, i) => ({
    name: `User ${i + 1}`,
    age: 20 + (i % 50),
  }));

  const [state] = useState(() =>
    createTableStoryState({
      dataSchema: TABLE_SCHEMA,
      rowsData: allRowsData,
    }),
  );

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const visibleRows = state.rows.slice(0, visibleCount);

  useEffect(() => {
    (window as any).__testState = {
      ...state,
      getVisibleCount: () => visibleCount,
    };
    return () => {
      delete (window as any).__testState;
    };
  }, [state, visibleCount]);

  const handleEndReached = useCallback(() => {
    if (loading || visibleCount >= 200) {
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, 200));
      setLoading(false);
    }, 100);
  }, [loading, visibleCount]);

  return (
    <Box width="500px" borderWidth="1px" borderColor="gray.200">
      <TableWidget
        rows={visibleRows}
        columnsModel={state.columnsModel}
        cellFSM={state.cellFSM}
        selection={state.selection}
        onDeleteRow={noop}
        onDuplicateRow={noop}
        onDeleteSelected={noop}
        onEndReached={handleEndReached}
        isLoadingMore={loading}
      />
    </Box>
  );
});

const meta: Meta = {
  title: 'TableEditor/E2E/Table/Virtualization',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj;

export const ScrollAndRender: Story = {
  tags: ['test'],
  render: () => <LargeTableWrapper rowCount={500} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });

    await waitFor(() => {
      expect(canvas.getByTestId('row-row-1')).toBeVisible();
    });

    expect(canvas.queryByTestId('row-row-500')).toBeNull();

    const row1 = canvas.getByTestId('cell-row-1-name');
    expect(row1).toHaveTextContent('User 1');
  },
};

export const EndReachedLoadsMore: Story = {
  tags: ['test'],
  render: () => <InfiniteScrollWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });

    await waitFor(() => {
      expect(canvas.getByTestId('row-row-1')).toBeVisible();
    });

    expect(canvas.queryByTestId('row-row-51')).toBeNull();

    const { getVisibleCount } = (window as any).__testState as {
      getVisibleCount: () => number;
    };
    expect(getVisibleCount()).toBe(50);
  },
};

export const SelectionAcrossVirtualizedRows: Story = {
  tags: ['test'],
  render: () => <LargeTableWrapper rowCount={200} />,
  play: async () => {
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { selection } = (window as any).__testState as {
      selection: SelectionModel;
    };

    selection.toggle('row-1');
    selection.toggle('row-100');

    await waitFor(() => {
      expect(selection.selectedCount).toBe(2);
      expect(selection.isSelected('row-1')).toBe(true);
      expect(selection.isSelected('row-100')).toBe(true);
    });

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="selection-toolbar"]'),
      ).toBeTruthy();
    });

    selection.exitSelectionMode();

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="selection-toolbar"]'),
      ).toBeNull();
    });
  },
};

export const CellEditingOnVisibleRow: Story = {
  tags: ['test'],
  render: () => <LargeTableWrapper rowCount={50} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableStoryState;

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toBeVisible();
    });

    state.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    state.cellFSM.enterEdit();

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(input.value).toBe('User 1');
  },
};
