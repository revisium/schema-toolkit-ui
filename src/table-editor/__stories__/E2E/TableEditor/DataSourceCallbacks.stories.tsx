import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, screen, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  createTableEditorStoryState,
  type TableEditorStoryState,
} from '../../helpers.js';
import { StoryWrapper } from '../../../TableEditor/__stories__/TableEditor.stories.js';
import {
  TABLE_SCHEMA,
  TEST_COLUMNS,
  MOCK_ROWS_DATA,
} from '../../../TableEditor/__stories__/tableEditorTestData.js';

ensureReactivityProvider();

const noop = () => {};

function createState(): TableEditorStoryState {
  return createTableEditorStoryState({
    schema: TABLE_SCHEMA,
    columns: TEST_COLUMNS,
    rowsData: MOCK_ROWS_DATA,
    callbacks: {
      onOpenRow: noop,
      onDuplicateRow: noop,
    },
  });
}

const Wrapper = observer(() => {
  const [state] = useState(createState);

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return <StoryWrapper state={state} />;
});

const meta: Meta<typeof Wrapper> = {
  component: Wrapper as any,
  title: 'TableEditor/E2E/TableEditor/DataSourceCallbacks',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof Wrapper>;

export const CellEditCallsPatchCells: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    const { dataSource } = state;
    const initialPatchCount = dataSource.patchLog.length;

    // Double-click cell to enter edit mode
    const nameCell = canvas.getByTestId('cell-row-1-name');
    await userEvent.dblClick(nameCell);

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    // Type new value and commit via blur
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated');
    input.blur();

    // Verify cell shows new value
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent(
        'Updated',
      );
    });

    // Verify dataSource.patchCells was called
    await waitFor(() => {
      expect(dataSource.patchLog.length).toBeGreaterThan(initialPatchCount);
    });

    const lastPatch = dataSource.patchLog.at(-1);
    expect(lastPatch).toEqual([
      { rowId: 'row-1', field: 'name', value: 'Updated' },
    ]);
  },
};

export const DeleteRowCallsDeleteRows: Story = {
  tags: ['test'],
  render: () => <Wrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    const { dataSource } = state;
    const initialRowCount = state.core.rows.length;
    const initialDeleteCount = dataSource.deleteLog.length;

    // Hover row to show action menu
    const row = canvas.getByTestId('row-row-1');
    await userEvent.hover(row);

    const trigger = await waitFor(() => {
      const el = canvas.getByTestId('row-action-trigger-row-1');
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(trigger);

    // Click delete in menu
    const deleteItem = await waitFor(() => {
      const el = document.querySelector('[data-value="delete"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(deleteItem);

    // Confirm delete
    const confirmBtn = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="delete-confirm"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(confirmBtn);

    // Verify dataSource.deleteRows was called
    await waitFor(() => {
      expect(dataSource.deleteLog.length).toBeGreaterThan(initialDeleteCount);
    });

    expect(dataSource.deleteLog.at(-1)).toEqual(['row-1']);

    // Verify row removed from UI
    await waitFor(() => {
      expect(state.core.rows.length).toBe(initialRowCount - 1);
    });

    expect(canvas.queryByTestId('cell-row-1-name')).toBeNull();
  },
};

export const SaveViewCallsSaveView: Story = {
  tags: ['test'],
  render: () => <Wrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    const { dataSource } = state;
    const initialSaveCount = dataSource.saveViewLog.length;

    // Add sort and apply to trigger view changes
    state.core.sorts.addSort('name', 'asc');
    state.core.sorts.apply();

    await waitFor(() => {
      expect(state.core.viewBadge.hasChanges).toBe(true);
    });

    // Click the badge to open popover
    const badge = await waitFor(() => {
      return canvas.getByTestId('view-settings-badge');
    });
    await userEvent.click(badge);

    // Click Save button
    const saveBtn = await waitFor(() => {
      return screen.getByTestId('view-settings-save');
    });
    await userEvent.click(saveBtn);

    // Verify dataSource.saveView was called
    await waitFor(() => {
      expect(dataSource.saveViewLog.length).toBeGreaterThan(initialSaveCount);
    });

    const savedState = dataSource.saveViewLog.at(-1);
    expect(savedState?.sorts).toEqual([
      { field: 'data.name', direction: 'asc' },
    ]);

    // Badge disappears after successful save
    await waitFor(() => {
      expect(state.core.viewBadge.hasChanges).toBe(false);
    });
  },
};

export const SearchCallsFetchRowsWithQuery: Story = {
  tags: ['test'],
  render: () => <Wrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    const { dataSource } = state;
    const fetchCountBefore = dataSource.fetchLog.length;

    // Expand search and type
    const searchTrigger = canvas.getByTestId('search-trigger');
    await userEvent.click(searchTrigger);

    const searchInput = await waitFor(() => canvas.getByTestId('search-input'));
    await userEvent.type(searchInput, 'Alice');

    // Wait for debounced query
    await waitFor(
      () => {
        expect(state.core.search.debouncedQuery).toBe('Alice');
      },
      { timeout: 1000 },
    );

    // Verify fetchRows called with search param
    await waitFor(() => {
      expect(dataSource.fetchLog.length).toBeGreaterThan(fetchCountBefore);
    });

    const lastQuery = dataSource.fetchLog.at(-1);
    expect(lastQuery?.search).toBe('Alice');

    // Verify rows filtered — only Alice visible
    await waitFor(() => {
      expect(state.core.rows).toHaveLength(1);
    });

    expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('Alice');
  },
};

export const SortApplyCallsFetchRowsWithOrderBy: Story = {
  tags: ['test'],
  render: () => <Wrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    const { dataSource } = state;

    // Open sort popover and add sort via UI
    const sortTrigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(sortTrigger);

    await waitFor(() => {
      expect(screen.getByTestId('add-sort')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('add-sort'));

    await waitFor(() => {
      expect(screen.getByTestId('sort-row')).toBeVisible();
    });

    // Apply sort via the apply button
    const applyBtn = await waitFor(() => {
      return screen.getByTestId('apply-sorts');
    });

    const fetchCountBefore = dataSource.fetchLog.length;
    await userEvent.click(applyBtn);

    // Verify fetchRows called with orderBy
    await waitFor(() => {
      expect(dataSource.fetchLog.length).toBeGreaterThan(fetchCountBefore);
    });

    const lastQuery = dataSource.fetchLog.at(-1);
    expect(lastQuery?.orderBy).toBeDefined();
    expect(lastQuery?.orderBy.length).toBeGreaterThan(0);

    await userEvent.keyboard('{Escape}');
  },
};
