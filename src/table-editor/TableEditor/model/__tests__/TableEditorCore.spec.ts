import { jest } from '@jest/globals';
import { MockDataSource } from '../MockDataSource';
import { TableEditorCore } from '../TableEditorCore';
import type { TableEditorCallbacks } from '../TableEditorCore';
import {
  obj,
  str,
  num,
  bool,
  fileSchema,
  SystemSchemaIds,
} from '@revisium/schema-toolkit';
import type { JsonObjectSchema, RefSchemas } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity';

ensureReactivityProvider();

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
});

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
    dataSchema: TABLE_SCHEMA,
    rows: createRows(MOCK_ROWS_DATA),
    ...overrides,
  });
}

async function createCore(overrides?: {
  readonly?: boolean;
  optionsReadonly?: boolean;
  failPatches?: Set<string>;
  pageSize?: number;
}) {
  const dataSource = createDataSource(overrides);
  const core = new TableEditorCore(dataSource, {
    tableId: 'test-table',
    pageSize: overrides?.pageSize,
    readonly: overrides?.optionsReadonly,
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

    it('sets readonly from options', async () => {
      const { core } = await createCore({ optionsReadonly: true });
      expect(core.readonly).toBe(true);
      expect(core.viewBadge.canSave).toBe(false);

      const row = core.rows[0];
      const col = core.columns.visibleColumns[0];
      expect(row).toBeDefined();
      expect(col).toBeDefined();
      const cell = row.getCellVM(col);
      expect(cell.isReadOnly).toBe(true);
      expect(cell.isEditable).toBe(false);
    });

    it('options readonly is not overridden by metadata', async () => {
      const { core } = await createCore({
        readonly: false,
        optionsReadonly: true,
      });
      expect(core.readonly).toBe(true);
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

    it('primitive root schema shows data column by default', async () => {
      const dataSource = new MockDataSource({
        dataSchema: str(),
        rows: [
          MockDataSource.createRow('row-1', 'hello'),
          MockDataSource.createRow('row-2', 'world'),
        ],
      });
      const core = new TableEditorCore(dataSource, { tableId: 'prim' });
      await waitForBootstrap(core);

      const visibleFields = core.columns.visibleColumns.map((c) => c.field);
      expect(visibleFields).toContain('data');
    });

    it('primitive root data column appears in add menu when hidden by view', async () => {
      const dataSource = new MockDataSource({
        dataSchema: str(),
        rows: [MockDataSource.createRow('row-1', 'hello')],
        viewState: {
          columns: [{ field: 'id' }],
          sorts: [],
          filters: null,
          search: '',
        },
      });
      const core = new TableEditorCore(dataSource, { tableId: 'prim' });
      await waitForBootstrap(core);

      const visibleFields = core.columns.visibleColumns.map((c) => c.field);
      expect(visibleFields).toEqual(['id']);

      const addable = core.columns.availableFieldsToAdd.map((c) => c.field);
      expect(addable).toContain('data');
    });
  });

  describe('view state', () => {
    it('getViewState serializes current state', async () => {
      const { core } = await createCore();
      core.sorts.addSort('data.name');
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
      core2.sorts.addSort('data.age');
      core2.applyViewState(state);
      expect(core2.sorts.sorts).toHaveLength(0);
    });

    it('viewBadge detects changes after sort apply', async () => {
      const { core } = await createCore();
      expect(core.viewBadge.hasChanges).toBe(false);
      core.sorts.addSort('data.name');
      core.sorts.apply();
      expect(core.viewBadge.hasChanges).toBe(true);
    });
  });

  describe('sort apply reloads rows', () => {
    it('calls fetchRows after sort apply', async () => {
      const { core, dataSource } = await createCore();
      const initialFetchCount = dataSource.fetchLog.length;
      core.sorts.addSort('data.name');
      core.sorts.apply();
      await flushMicrotasks();
      expect(dataSource.fetchLog.length).toBeGreaterThan(initialFetchCount);
      const lastQuery = dataSource.fetchLog.at(-1);
      expect(lastQuery?.orderBy).toEqual([{ field: 'name', direction: 'asc' }]);
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
      const nameCol = core.columns.visibleColumns.find(
        (c) => c.field === 'data.name',
      );
      expect(nameCol).toBeDefined();
      const cellVM = row.getCellVM(nameCol!);
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
      const nameCol = core.columns.visibleColumns.find(
        (c) => c.field === 'data.name',
      );
      expect(nameCol).toBeDefined();
      const cellVM = row.getCellVM(nameCol!);
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
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'data.name' });
      core.dispose();
      expect(core.selection.isSelectionMode).toBe(false);
      expect(core.cellFSM.focusedCell).toBeNull();
    });
  });

  describe('column changes update CellFSM navigation', () => {
    it('clears range selection when column is hidden', async () => {
      const { core } = await createCore();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'data.name' });
      core.cellFSM.selectTo({ rowId: 'row-2', field: 'data.age' });
      expect(core.cellFSM.hasSelection).toBe(true);

      core.columns.hideColumn('data.age');

      expect(core.cellFSM.hasSelection).toBe(false);
      expect(core.cellFSM.anchorCell).toBeNull();
    });

    it('keeps focus when focused column still visible after hide', async () => {
      const { core } = await createCore();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'data.name' });

      core.columns.hideColumn('data.age');

      expect(core.cellFSM.state).toBe('focused');
      expect(core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'data.name',
      });
    });

    it('blurs when focused column is hidden', async () => {
      const { core } = await createCore();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'data.age' });

      core.columns.hideColumn('data.age');

      expect(core.cellFSM.state).toBe('idle');
      expect(core.cellFSM.focusedCell).toBeNull();
    });

    it('updates navigation context after column reorder', async () => {
      const { core } = await createCore();
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'data.name' });

      core.columns.moveColumnRight('data.name');

      expect(core.cellFSM.state).toBe('focused');
      expect(core.cellFSM.focusedCell).toEqual({
        rowId: 'row-1',
        field: 'data.name',
      });
      expect(core.cellFSM.columns[0]).not.toBe('data.name');
    });

    it('navigationVersion increments when column is shown', async () => {
      const { core } = await createCore();
      core.columns.hideColumn('data.active');
      core.cellFSM.focusCell({ rowId: 'row-1', field: 'data.name' });
      const before = core.cellFSM.navigationVersion;

      core.columns.showColumn('data.active');

      expect(core.cellFSM.navigationVersion).toBe(before + 1);
    });
  });

  describe('pagination', () => {
    it('loadMore appends rows when hasNextPage', async () => {
      const dataSource = new MockDataSource({
        dataSchema: TABLE_SCHEMA,
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

  describe('file callbacks', () => {
    const FILE_TABLE_SCHEMA = {
      type: 'object',
      properties: {
        name: { type: 'string', default: '' },
        avatar: { $ref: SystemSchemaIds.File },
      },
      additionalProperties: false,
      required: ['name', 'avatar'],
    } as unknown as JsonObjectSchema;

    const FILE_REF_SCHEMAS: RefSchemas = {
      [SystemSchemaIds.File]: fileSchema,
    };

    const FILE_ROW_DATA = {
      name: 'Alice',
      avatar: {
        status: 'uploaded',
        fileId: 'file-1',
        url: 'https://example.com/img.png',
        fileName: 'photo.png',
        hash: 'abc',
        extension: '.png',
        mimeType: 'image/png',
        size: 1024,
        width: 200,
        height: 200,
      },
    };

    async function createFileCore(callbacks: TableEditorCallbacks = {}) {
      const dataSource = new MockDataSource({
        dataSchema: FILE_TABLE_SCHEMA,
        rows: [MockDataSource.createRow('row-1', { ...FILE_ROW_DATA })],
        refSchemas: FILE_REF_SCHEMAS,
      });
      const core = new TableEditorCore(dataSource, {
        tableId: 'file-table',
        callbacks,
      });
      await waitForBootstrap(core);
      return { core, dataSource };
    }

    it('stores onUploadFile callback', async () => {
      const onUploadFile = jest.fn();
      const { core } = await createFileCore({ onUploadFile });
      expect(core.callbacks.onUploadFile).toBeDefined();
    });

    it('stores onOpenFile callback', async () => {
      const onOpenFile = jest.fn();
      const { core } = await createFileCore({ onOpenFile });
      expect(core.callbacks.onOpenFile).toBeDefined();
    });

    it('creates rows with refSchemas resolved', async () => {
      const { core } = await createFileCore();
      const row = core.rows[0];
      expect(row).toBeDefined();
      const avatarCol = core.columns.visibleColumns.find(
        (c) => c.field === 'data.avatar',
      );
      expect(avatarCol).toBeDefined();
      const cellVM = row.getCellVM(avatarCol!);
      expect(cellVM.fileData).not.toBeNull();
      expect(cellVM.fileData?.fileName).toBe('photo.png');
    });

    it('file column cell is editable when not readonly', async () => {
      const { core } = await createFileCore();
      const row = core.rows[0];
      const avatarCol = core.columns.visibleColumns.find(
        (c) => c.field === 'data.avatar',
      )!;
      const cellVM = row.getCellVM(avatarCol);
      expect(cellVM.isEditable).toBe(true);
      expect(cellVM.isReadOnly).toBe(false);
    });

    it('file column displayValue shows fileName', async () => {
      const { core } = await createFileCore();
      const row = core.rows[0];
      const avatarCol = core.columns.visibleColumns.find(
        (c) => c.field === 'data.avatar',
      )!;
      const cellVM = row.getCellVM(avatarCol);
      expect(cellVM.displayValue).toBe('photo.png');
    });

    it('commitEdit on file column updates fileName via patch', async () => {
      const { core, dataSource } = await createFileCore();
      const row = core.rows[0];
      const avatarCol = core.columns.visibleColumns.find(
        (c) => c.field === 'data.avatar',
      )!;
      const cellVM = row.getCellVM(avatarCol);

      cellVM.startEdit();
      cellVM.commitEdit('renamed.png');
      await flushMicrotasks();

      expect(cellVM.displayValue).toBe('renamed.png');
      expect(dataSource.patchLog).toHaveLength(1);
      const patch = dataSource.patchLog[0][0];
      expect(patch.rowId).toBe('row-1');
      expect(patch.field).toBe('avatar');
      expect((patch.value as Record<string, unknown>).fileName).toBe(
        'renamed.png',
      );
    });

    it('commitFileUpload updates cell value via patch', async () => {
      const { core, dataSource } = await createFileCore();
      const row = core.rows[0];
      const avatarCol = core.columns.visibleColumns.find(
        (c) => c.field === 'data.avatar',
      )!;
      const cellVM = row.getCellVM(avatarCol);

      const uploadResult = {
        status: 'uploaded',
        fileId: 'file-1',
        url: 'https://example.com/new.jpg',
        fileName: 'new-upload.jpg',
        hash: 'newhash',
        extension: '.jpg',
        mimeType: 'image/jpeg',
        size: 2048,
        width: 400,
        height: 300,
      };

      cellVM.commitFileUpload(uploadResult);
      await flushMicrotasks();

      expect(cellVM.fileData?.fileName).toBe('new-upload.jpg');
      expect(cellVM.fileData?.url).toBe('https://example.com/new.jpg');
      expect(dataSource.patchLog).toHaveLength(1);
    });

    it('table readonly flag is set from metadata', async () => {
      const dataSource = new MockDataSource({
        dataSchema: FILE_TABLE_SCHEMA,
        rows: [MockDataSource.createRow('row-1', { ...FILE_ROW_DATA })],
        refSchemas: FILE_REF_SCHEMAS,
        readonly: true,
      });
      const core = new TableEditorCore(dataSource, {
        tableId: 'file-table',
      });
      await waitForBootstrap(core);

      expect(core.readonly).toBe(true);
    });

    it('file sub-field column accesses nested value', async () => {
      const { core } = await createFileCore();
      core.columns.showColumn('data.avatar.fileName');
      const row = core.rows[0];
      const fileNameCol = core.columns.visibleColumns.find(
        (c) => c.field === 'data.avatar.fileName',
      );
      expect(fileNameCol).toBeDefined();
      const cellVM = row.getCellVM(fileNameCol!);
      expect(cellVM.value).toBe('photo.png');
      expect(cellVM.displayValue).toBe('photo.png');
    });
  });
});
