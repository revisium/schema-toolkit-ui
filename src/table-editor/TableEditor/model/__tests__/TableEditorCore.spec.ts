import { jest } from '@jest/globals';
import { FilterFieldType } from '../../../shared/field-types';
import type { ColumnSpec } from '../../../Columns/model/types';
import { TableEditorCore } from '../TableEditorCore';

function col(overrides: Partial<ColumnSpec> & { field: string }): ColumnSpec {
  return {
    label: overrides.field,
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    ...overrides,
  };
}

const TEST_COLUMNS: ColumnSpec[] = [
  col({ field: 'name' }),
  col({ field: 'age', fieldType: FilterFieldType.Number }),
  col({ field: 'id', isSystem: true }),
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
});
