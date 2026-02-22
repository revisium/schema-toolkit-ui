import type { JsonSchema } from '@revisium/schema-toolkit';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type { ViewState } from './TableEditorCore.js';

export interface RowDataItem {
  rowId: string;
  data: Record<string, unknown>;
}

export interface TableMetadata {
  schema: JsonSchema;
  columns: ColumnSpec[];
  viewState: ViewState | null;
  readonly: boolean;
}

export interface TableQuery {
  where: Record<string, unknown> | null;
  orderBy: Array<{ field: string; direction: string }>;
  search: string;
  first: number;
  after: string | null;
}

export interface FetchRowsResult {
  rows: RowDataItem[];
  totalCount: number;
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface CellPatch {
  rowId: string;
  field: string;
  value: unknown;
}

export interface CellPatchResult {
  rowId: string;
  field: string;
  ok: boolean;
  error?: string;
}

export interface DeleteRowsResult {
  ok: boolean;
  error?: string;
}

export interface ITableDataSource {
  fetchMetadata(): Promise<TableMetadata>;
  fetchRows(query: TableQuery): Promise<FetchRowsResult>;
  patchCells(patches: CellPatch[]): Promise<CellPatchResult[]>;
  deleteRows(rowIds: string[]): Promise<DeleteRowsResult>;
  saveView(viewState: ViewState): Promise<{ ok: boolean; error?: string }>;
}
