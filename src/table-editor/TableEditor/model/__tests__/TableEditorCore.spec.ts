import { jest } from '@jest/globals';
import { FilterFieldType } from '../../../shared/field-types';
import { testCol as col } from '../../../__tests__/helpers';
import { TableEditorCore } from '../TableEditorCore';

const TEST_COLUMNS = [
  col({ field: 'name' }),
  col({ field: 'age', fieldType: FilterFieldType.Number }),
  col({ field: 'id', isSystem: true }),
];

const MANY_COLUMNS = [
  col({ field: 'name' }),
  col({ field: 'age', fieldType: FilterFieldType.Number }),
  col({ field: 'active', fieldType: FilterFieldType.Boolean }),
  col({ field: 'email' }),
  col({ field: 'score', fieldType: FilterFieldType.Number }),
  col({ field: 'city' }),
];

describe('TableEditorCore', () => {
  it('init initializes all sub-models', () => {
    const core = new TableEditorCore();
    core.init(TEST_COLUMNS);
    expect(core.columns.visibleColumns.length).toBeGreaterThan(0);
    expect(core.sorts.sorts).toHaveLength(0);
    expect(core.filters.totalConditionCount).toBe(0);
  });

  it('applyFilter builds where clause and calls onFilter', () => {
    const onFilter = jest.fn();
    const core = new TableEditorCore({ onFilter });
    core.init(TEST_COLUMNS);
    core.filters.addCondition();
    const id = core.filters.rootGroup.conditions[0]?.id;
    if (id) {
      core.filters.updateCondition(id, { value: 'test' });
    }
    core.applyFilter();
    expect(onFilter).toHaveBeenCalled();
    const arg = onFilter.mock.calls[0]?.[0] as Record<string, unknown> | null;
    expect(arg).not.toBeNull();
    expect(arg).toHaveProperty('data');
  });

  it('sort change calls onSort', () => {
    const onSort = jest.fn();
    const core = new TableEditorCore({ onSort });
    core.init(TEST_COLUMNS);
    core.sorts.addSort('name');
    expect(onSort).toHaveBeenCalledWith([
      { field: 'data.name', direction: 'asc' },
    ]);
  });

  it('search calls onSearch', () => {
    const onSearch = jest.fn();
    const core = new TableEditorCore({ onSearch });
    core.init(TEST_COLUMNS);
    core.search.clear();
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('columns change calls onColumnsChange', () => {
    const onColumnsChange = jest.fn();
    const core = new TableEditorCore({ onColumnsChange });
    core.init(TEST_COLUMNS);
    const hidden = core.columns.hiddenColumns;
    if (hidden.length > 0) {
      core.columns.showColumn(hidden[0]!.field);
      expect(onColumnsChange).toHaveBeenCalled();
    }
  });

  it('getViewState serializes current state', () => {
    const core = new TableEditorCore();
    core.init(TEST_COLUMNS);
    core.sorts.addSort('name');
    const state = core.getViewState();
    expect(state.columns.length).toBeGreaterThan(0);
    expect(state.sorts).toEqual([{ field: 'data.name', direction: 'asc' }]);
    expect(state.filters).toBeNull();
    expect(state.search).toBe('');
  });

  it('applyViewState restores state', () => {
    const core = new TableEditorCore();
    core.init(TEST_COLUMNS);
    const state = core.getViewState();
    const core2 = new TableEditorCore();
    core2.init(TEST_COLUMNS);
    core2.sorts.addSort('age');
    core2.applyViewState(state);
    expect(core2.sorts.sorts).toHaveLength(0);
  });

  it('applyViewState restores filters', () => {
    const core = new TableEditorCore();
    core.init(TEST_COLUMNS);
    core.filters.addCondition();
    const id = core.filters.rootGroup.conditions[0]?.id;
    if (id) {
      core.filters.updateCondition(id, { value: 'test' });
    }
    core.filters.apply();
    const state = core.getViewState();
    expect(state.filters).not.toBeNull();

    const core2 = new TableEditorCore();
    core2.init(TEST_COLUMNS);
    core2.applyViewState(state);
    expect(core2.filters.hasActiveFilters).toBe(true);
    expect(core2.filters.totalConditionCount).toBe(1);
  });

  it('applyViewState clears filters when state.filters is null', () => {
    const core = new TableEditorCore();
    core.init(TEST_COLUMNS);
    core.filters.addCondition();
    const id = core.filters.rootGroup.conditions[0]?.id;
    if (id) {
      core.filters.updateCondition(id, { value: 'test' });
    }
    core.filters.apply();
    expect(core.filters.hasActiveFilters).toBe(true);

    core.applyViewState({
      columns: core.columns.serializeToViewColumns(),
      filters: null,
      sorts: [],
      search: '',
    });
    expect(core.filters.hasActiveFilters).toBe(false);
    expect(core.filters.totalConditionCount).toBe(0);
  });

  it('applyViewState clears search when state.search is empty', () => {
    const core = new TableEditorCore();
    core.init(TEST_COLUMNS);
    core.search.clear();
    core.applyViewState({
      columns: core.columns.serializeToViewColumns(),
      filters: null,
      sorts: [],
      search: '',
    });
    expect(core.search.query).toBe('');
  });

  it('viewBadge detects changes after sort', () => {
    const core = new TableEditorCore();
    core.init(TEST_COLUMNS);
    expect(core.viewBadge.hasChanges).toBe(false);
    core.sorts.addSort('name');
    expect(core.viewBadge.hasChanges).toBe(true);
  });

  it('dispose cleans up all models', () => {
    const core = new TableEditorCore();
    core.init(TEST_COLUMNS);
    core.selection.toggle('row-1');
    core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });
    core.dispose();
    expect(core.selection.isSelectionMode).toBe(false);
    expect(core.cellFSM.focusedCell).toBeNull();
  });

  describe('initNavigationContext sets CellFSM columns to visible only', () => {
    it('uses only visible columns when more columns exist', () => {
      const core = new TableEditorCore();
      core.init(MANY_COLUMNS);
      core.initNavigationContext(['row-1', 'row-2']);

      const visibleFields = core.columns.visibleColumns.map((c) => c.field);
      expect(core.cellFSM.columns).toEqual(visibleFields);
    });

    it('navigation stays within visible columns', () => {
      const core = new TableEditorCore();
      core.init(MANY_COLUMNS);
      core.initNavigationContext(['row-1', 'row-2']);

      const visibleFields = core.columns.visibleColumns.map((c) => c.field);
      const lastField = visibleFields[visibleFields.length - 1]!;

      core.cellFSM.focusCell({ rowId: 'row-1', field: lastField });
      expect(core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: lastField,
      });

      core.cellFSM.moveLeft();
      const prevField = visibleFields[visibleFields.length - 2]!;
      expect(core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: prevField,
      });
    });

    it('sets rowIds correctly', () => {
      const core = new TableEditorCore();
      core.init(MANY_COLUMNS);
      core.initNavigationContext(['row-1', 'row-2', 'row-3']);

      expect(core.cellFSM.rowIds).toEqual(['row-1', 'row-2', 'row-3']);
    });
  });

  describe('column changes update CellFSM navigation', () => {
    function createCoreWithNavigation() {
      const core = new TableEditorCore();
      core.init(TEST_COLUMNS);
      core.cellFSM.setNavigationContext(
        core.columns.visibleColumns.map((c) => c.field),
        ['row-1', 'row-2', 'row-3'],
      );
      return core;
    }

    it('clears range selection when column is hidden', () => {
      const core = createCoreWithNavigation();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });
      core.cellFSM.selectTo({ rowId: 'row-2', field: 'age' });
      expect(core.cellFSM.hasSelection).toBe(true);

      core.columns.hideColumn('age');

      expect(core.cellFSM.hasSelection).toBe(false);
      expect(core.cellFSM.anchorCell).toBeNull();
    });

    it('keeps focus when focused column still visible after hide', () => {
      const core = createCoreWithNavigation();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });

      core.columns.hideColumn('age');

      expect(core.cellFSM.state).toBe('focused');
      expect(core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'name',
      });
    });

    it('blurs when focused column is hidden', () => {
      const core = createCoreWithNavigation();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'age' });

      core.columns.hideColumn('age');

      expect(core.cellFSM.state).toBe('idle');
      expect(core.cellFSM.focusedCell).toBeNull();
    });

    it('updates navigation context after column reorder', () => {
      const core = createCoreWithNavigation();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });

      core.columns.moveColumnRight('name');

      expect(core.cellFSM.state).toBe('focused');
      expect(core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'name',
      });
      expect(core.cellFSM.columns[0]).not.toBe('name');
    });

    it('FSM stays focused and responsive after showing a column', () => {
      const core = createCoreWithNavigation();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });
      expect(core.cellFSM.state).toBe('focused');

      core.columns.showColumn('id');

      expect(core.cellFSM.state).toBe('focused');
      expect(core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'name',
      });

      core.cellFSM.moveRight();
      const nextField = core.cellFSM.focusedCell?.field;
      expect(nextField).toBeTruthy();
      expect(nextField).not.toBe('name');
    });

    it('arrows work after adding column while focused', () => {
      const core = createCoreWithNavigation();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });

      core.columns.showColumn('id');

      core.cellFSM.moveDown();
      expect(core.cellFSM.focusedCell).toEqual({
        rowId: 'row-2',
        field: 'name',
      });
    });

    it('enter edit works after adding column while focused', () => {
      const core = createCoreWithNavigation();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });

      core.columns.showColumn('id');

      core.cellFSM.enterEdit();
      expect(core.cellFSM.state).toBe('editing');
    });

    it('navigationVersion increments when column is shown', () => {
      const core = createCoreWithNavigation();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });
      const before = core.cellFSM.navigationVersion;

      core.columns.showColumn('id');

      expect(core.cellFSM.navigationVersion).toBe(before + 1);
    });

    it('clears range selection after column reorder', () => {
      const core = createCoreWithNavigation();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });
      core.cellFSM.selectTo({ rowId: 'row-2', field: 'age' });
      expect(core.cellFSM.hasSelection).toBe(true);

      core.columns.moveColumnRight('name');

      expect(core.cellFSM.hasSelection).toBe(false);
    });
  });
});
