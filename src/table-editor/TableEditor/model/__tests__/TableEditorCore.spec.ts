import { FilterFieldType } from '../../../shared/field-types';
import { testCol as col } from '../../../__tests__/helpers';
import { MockDataSource } from '../MockDataSource';
import { TableEditorCore } from '../TableEditorCore';
import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity';

ensureReactivityProvider();

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
});

const TEST_COLUMNS = [
  col({ field: 'name' }),
  col({ field: 'age', fieldType: FilterFieldType.Number }),
  col({ field: 'active', fieldType: FilterFieldType.Boolean }),
];

const MOCK_ROWS_DATA = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
  { name: 'Charlie', age: 35, active: true },
];

function createRows(data: Record<string, unknown>[]) {
  return data.map((d, i) => MockDataSource.createRow(`row-${i + 1}`, { ...d }));
}

function createDataSource(overrides?: {
  readonly?: boolean;
  failPatches?: Set<string>;
}) {
  return new MockDataSource({
    schema: TABLE_SCHEMA,
    columns: TEST_COLUMNS,
    rows: createRows(MOCK_ROWS_DATA),
    ...overrides,
  });
}

async function createCore(overrides?: {
  readonly?: boolean;
  failPatches?: Set<string>;
  pageSize?: number;
}) {
  const dataSource = createDataSource(overrides);
  const core = new TableEditorCore(dataSource, {
    tableId: 'test-table',
    pageSize: overrides?.pageSize,
  });
  await waitForBootstrap(core);
  return { core, dataSource };
}

function flushMicrotasks(): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

function waitForBootstrap(core: TableEditorCore): Promise<void> {
  return new Promise<void>((resolve) => {
    const check = () => {
      if (!core.isBootstrapping) {
        resolve();
      } else {
        setTimeout(check, 1);
      }
    };
    check();
  });
}

