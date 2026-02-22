import type { JsonObjectSchema, RefSchemas } from '@revisium/schema-toolkit';
import { createTableModel } from '@revisium/schema-toolkit';
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
import type {
  RowDataItem,
  SystemFields,
} from '../TableEditor/model/ITableDataSource.js';
import { SchemaContext } from '../TableEditor/model/SchemaContext.js';

export { FilterFieldType } from '../shared/field-types.js';

export interface TableStoryState {
  columnsModel: ColumnsModel;
  selection: SelectionModel;
  cellFSM: CellFSM;
  rows: RowVM[];
  sortModel?: SortModel;
  filterModel?: FilterModel;
}

interface CreateTableStoryStateParams {
  dataSchema: JsonObjectSchema;
  rowsData: Record<string, unknown>[];
  visibleFields?: string[];
  withSort?: boolean;
  withFilter?: boolean;
  refSchemas?: RefSchemas;
}

export function createTableStoryState(
  params: CreateTableStoryStateParams,
): TableStoryState {
  const schemaContext = new SchemaContext();
  schemaContext.init(params.dataSchema, params.refSchemas);

  const schemaFieldOrder = Object.keys(params.dataSchema.properties ?? {});
  const dataColumns = schemaContext.allColumns
    .filter((c) => !c.isSystem)
    .sort((a, b) => {
      const ia = schemaFieldOrder.indexOf(a.field);
      const ib = schemaFieldOrder.indexOf(b.field);
      return (ia === -1 ? Infinity : ia) - (ib === -1 ? Infinity : ib);
    });

  const columnsModel = new ColumnsModel();
  columnsModel.init(schemaContext.allColumns);
  if (params.visibleFields) {
    columnsModel.reorderColumns(params.visibleFields);
  } else {
    columnsModel.reorderColumns(dataColumns.map((c) => c.field));
  }

  const selection = new SelectionModel();
  const cellFSM = new CellFSM();

  const tableModel = createTableModel({
    tableId: 'test-table',
    schema: params.dataSchema,
    rows: params.rowsData.map((data, i) => ({
      rowId: `row-${i + 1}`,
      data,
    })),
    refSchemas: schemaContext.fullRefSchemas,
  });

  const rows = tableModel.rows.map(
    (rowModel) => new RowVM(rowModel, rowModel.rowId, cellFSM, selection),
  );

  const fields = params.visibleFields ?? dataColumns.map((c) => c.field);
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
    sortModel.init(schemaContext.sortableFields);
    result.sortModel = sortModel;
  }

  if (params.withFilter) {
    const filterModel = new FilterModel();
    filterModel.init(schemaContext.filterableFields);
    result.filterModel = filterModel;
  }

  return result;
}

export interface TableEditorStoryState {
  core: TableEditorCore;
  dataSource: MockDataSource;
}

interface CreateTableEditorStoryStateParams {
  dataSchema: JsonObjectSchema;
  rowsData: Record<string, unknown>[];
  rows?: RowDataItem[];
  readonly?: boolean;
  breadcrumbs?: TableEditorBreadcrumb[];
  callbacks?: TableEditorCallbacks;
  refSchemas?: RefSchemas;
}

export function createTableEditorStoryState(
  params: CreateTableEditorStoryStateParams,
): TableEditorStoryState {
  const rows =
    params.rows ??
    params.rowsData.map((data, i) =>
      MockDataSource.createRow(`row-${i + 1}`, data),
    );
  const dataSource = new MockDataSource({
    dataSchema: params.dataSchema,
    rows,
    readonly: params.readonly,
    refSchemas: params.refSchemas,
  });
  const core = new TableEditorCore(dataSource, {
    tableId: 'story-table',
    breadcrumbs: params.breadcrumbs,
    callbacks: params.callbacks,
  });
  return { core, dataSource };
}

export { type RowDataItem, type SystemFields };

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
