import type { JsonSchema } from '@revisium/schema-toolkit';
import { createTableModel } from '@revisium/schema-toolkit';
import type { ColumnSpec } from '../Columns/model/types.js';
import { ColumnsModel } from '../Columns/model/ColumnsModel.js';
import { SortModel } from '../Sortings/model/SortModel.js';
import { FilterModel } from '../Filters/model/FilterModel.js';
import { CellFSM } from '../Table/model/CellFSM.js';
import { RowVM } from '../Table/model/RowVM.js';
import { SelectionModel } from '../Table/model/SelectionModel.js';
import {
  TableEditorCore,
  type TableEditorCallbacks,
  type TableEditorBreadcrumb,
} from '../TableEditor/model/TableEditorCore.js';
import { MockDataSource } from '../TableEditor/model/MockDataSource.js';
import { FilterFieldType } from '../shared/field-types.js';

export { FilterFieldType } from '../shared/field-types.js';

export function col(
  field: string,
  fieldType: FilterFieldType,
  overrides?: Partial<ColumnSpec>,
): ColumnSpec {
  return {
    field,
    label: field.charAt(0).toUpperCase() + field.slice(1),
    fieldType,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    ...overrides,
  };
}

export interface TableStoryState {
  columnsModel: ColumnsModel;
  selection: SelectionModel;
  cellFSM: CellFSM;
  rows: RowVM[];
  sortModel?: SortModel;
  filterModel?: FilterModel;
}

interface CreateTableStoryStateParams {
  schema: JsonSchema;
  columns: ColumnSpec[];
  rowsData: Record<string, unknown>[];
  visibleFields?: string[];
  withSort?: boolean;
  withFilter?: boolean;
}

export function createTableStoryState(
  params: CreateTableStoryStateParams,
): TableStoryState {
  const columnsModel = new ColumnsModel();
  columnsModel.init(params.columns);
  if (params.visibleFields) {
    columnsModel.reorderColumns(params.visibleFields);
  } else {
    columnsModel.reorderColumns(params.columns.map((c) => c.field));
  }

  const selection = new SelectionModel();
  const cellFSM = new CellFSM();

  const tableModel = createTableModel({
    tableId: 'test-table',
    schema: params.schema as Parameters<typeof createTableModel>[0]['schema'],
    rows: params.rowsData.map((data, i) => ({
      rowId: `row-${i + 1}`,
      data,
    })),
  });

  const rows = tableModel.rows.map(
    (rowModel) => new RowVM(rowModel, rowModel.rowId, cellFSM, selection),
  );

  const fields = params.visibleFields ?? params.columns.map((c) => c.field);
  cellFSM.setNavigationContext(
    fields,
    rows.map((r) => r.rowId),
  );

  columnsModel.setOnChange(() => {
    cellFSM.updateNavigationContext(
      columnsModel.visibleColumns.map((c) => c.field),
      cellFSM.rowIds,
    );
  });

  const result: TableStoryState = { columnsModel, selection, cellFSM, rows };

  if (params.withSort) {
    const sortModel = new SortModel();
    sortModel.init(params.columns);
    result.sortModel = sortModel;
  }

  if (params.withFilter) {
    const filterModel = new FilterModel();
    filterModel.init(params.columns);
    result.filterModel = filterModel;
  }

  return result;
}

export interface TableEditorStoryState {
  core: TableEditorCore;
  dataSource: MockDataSource;
}

interface CreateTableEditorStoryStateParams {
  schema: JsonSchema;
  columns: ColumnSpec[];
  rowsData: Record<string, unknown>[];
  readonly?: boolean;
  breadcrumbs?: TableEditorBreadcrumb[];
  callbacks?: TableEditorCallbacks;
}

export function createTableEditorStoryState(
  params: CreateTableEditorStoryStateParams,
): TableEditorStoryState {
  const rows = params.rowsData.map((data, i) =>
    MockDataSource.createRow(`row-${i + 1}`, data),
  );
  const dataSource = new MockDataSource({
    schema: params.schema,
    columns: params.columns,
    rows,
    readonly: params.readonly,
  });
  const core = new TableEditorCore(dataSource, {
    tableId: 'story-table',
    breadcrumbs: params.breadcrumbs,
    callbacks: params.callbacks,
  });
  return { core, dataSource };
}

export function mockClipboard(initialText = ''): {
  getText: () => string;
  setText: (text: string) => void;
} {
  let clipboardText = initialText;
  const mock = {
    writeText: (text: string) => {
      clipboardText = text;
      return Promise.resolve();
    },
    readText: () => Promise.resolve(clipboardText),
  };
  Object.defineProperty(navigator, 'clipboard', {
    value: mock,
    writable: true,
    configurable: true,
  });
  return {
    getText: () => clipboardText,
    setText: (text: string) => {
      clipboardText = text;
    },
  };
}
