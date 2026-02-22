import type { JsonSchema } from '@revisium/schema-toolkit';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type {
  CellPatch,
  CellPatchResult,
  DeleteRowsResult,
  FetchRowsResult,
  ITableDataSource,
  RowDataItem,
  TableMetadata,
  TableQuery,
} from './ITableDataSource.js';
import type { ViewState } from './TableEditorCore.js';

interface MockDataSourceParams {
  schema: JsonSchema;
  columns: ColumnSpec[];
  rows: RowDataItem[];
  viewState?: ViewState | null;
  readonly?: boolean;
  failPatches?: Set<string>;
}

export class MockDataSource implements ITableDataSource {
  private _allRows: RowDataItem[];
  private readonly _schema: JsonSchema;
  private readonly _columns: ColumnSpec[];
  private readonly _viewState: ViewState | null;
  private readonly _readonly: boolean;
  private readonly _failPatches: Set<string>;

  readonly fetchMetadataLog: Array<true> = [];
  readonly fetchLog: TableQuery[] = [];
  readonly patchLog: CellPatch[][] = [];
  readonly deleteLog: string[][] = [];
  readonly saveViewLog: ViewState[] = [];

  constructor(params: MockDataSourceParams) {
    this._schema = params.schema;
    this._columns = params.columns;
    this._allRows = [...params.rows];
    this._viewState = params.viewState ?? null;
    this._readonly = params.readonly ?? false;
    this._failPatches = params.failPatches ?? new Set();
  }

  static createRow(rowId: string, data: Record<string, unknown>): RowDataItem {
    return { rowId, data: { ...data } };
  }

  fetchMetadata(): Promise<TableMetadata> {
    this.fetchMetadataLog.push(true);
    return Promise.resolve({
      schema: this._schema,
      columns: this._columns,
      viewState: this._viewState,
      readonly: this._readonly,
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
