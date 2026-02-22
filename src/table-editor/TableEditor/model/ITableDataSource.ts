import type { JsonObjectSchema, RefSchemas } from '@revisium/schema-toolkit';
import type { ViewState } from './TableEditorCore.js';

export interface SystemFields {
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  versionId?: string;
  createdId?: string;
  hash?: string;
  schemaHash?: string;
}

export interface RowDataItem {
  rowId: string;
  data: Record<string, unknown>;
  systemFields?: SystemFields;
}

export interface TableMetadata {
  dataSchema: JsonObjectSchema;
  viewState: ViewState | null;
  readonly: boolean;
  refSchemas?: RefSchemas;
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
