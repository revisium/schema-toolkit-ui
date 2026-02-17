import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import type { JsonSchema } from '@revisium/schema-toolkit';
import { expect, within, waitFor, screen, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  col,
  createTableEditorStoryState,
  FilterFieldType,
  type TableEditorStoryState,
} from '../../../__stories__/helpers.js';
import { StoryWrapper } from '../TableEditor.stories.js';

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

const READONLY_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: '', readOnly: true },
    age: { type: 'number', default: 0, readOnly: true },
    active: { type: 'boolean', default: false, readOnly: true },
  },
  additionalProperties: false,
  required: ['name', 'age', 'active'],
} as JsonSchema;

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

const MANY_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
  col('email', FilterFieldType.String),
  col('score', FilterFieldType.Number),
  col('city', FilterFieldType.String),
];

const MANY_COLUMNS_SCHEMA = {
  type: 'object' as const,
  properties: {
    name: { type: 'string', default: '' },
    age: { type: 'number', default: 0 },
    active: { type: 'boolean', default: false },
    email: { type: 'string', default: '' },
    score: { type: 'number', default: 0 },
    city: { type: 'string', default: '' },
  },
  additionalProperties: false,
  required: ['name', 'age', 'active', 'email', 'score', 'city'],
};

const MANY_COLUMNS_ROWS = [
  {
    name: 'Alice',
    age: 30,
    active: true,
    email: 'alice@example.com',
    score: 95,
    city: 'New York',
  },
  {
    name: 'Bob',
    age: 25,
    active: false,
    email: 'bob@example.com',
    score: 80,
    city: 'London',
  },
  {
    name: 'Charlie',
    age: 35,
    active: true,
    email: 'charlie@example.com',
    score: 72,
    city: 'Tokyo',
  },
];

function createEditableState(): TableEditorStoryState {
  return createTableEditorStoryState({
    schema: TABLE_SCHEMA,
    columns: TEST_COLUMNS,
    rowsData: MOCK_ROWS_DATA,
  });
}

function createManyColumnsState(): TableEditorStoryState {
  return createTableEditorStoryState({
    schema: MANY_COLUMNS_SCHEMA,
    columns: MANY_COLUMNS,
    rowsData: MANY_COLUMNS_ROWS,
  });
}

function createReadonlyState(): TableEditorStoryState {
  const s = createTableEditorStoryState({
    schema: READONLY_SCHEMA,
    columns: TEST_COLUMNS,
    rowsData: MOCK_ROWS_DATA,
  });
  s.core.viewBadge.setCanSave(false);
  return s;
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

  return <StoryWrapper state={state} readonly />;
});

const meta: Meta<typeof EditableE2EWrapper> = {
  component: EditableE2EWrapper as any,
  title: 'TableEditor/E2E/TableEditor',
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

// --- Editable mode tests ---

export const FilterWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });

    const trigger = canvas.getByTestId('filter-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('footer-add-condition')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('footer-add-condition'));

    await waitFor(() => {
      expect(screen.getByTestId('filter-condition')).toBeVisible();
    });

    const state = (window as any).__testState as TableEditorStoryState;
    expect(state.core.filters.rootGroup.conditions).toHaveLength(1);
  },
};

export const SortWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    const trigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('add-sort')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('add-sort'));

    await waitFor(() => {
      expect(screen.getByTestId('sort-row')).toBeVisible();
    });

    expect(state.core.sorts.sorts).toHaveLength(1);
  },
};

export const SearchWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    const input = canvas.getByTestId('search-input');
    await userEvent.type(input, 'Alice');

    expect(input).toHaveValue('Alice');

    await waitFor(
      () => {
        expect(state.core.search.debouncedQuery).toBe('Alice');
      },
      { timeout: 1000 },
    );
  },
};

export const ViewSettingsChange: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    expect(state.core.viewBadge.hasChanges).toBe(false);

    state.core.sorts.addSort('age', 'asc');

    await waitFor(() => {
      expect(state.core.viewBadge.hasChanges).toBe(true);
    });

    await waitFor(() => {
      expect(canvas.getByTestId('view-settings-badge')).toBeVisible();
    });
  },
};

export const ColumnVisibility: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

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

// --- Readonly mode tests ---

export const ReadonlyCellsNotEditable: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toBeVisible();
    });

    expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('Alice');

    const row1 = state.rows[0];
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
  },
};

export const ReadonlyNoRowActionsMenu: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toBeVisible();
    });

    expect(canvas.queryByTestId('row-menu-trigger-row-1')).toBeNull();
    expect(canvas.queryByTestId('row-menu-trigger-row-2')).toBeNull();
    expect(canvas.queryByTestId('row-menu-trigger-row-3')).toBeNull();
  },
};

export const ReadonlyLocalBadge: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    expect(state.core.viewBadge.canSave).toBe(false);

    state.core.sorts.addSort('age', 'asc');

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
  },
};

export const ReadonlyFilterStillWorks: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    const trigger = canvas.getByTestId('filter-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('footer-add-condition')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('footer-add-condition'));

    await waitFor(() => {
      expect(screen.getByTestId('filter-condition')).toBeVisible();
    });

    expect(state.core.filters.rootGroup.conditions).toHaveLength(1);
  },
};

export const ReadonlySortStillWorks: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    const trigger = canvas.getByTestId('sort-trigger');
    await userEvent.click(trigger);

    await waitFor(() => {
      expect(screen.getByTestId('add-sort')).toBeVisible();
    });

    await userEvent.click(screen.getByTestId('add-sort'));

    await waitFor(() => {
      expect(screen.getByTestId('sort-row')).toBeVisible();
    });

    expect(state.core.sorts.sorts).toHaveLength(1);
  },
};

export const ReadonlySearchStillWorks: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    const input = canvas.getByTestId('search-input');
    await userEvent.type(input, 'Bob');

    expect(input).toHaveValue('Bob');

    await waitFor(
      () => {
        expect(state.core.search.debouncedQuery).toBe('Bob');
      },
      { timeout: 1000 },
    );
  },
};

export const ReadonlyColumnVisibility: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

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
  },
};

export const ReadonlyFocusShowsBadge: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toBeVisible();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    const row1 = state.rows[0];
    expect(row1).toBeDefined();
    const cellVM = row1.getCellVM(TEST_COLUMNS[0]);

    cellVM.focus();

    await waitFor(() => {
      expect(cellVM.isFocused).toBe(true);
    });

    expect(cellVM.isReadOnly).toBe(true);
    expect(cellVM.isEditing).toBe(false);
  },
};

export const ReadonlySingleCellContextMenu: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toBeVisible();
    });

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
  },
};

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

export const ReadonlyRangeContextMenu: Story = {
  tags: ['test'],
  render: () => <ReadonlyE2EWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

    const nameCell = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(nameCell);
    await waitFor(() => {
      expect(nameCell).toHaveAttribute('tabindex', '0');
    });

    state.core.cellFSM.selectTo({ rowId: 'row-2', field: 'age' });
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
    expect(pasteRangeItem).toHaveAttribute('data-disabled');

    const clearRangeItem = document.querySelector(
      '[data-value="clear-range"]',
    ) as HTMLElement;
    expect(clearRangeItem).toBeTruthy();
    expect(clearRangeItem).toHaveAttribute('data-disabled');

    await userEvent.keyboard('{Escape}');
  },
};

export const SelectionEdgesAfterColumnReorder: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableEditorStoryState;

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