describe('TableEditorCore', () => {
  describe('bootstrap', () => {
    it('loads metadata and rows on construction', async () => {
      const { core, dataSource } = await createCore();
      expect(core.isBootstrapping).toBe(false);
      expect(core.rows).toHaveLength(3);
      expect(core.columns.visibleColumns.length).toBeGreaterThan(0);
      expect(dataSource.fetchMetadataLog).toHaveLength(1);
      expect(dataSource.fetchLog).toHaveLength(1);
    });

    it('sets readonly from metadata', async () => {
      const { core } = await createCore({ readonly: true });
      expect(core.readonly).toBe(true);
      expect(core.viewBadge.canSave).toBe(false);
    });

    it('sets tableId from options', async () => {
      const { core } = await createCore();
      expect(core.tableId).toBe('test-table');
    });

    it('initializes rowCount', async () => {
      const { core } = await createCore();
      expect(core.rowCount.totalCount).toBe(3);
      expect(core.rowCount.baseTotalCount).toBe(3);
    });
  });

  describe('view state', () => {
    it('getViewState serializes current state', async () => {
      const { core } = await createCore();
      core.sorts.addSort('name');
      const state = core.getViewState();
      expect(state.columns.length).toBeGreaterThan(0);
      expect(state.sorts).toEqual([{ field: 'data.name', direction: 'asc' }]);
      expect(state.filters).toBeNull();
      expect(state.search).toBe('');
    });

    it('applyViewState restores state', async () => {
      const { core } = await createCore();
      const state = core.getViewState();
      const { core: core2 } = await createCore();
      core2.sorts.addSort('age');
      core2.applyViewState(state);
      expect(core2.sorts.sorts).toHaveLength(0);
    });

    it('applyViewState restores filters', async () => {
      const { core } = await createCore();
      core.filters.addCondition();
      const id = core.filters.rootGroup.conditions[0]?.id;
      if (id) {
        core.filters.updateCondition(id, { value: 'test' });
      }
      core.filters.apply();
      const state = core.getViewState();
      expect(state.filters).not.toBeNull();

      const { core: core2 } = await createCore();
      core2.applyViewState(state);
      expect(core2.filters.hasActiveFilters).toBe(true);
      expect(core2.filters.totalConditionCount).toBe(1);
    });

    it('applyViewState clears filters when state.filters is null', async () => {
      const { core } = await createCore();
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

    it('viewBadge detects changes after sort apply', async () => {
      const { core } = await createCore();
      expect(core.viewBadge.hasChanges).toBe(false);
      core.sorts.addSort('name');
      core.sorts.apply();
      expect(core.viewBadge.hasChanges).toBe(true);
    });
  });

  describe('sort apply reloads rows', () => {
    it('calls fetchRows after sort apply', async () => {
      const { core, dataSource } = await createCore();
      const initialFetchCount = dataSource.fetchLog.length;
      core.sorts.addSort('name');
      core.sorts.apply();
      await flushMicrotasks();
      expect(dataSource.fetchLog.length).toBeGreaterThan(initialFetchCount);
      const lastQuery = dataSource.fetchLog.at(-1);
      expect(lastQuery?.orderBy).toEqual([
        { field: 'data.name', direction: 'asc' },
      ]);
    });
  });

  describe('delete rows', () => {
    it('removes rows from the list', async () => {
      const { core, dataSource } = await createCore();
      expect(core.rows).toHaveLength(3);
      await core.deleteRows(['row-1']);
      expect(core.rows).toHaveLength(2);
      expect(core.rows.some((r) => r.rowId === 'row-1')).toBe(false);
      expect(dataSource.deleteLog).toHaveLength(1);
      expect(dataSource.deleteLog[0]).toEqual(['row-1']);
    });

    it('decrements rowCount after delete', async () => {
      const { core } = await createCore();
      expect(core.rowCount.totalCount).toBe(3);
      await core.deleteRows(['row-1']);
      expect(core.rowCount.totalCount).toBe(2);
    });
  });

  describe('cell commit', () => {
    it('patches cells via data source', async () => {
      const { core, dataSource } = await createCore();
      const row = core.rows[0];
      expect(row).toBeDefined();
      const cellVM = row.getCellVM(TEST_COLUMNS[0]);
      cellVM.startEdit();
      cellVM.commitEdit('Updated');
      await flushMicrotasks();
      expect(dataSource.patchLog).toHaveLength(1);
      expect(dataSource.patchLog[0]).toEqual([
        { rowId: 'row-1', field: 'name', value: 'Updated' },
      ]);
    });

    it('reverts value on failed patch', async () => {
      const { core } = await createCore({
        failPatches: new Set(['row-1/name']),
      });
      const row = core.rows[0];
      expect(row).toBeDefined();
      const cellVM = row.getCellVM(TEST_COLUMNS[0]);
      cellVM.startEdit();
      cellVM.commitEdit('Updated');
      await flushMicrotasks();
      expect(cellVM.value).toBe('Alice');
    });
  });

  describe('dispose', () => {
    it('cleans up all models', async () => {
      const { core } = await createCore();
      core.selection.toggle('row-1');
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });
      core.dispose();
      expect(core.selection.isSelectionMode).toBe(false);
      expect(core.cellFSM.focusedCell).toBeNull();
    });
  });

  describe('column changes update CellFSM navigation', () => {
    it('clears range selection when column is hidden', async () => {
      const { core } = await createCore();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });
      core.cellFSM.selectTo({ rowId: 'row-2', field: 'age' });
      expect(core.cellFSM.hasSelection).toBe(true);

      core.columns.hideColumn('age');

      expect(core.cellFSM.hasSelection).toBe(false);
      expect(core.cellFSM.anchorCell).toBeNull();
    });

    it('keeps focus when focused column still visible after hide', async () => {
      const { core } = await createCore();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });

      core.columns.hideColumn('age');

      expect(core.cellFSM.state).toBe('focused');
      expect(core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'name',
      });
    });

    it('blurs when focused column is hidden', async () => {
      const { core } = await createCore();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'age' });

      core.columns.hideColumn('age');

      expect(core.cellFSM.state).toBe('idle');
      expect(core.cellFSM.focusedCell).toBeNull();
    });

    it('updates navigation context after column reorder', async () => {
      const { core } = await createCore();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });

      core.columns.moveColumnRight('name');

      expect(core.cellFSM.state).toBe('focused');
      expect(core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'name',
      });
      expect(core.cellFSM.columns[0]).not.toBe('name');
    });

    it('navigationVersion increments when column is shown', async () => {
      const { core } = await createCore();
      core.columns.hideColumn('active');
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'name' });
      const before = core.cellFSM.navigationVersion;

      core.columns.showColumn('active');

      expect(core.cellFSM.navigationVersion).toBe(before + 1);
    });
  });

  describe('pagination', () => {
    it('loadMore appends rows when hasNextPage', async () => {
      const dataSource = new MockDataSource({
        schema: TABLE_SCHEMA,
        columns: TEST_COLUMNS,
        rows: Array.from({ length: 5 }, (_, i) =>
          MockDataSource.createRow(`row-${i + 1}`, {
            name: `User ${i + 1}`,
            age: 20 + i,
            active: true,
          }),
        ),
      });
      const core = new TableEditorCore(dataSource, {
        tableId: 'test-table',
        pageSize: 2,
      });
      await waitForBootstrap(core);

      expect(core.rows).toHaveLength(2);
      await core.loadMore();
      expect(core.rows).toHaveLength(4);
      await core.loadMore();
      expect(core.rows).toHaveLength(5);
    });

    it('loadMore does nothing when no next page', async () => {
      const { core, dataSource } = await createCore();
      const fetchCount = dataSource.fetchLog.length;
      await core.loadMore();
      expect(dataSource.fetchLog.length).toBe(fetchCount);
    });
  });
});
