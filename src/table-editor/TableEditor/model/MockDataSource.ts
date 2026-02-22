import type { JsonObjectSchema, RefSchemas } from '@revisium/schema-toolkit';
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
  dataSchema: JsonObjectSchema;
  rows: RowDataItem[];
  viewState?: ViewState | null;
  readonly?: boolean;
  failPatches?: Set<string>;
  refSchemas?: RefSchemas;
}

export class MockDataSource implements ITableDataSource {
  private _allRows: RowDataItem[];
  private readonly _dataSchema: JsonObjectSchema;
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
    data: Record<string, unknown>,
    systemFields?: SystemFields,
  ): RowDataItem {
    const row: RowDataItem = { rowId, data: { ...data } };
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
      rows = rows.filter((row) =>
        Object.values(row.data).some(
          (val) => typeof val === 'string' && val.toLowerCase().includes(lower),
        ),
      );
    }

    if (query.orderBy.length > 0) {
      const firstOrder = query.orderBy[0];
      if (firstOrder) {
        const field = firstOrder.field.startsWith('data.')
          ? firstOrder.field.slice(5)
          : firstOrder.field;
        const dir = firstOrder.direction === 'desc' ? -1 : 1;
        rows.sort((a, b) => {
          const aVal = a.data[field];
          const bVal = b.data[field];
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
      if (row) {
        row.data[patch.field] = patch.value;
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
