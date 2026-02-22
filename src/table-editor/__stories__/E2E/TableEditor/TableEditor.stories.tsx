import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { obj, str, num, bool } from '@revisium/schema-toolkit';
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
  MANY_COLUMNS,
  MANY_COLUMNS_SCHEMA,
  MANY_COLUMNS_ROWS,
} from '../../../TableEditor/__stories__/tableEditorTestData.js';

ensureReactivityProvider();

const noop = () => {};

const READONLY_SCHEMA = obj({
  name: str({ readOnly: true }),
  age: num({ readOnly: true }),
  active: bool({ readOnly: true }),
});

function createEditableState(): TableEditorStoryState {
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

function createManyColumnsState(): TableEditorStoryState {
  return createTableEditorStoryState({
    schema: MANY_COLUMNS_SCHEMA,
    columns: MANY_COLUMNS,
    rowsData: MANY_COLUMNS_ROWS,
    callbacks: {
      onOpenRow: noop,
      onDuplicateRow: noop,
    },
  });
}

function createReadonlyState(): TableEditorStoryState {
  return createTableEditorStoryState({
    schema: READONLY_SCHEMA,
    columns: TEST_COLUMNS,
    rowsData: MOCK_ROWS_DATA,
    readonly: true,
  });
}

const EditableE2EWrapper = observer(() => {
  const [state] = useState(createEditableState);

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return <StoryWrapper state={state} />;
});

const ReadonlyE2EWrapper = observer(() => {
  const [state] = useState(createReadonlyState);

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return <StoryWrapper state={state} />;
});

const meta: Meta<typeof EditableE2EWrapper> = {
  component: EditableE2EWrapper as any,
  title: 'TableEditor/E2E/TableEditor/TableEditor',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof EditableE2EWrapper>;

// --- Story 1: Editable workflow (filter, sort, search, viewBadge, column visibility) ---

export const EditableWorkflow: Story = {
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

    // 1. Filter workflow: open filter → add condition → verify
    const filterTrigger = canvas.getByTestId('filter-trigger');
    await userEvent.click(filterTrigger);

    await waitFor(() => {
      expect(screen.getByTestId('footer-add-condition')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('footer-add-condition'));

    await waitFor(() => {
      expect(screen.getByTestId('filter-condition')).toBeVisible();
    });

    expect(state.core.filters.rootGroup.conditions).toHaveLength(1);

    await userEvent.keyboard('{Escape}');

    // 2. Sort workflow: open sort → add sort → verify
    const sortTrigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(sortTrigger);

    await waitFor(() => {
      expect(screen.getByTestId('add-sort')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('add-sort'));

    await waitFor(() => {
      expect(screen.getByTestId('sort-row')).toBeVisible();
    });

    expect(state.core.sorts.sorts).toHaveLength(1);

    await userEvent.keyboard('{Escape}');

    // 3. Search workflow: expand search → type "Alice" → verify debounced query
    const searchTrigger = canvas.getByTestId('search-trigger');
    await userEvent.click(searchTrigger);

    const searchInput = await waitFor(() => canvas.getByTestId('search-input'));
    await userEvent.type(searchInput, 'Alice');

    expect(searchInput).toHaveValue('Alice');

    await waitFor(
      () => {
        expect(state.core.search.debouncedQuery).toBe('Alice');
      },
      { timeout: 1000 },
    );

    // 4. View settings change: add sort + apply → verify viewBadge.hasChanges
    state.core.sorts.addSort('age', 'asc');
    state.core.sorts.apply();

    await waitFor(() => {
      expect(state.core.viewBadge.hasChanges).toBe(true);
    });

    await waitFor(() => {
      expect(canvas.getByTestId('view-settings-badge')).toBeVisible();
    });

    // 5. Column visibility: hide age column → verify 2 columns
    expect(state.core.columns.visibleColumns).toHaveLength(3);

    await waitFor(() => {
      expect(canvas.getByTestId('header-age')).toBeVisible();
    });

    const ageHeader = canvas.getByTestId('header-age');
    await userEvent.click(ageHeader);

    const hideItem = await waitFor(() => {
      const el = document.querySelector('[data-value="hide"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(hideItem);

    await waitFor(() => {
      expect(state.core.columns.visibleColumns).toHaveLength(2);
      expect(
        state.core.columns.visibleColumns.some((c) => c.field === 'age'),
      ).toBe(false);
    });
  },
};

// --- Story 2: Readonly workflow (cells, menus, badge, filter, sort, search, column, focus, context menus) ---

export const ReadonlyWorkflow: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    // 1. Verify cells are readonly and not editable
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toBeVisible();
    });

    expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('Alice');

    const row1 = state.core.rows[0];
    expect(row1).toBeDefined();
    const cellVM = row1.getCellVM(TEST_COLUMNS[0]);
    expect(cellVM.isReadOnly).toBe(true);
    expect(cellVM.isEditable).toBe(false);

    const cellVM2 = row1.getCellVM(TEST_COLUMNS[1]);
    expect(cellVM2.isReadOnly).toBe(true);
    expect(cellVM2.isEditable).toBe(false);

    const cellVM3 = row1.getCellVM(TEST_COLUMNS[2]);
    expect(cellVM3.isReadOnly).toBe(true);
    expect(cellVM3.isEditable).toBe(false);

    // 2. Verify no left zone menus (readonly has no action callbacks)
    expect(canvas.queryByTestId('row-action-trigger-row-1')).toBeNull();
    expect(canvas.queryByTestId('row-action-trigger-row-2')).toBeNull();
    expect(canvas.queryByTestId('row-action-trigger-row-3')).toBeNull();

    // 3. Verify local badge behavior (canSave=false, add sort, revert visible, no save)
    expect(state.core.viewBadge.canSave).toBe(false);

    state.core.sorts.addSort('age', 'asc');
    state.core.sorts.apply();

    await waitFor(() => {
      expect(state.core.viewBadge.hasChanges).toBe(true);
    });

    const badge = await waitFor(() => {
      return canvas.getByTestId('view-settings-badge');
    });

    expect(badge).toHaveTextContent('local');

    await userEvent.click(badge);

    await waitFor(() => {
      expect(screen.getByTestId('view-settings-revert')).toBeVisible();
    });

    expect(screen.queryByTestId('view-settings-save')).toBeNull();

    await userEvent.keyboard('{Escape}');

    // 4. Filter still works in readonly
    const filterTrigger = canvas.getByTestId('filter-trigger');
    await userEvent.click(filterTrigger);

    await waitFor(() => {
      expect(screen.getByTestId('footer-add-condition')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('footer-add-condition'));

    await waitFor(() => {
      expect(screen.getByTestId('filter-condition')).toBeVisible();
    });

    expect(state.core.filters.rootGroup.conditions).toHaveLength(1);

    await userEvent.keyboard('{Escape}');

    // 5. Sort still works in readonly
    const sortTrigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(sortTrigger);

    await waitFor(() => {
      expect(screen.getByTestId('add-sort')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('add-sort'));

    await waitFor(() => {
      expect(screen.getAllByTestId('sort-row')).toHaveLength(2);
    });

    expect(state.core.sorts.sorts).toHaveLength(2);

    await userEvent.keyboard('{Escape}');

    // 6. Search still works in readonly
    const searchTrigger2 = canvas.getByTestId('search-trigger');
    await userEvent.click(searchTrigger2);

    const searchInput = await waitFor(() => canvas.getByTestId('search-input'));
    await userEvent.type(searchInput, 'Bob');

    expect(searchInput).toHaveValue('Bob');

    await waitFor(
      () => {
        expect(state.core.search.debouncedQuery).toBe('Bob');
      },
      { timeout: 1000 },
    );

    // 7. Column visibility still works in readonly
    expect(state.core.columns.visibleColumns).toHaveLength(3);

    const ageHeader = canvas.getByTestId('header-age');
    await userEvent.click(ageHeader);

    const hideItem = await waitFor(() => {
      const el = document.querySelector('[data-value="hide"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(hideItem);

    await waitFor(() => {
      expect(state.core.columns.visibleColumns).toHaveLength(2);
      expect(
        state.core.columns.visibleColumns.some((c) => c.field === 'age'),
      ).toBe(false);
    });

    // 8. Clear search to restore all rows, then test focus
    await userEvent.clear(searchInput);
    await waitFor(
      () => {
        expect(state.core.search.debouncedQuery).toBe('');
      },
      { timeout: 1000 },
    );

    await waitFor(() => {
      expect(state.core.rows).toHaveLength(MOCK_ROWS_DATA.length);
    });

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toBeVisible();
    });

    // Focus shows badge (readonly, not editing)
    const freshRow1 = state.core.rows[0];
    expect(freshRow1).toBeDefined();
    const nameCellVM = freshRow1.getCellVM(TEST_COLUMNS[0]);
    nameCellVM.focus();

    await waitFor(() => {
      expect(nameCellVM.isFocused).toBe(true);
    });

    expect(nameCellVM.isReadOnly).toBe(true);
    expect(nameCellVM.isEditing).toBe(false);

    nameCellVM.blur();

    // 9. Single cell context menu (edit/paste/clear disabled, copy-value/copy-path enabled)
    const nameCell = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(nameCell);
    await waitFor(() => {
      expect(nameCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.pointer({ keys: '[MouseRight]', target: nameCell });

    await waitFor(() => {
      expect(document.querySelector('[data-value="copy-value"]')).toBeTruthy();
    });

    const editItem = document.querySelector(
      '[data-value="edit"]',
    ) as HTMLElement;
    expect(editItem).toBeTruthy();
    expect(editItem).toHaveAttribute('data-disabled');

    const pasteItem = document.querySelector(
      '[data-value="paste"]',
    ) as HTMLElement;
    expect(pasteItem).toBeTruthy();
    expect(pasteItem).toHaveAttribute('data-disabled');

    const clearItem = document.querySelector(
      '[data-value="clear"]',
    ) as HTMLElement;
    expect(clearItem).toBeTruthy();
    expect(clearItem).toHaveAttribute('data-disabled');

    const copyValueItem = document.querySelector(
      '[data-value="copy-value"]',
    ) as HTMLElement;
    expect(copyValueItem).not.toHaveAttribute('data-disabled');

    const copyPathItem = document.querySelector(
      '[data-value="copy-json-path"]',
    ) as HTMLElement;
    expect(copyPathItem).not.toHaveAttribute('data-disabled');

    await userEvent.keyboard('{Escape}');

    // 10. Range context menu (select range, right-click, verify range menu items)
    await userEvent.click(nameCell);
    await waitFor(() => {
      expect(nameCell).toHaveAttribute('tabindex', '0');
    });

    state.core.cellFSM.selectTo({ rowId: 'row-2', field: 'name' });
    await waitFor(() => {
      expect(state.core.cellFSM.hasSelection).toBe(true);
    });

    await userEvent.pointer({ keys: '[MouseRight]', target: nameCell });

    await waitFor(() => {
      expect(document.querySelector('[data-value="copy-range"]')).toBeTruthy();
    });

    const copyRangeItem = document.querySelector(
      '[data-value="copy-range"]',
    ) as HTMLElement;
    expect(copyRangeItem).not.toHaveAttribute('data-disabled');

    const pasteRangeItem = document.querySelector(
      '[data-value="paste-range"]',
    ) as HTMLElement;
    expect(pasteRangeItem).toBeTruthy();
    expect(pasteRangeItem).not.toHaveAttribute('data-disabled');

    const clearRangeItem = document.querySelector(
      '[data-value="clear-range"]',
    ) as HTMLElement;
    expect(clearRangeItem).toBeTruthy();
    expect(clearRangeItem).not.toHaveAttribute('data-disabled');

    await userEvent.keyboard('{Escape}');
  },
};

// --- Story 3: Focus after add column (ManyColumnsE2EWrapper) ---

const ManyColumnsE2EWrapper = observer(() => {
  const [state] = useState(createManyColumnsState);

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return <StoryWrapper state={state} />;
});

export const FocusAfterAddColumn: Story = {
  tags: ['test'],
  render: () => <ManyColumnsE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    const nameCell = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(nameCell);

    await waitFor(() => {
      expect(state.core.cellFSM.state).toBe('focused');
      expect(state.core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'name',
      });
    });

    expect(document.activeElement).toBe(nameCell);

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(state.core.cellFSM.focusedCell).toEqual({
        rowId: 'row-2',
        field: 'name',
      });
    });

    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => {
      expect(state.core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'name',
      });
    });

    const addBtn = canvas.getByTestId('add-column-button');
    await userEvent.click(addBtn);

    const menuItem = await waitFor(() => {
      const el = document.querySelector('[data-value="age"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.click(menuItem);

    await waitFor(() => {
      expect(
        state.core.columns.visibleColumns.some((c) => c.field === 'age'),
      ).toBe(true);
    });

    const nameCellAfter = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(nameCellAfter);

    await waitFor(() => {
      expect(state.core.cellFSM.state).toBe('focused');
      expect(state.core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'name',
      });
      expect(document.activeElement).toBe(nameCellAfter);
    });

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => {
      expect(state.core.cellFSM.focusedCell).toEqual({
        rowId: 'row-2',
        field: 'name',
      });
    });

    const row2NameCell = canvas.getByTestId('cell-row-2-name');
    expect(document.activeElement).toBe(row2NameCell);

    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => {
      expect(state.core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'name',
      });
    });

    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(state.core.cellFSM.state).toBe('editing');
    });
  },
};

// --- Story 4: Selection edges after column reorder (EditableE2EWrapper) ---

export const SelectionEdgesAfterColumnReorder: Story = {
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

    state.core.columns.moveColumnToStart('active');

    await waitFor(() => {
      expect(canvas.getByTestId('header-active')).toBeVisible();
    });

    const activeCell = canvas.getByTestId('cell-row-1-active');
    await userEvent.click(activeCell);

    await waitFor(() => {
      expect(state.core.cellFSM.state).toBe('focused');
      expect(state.core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'active',
      });
    });

    await userEvent.keyboard(
      '{Shift>}{ArrowDown}{ArrowRight}{ArrowRight}{/Shift}',
    );

    await waitFor(() => {
      expect(state.core.cellFSM.hasSelection).toBe(true);
    });

    expect(state.core.cellFSM.isCellInSelection('row-1', 'name')).toBe(true);
    expect(state.core.cellFSM.isCellInSelection('row-2', 'name')).toBe(true);

    const nameCell = canvas.getByTestId('cell-row-1-name');
    const style = window.getComputedStyle(nameCell);
    expect(style.backgroundColor).not.toBe('rgb(255, 255, 255)');
    expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
  },
};

// --- Story 5: Blur on click outside (BlurTestWrapper) ---

const BlurTestWrapper = observer(() => {
  const [state] = useState(createEditableState);

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return (
    <Box>
      <button data-testid="outside-button">Outside</button>
      <StoryWrapper state={state} />
    </Box>
  );
});

export const BlurOnClickOutside: Story = {
  tags: ['test'],
  render: () => <BlurTestWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.isBootstrapping).toBe(false);
    });

    const nameCell = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(nameCell);

    await waitFor(() => {
      expect(state.core.cellFSM.state).toBe('focused');
      expect(state.core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'name',
      });
    });

    expect(document.activeElement).toBe(nameCell);

    const outsideButton = canvas.getByTestId('outside-button');
    await userEvent.click(outsideButton);

    await waitFor(() => {
      expect(state.core.cellFSM.state).toBe('idle');
      expect(state.core.cellFSM.focusedCell).toBeNull();
    });
  },
};
