import type { JsonSchema, RefSchemas } from '@revisium/schema-toolkit';
import type {
  CellPatch,
  CellPatchResult,
  DeleteRowsResult,
  FetchRowsResult,
  ITableDataSource,
  RowDataItem,
  SystemFields,
  TableMetadata,
  TableQuery,
} from './ITableDataSource.js';
import type { ViewState } from './TableEditorCore.js';

interface MockDataSourceParams {
  dataSchema: JsonSchema;
  rows: RowDataItem[];
  viewState?: ViewState | null;
  readonly?: boolean;
  failPatches?: Set<string>;
  refSchemas?: RefSchemas;
}

export class MockDataSource implements ITableDataSource {
  private _allRows: RowDataItem[];
  private readonly _dataSchema: JsonSchema;
  private readonly _viewState: ViewState | null;
  private readonly _readonly: boolean;
  private readonly _failPatches: Set<string>;
  private readonly _refSchemas: RefSchemas | undefined;

  readonly fetchMetadataLog: Array<true> = [];
  readonly fetchLog: TableQuery[] = [];
  readonly patchLog: CellPatch[][] = [];
  readonly deleteLog: string[][] = [];
  readonly saveViewLog: ViewState[] = [];

  constructor(params: MockDataSourceParams) {
    this._dataSchema = params.dataSchema;
    this._allRows = [...params.rows];
    this._viewState = params.viewState ?? null;
    this._readonly = params.readonly ?? false;
    this._failPatches = params.failPatches ?? new Set();
    this._refSchemas = params.refSchemas;
  }

  static createRow(
    rowId: string,
    data: unknown,
    systemFields?: SystemFields,
  ): RowDataItem {
    const clonedData =
      data && typeof data === 'object' && !Array.isArray(data)
        ? { ...(data as Record<string, unknown>) }
        : data;
    const row: RowDataItem = { rowId, data: clonedData };
    if (systemFields) {
      row.systemFields = systemFields;
    }
    return row;
  }

  fetchMetadata(): Promise<TableMetadata> {
    this.fetchMetadataLog.push(true);
    return Promise.resolve({
      dataSchema: this._dataSchema,
      viewState: this._viewState,
      readonly: this._readonly,
      refSchemas: this._refSchemas,
    });
  }

  fetchRows(query: TableQuery): Promise<FetchRowsResult> {
    this.fetchLog.push(query);

    let rows = [...this._allRows];

    if (query.search) {
      const lower = query.search.toLowerCase();
      rows = rows.filter((row) => {
        const data = row.data;
        if (data && typeof data === 'object') {
          return Object.values(data).some(
            (val) =>
              typeof val === 'string' && val.toLowerCase().includes(lower),
          );
        }
        if (typeof data === 'string') {
          return data.toLowerCase().includes(lower);
        }
        return false;
      });
    }

    if (query.orderBy.length > 0) {
      const firstOrder = query.orderBy[0];
      if (firstOrder) {
        const field = firstOrder.field;
        const dir = firstOrder.direction === 'desc' ? -1 : 1;
        rows.sort((a, b) => {
          const aData = a.data as Record<string, unknown> | null;
          const bData = b.data as Record<string, unknown> | null;
          const aVal = aData?.[field];
          const bVal = bData?.[field];
          if (aVal === bVal) {
            return 0;
          }
          if (aVal == null) {
            return 1;
          }
          if (bVal == null) {
            return -1;
          }
          return aVal < bVal ? -dir : dir;
        });
      }
    }

    const totalCount = rows.length;

    let startIndex = 0;
    if (query.after) {
      const cursorIndex = rows.findIndex((r) => r.rowId === query.after);
      if (cursorIndex >= 0) {
        startIndex = cursorIndex + 1;
      }
    }

    const page = rows.slice(startIndex, startIndex + query.first);
    const hasNextPage = startIndex + query.first < rows.length;
    const lastRow = page.at(-1);
    const endCursor = lastRow ? lastRow.rowId : null;

    return Promise.resolve({ rows: page, totalCount, hasNextPage, endCursor });
  }

  patchCells(patches: CellPatch[]): Promise<CellPatchResult[]> {
    this.patchLog.push(patches);

    const results = patches.map((patch) => {
      const key = `${patch.rowId}/${patch.field}`;
      if (this._failPatches.has(key)) {
        return {
          rowId: patch.rowId,
          field: patch.field,
          ok: false as const,
          error: 'Mock failure',
        };
      }

      const row = this._allRows.find((r) => r.rowId === patch.rowId);
      if (row && row.data && typeof row.data === 'object') {
        (row.data as Record<string, unknown>)[patch.field] = patch.value;
      }

      return { rowId: patch.rowId, field: patch.field, ok: true as const };
    });

    return Promise.resolve(results);
  }

  deleteRows(rowIds: string[]): Promise<DeleteRowsResult> {
    this.deleteLog.push(rowIds);
    this._allRows = this._allRows.filter((r) => !rowIds.includes(r.rowId));
    return Promise.resolve({ ok: true });
  }

  saveView(viewState: ViewState): Promise<{ ok: boolean }> {
    this.saveViewLog.push(viewState);
    return Promise.resolve({ ok: true });
  }
}
