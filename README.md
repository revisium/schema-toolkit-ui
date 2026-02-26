<div align="center">

# @revisium/schema-toolkit-ui

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=revisium_schema-toolkit-ui&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=revisium_schema-toolkit-ui)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=revisium_schema-toolkit-ui&metric=coverage)](https://sonarcloud.io/summary/new_code?id=revisium_schema-toolkit-ui)
[![npm version](https://img.shields.io/npm/v/@revisium/schema-toolkit-ui.svg)](https://www.npmjs.com/package/@revisium/schema-toolkit-ui)
[![GitHub License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/revisium/schema-toolkit-ui/blob/master/LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/revisium/schema-toolkit-ui)](https://github.com/revisium/schema-toolkit-ui/releases)

React UI components for JSON Schema editing with visual diff/patch generation. Built on top of [@revisium/schema-toolkit](https://github.com/revisium/schema-toolkit).

</div>

## Installation

```bash
npm install @revisium/schema-toolkit-ui
```

**Peer dependencies:**
```bash
npm install react react-dom @chakra-ui/react @emotion/react next-themes mobx mobx-react-lite
```

## Setup

Wrap your app with Chakra UI Provider. The MobX reactivity provider is initialized automatically.

## Usage

### Creating a new table schema

```tsx
import { CreatingEditorVM, CreatingSchemaEditor } from '@revisium/schema-toolkit-ui';
import type { JsonObjectSchema } from '@revisium/schema-toolkit-ui';

const emptySchema: JsonObjectSchema = {
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: false,
};

const vm = new CreatingEditorVM(emptySchema, {
  tableId: 'my-table',
  onApprove: async () => {
    // save logic
    return true;
  },
  onCancel: () => {
    // cancel logic
  },
});

// In React component:
<CreatingSchemaEditor vm={vm} />

// Read results:
vm.tableId          // current table name
vm.getPlainSchema() // JSON Schema output
```

### Updating an existing table schema

```tsx
import { UpdatingEditorVM, UpdatingSchemaEditor } from '@revisium/schema-toolkit-ui';

const vm = new UpdatingEditorVM(existingSchema, {
  tableId: 'my-table',
  onApprove: async () => {
    // save logic
    return true;
  },
  onCancel: () => {
    // cancel logic
  },
});

// In React component:
<UpdatingSchemaEditor vm={vm} />

// Read results:
vm.getJsonPatches()   // JSON Patch operations
vm.isTableIdChanged   // was table renamed?
vm.initialTableId     // original name (for rename API)
```

### Editing row data

```tsx
import { RowEditorVM, RowEditor } from '@revisium/schema-toolkit-ui';

const vm = new RowEditorVM(tableSchema, existingRowData, {
  mode: 'editing',
  rowId: 'my-row-id',
  refSchemas: { ... },
  callbacks: {
    onSearchForeignKey: async (tableId, search) => { ... },
    onUploadFile: async ({ rowId, fileId, file }) => { ... },
    onOpenFile: (url) => window.open(url, '_blank', 'noopener,noreferrer'),
    onNavigateToForeignKey: (tableId, rowId) => { ... },
  },
  onSave: (rowId, value, patches) => {
    // save logic
  },
});

// In React component:
<RowEditor vm={vm} />

// Read results:
vm.rowId             // current row name
vm.isRowIdChanged    // was row renamed?
vm.initialRowId      // original name (for rename API)
vm.isDirty           // data changed?
vm.hasChanges        // data or name changed?
vm.getValue()        // plain JSON value
vm.patches           // JSON Patch operations
```

### Creating a new row

```tsx
const vm = new RowEditorVM(tableSchema, undefined, {
  mode: 'creating',
  rowId: 'auto-generated-id',
  callbacks: { ... },
});

<RowEditor vm={vm} />
```

### Read-only mode

```tsx
const vm = new RowEditorVM(tableSchema, rowData, {
  mode: 'reading',
});

<RowEditor vm={vm} />
```

### Table editor

`TableEditor` renders a full table UI with inline cell editing, filtering, sorting, search, column management, row selection, and view persistence. It takes a `TableEditorCore` view model and a few external callbacks.

#### Data source

Implement `ITableDataSource` to connect the table to your backend:

```tsx
import type { ITableDataSource } from '@revisium/schema-toolkit-ui';

const dataSource: ITableDataSource = {
  async fetchMetadata() {
    // Return { schema, columns, viewState, readonly, refSchemas? }
  },
  async fetchRows(query) {
    // query: { where, orderBy, search, first, after }
    // Return { rows, totalCount, hasNextPage, endCursor }
  },
  async patchCells(patches) {
    // patches: [{ rowId, field, value }]
    // Return [{ rowId, field, ok, error? }]
  },
  async deleteRows(rowIds) {
    // Return { ok, error? }
  },
  async saveView(viewState) {
    // Persist column order, widths, pins, and sort settings
    // Return { ok, error? }
  },
};
```

#### Creating the view model

Breadcrumbs and callbacks are passed through the view model options (same pattern as `RowEditorVM`):

```tsx
import { TableEditorCore } from '@revisium/schema-toolkit-ui';
import type { TableEditorBreadcrumb, TableEditorCallbacks } from '@revisium/schema-toolkit-ui';

const breadcrumbs: TableEditorBreadcrumb[] = [
  { label: 'Database' },
  { label: 'invoices' },
];

const callbacks: TableEditorCallbacks = {
  onBreadcrumbClick: (segment, index) => navigate('/tables'),
  onCreateRow: () => createRow(),
  onOpenRow: (rowId) => navigate(`/rows/${rowId}`),
  onDuplicateRow: (rowId) => duplicateRow(rowId),
  onSearchForeignKey: async (tableId, search) => { ... },
  onCopyPath: (path) => navigator.clipboard.writeText(path),
};

const core = new TableEditorCore(dataSource, {
  tableId: 'invoices',
  pageSize: 50,           // optional, default 50
  breadcrumbs,
  callbacks,
});
```

`TableEditorCore` bootstraps automatically (fetches metadata, applies saved view state, loads the first page of rows).

#### Rendering

The component takes only the view model. All callbacks and breadcrumbs come from the view model:

```tsx
import { TableEditor } from '@revisium/schema-toolkit-ui';

<TableEditor viewModel={core} />
```

The component renders breadcrumbs with a "New row" button, a toolbar (search, filters, sorts), the virtualized table, and a status bar (row count, view settings badge) — all on a single header line.

In read-only mode, the "New row" button is hidden automatically.

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `viewModel` | `TableEditorCore` | Required. The table view model |
| `useWindowScroll` | `boolean` | Use window scroll instead of container scroll |

#### Callbacks (`TableEditorCallbacks`)

All callbacks are optional and passed via `TableEditorOptions.callbacks`:

| Callback | Type | Description |
|----------|------|-------------|
| `onBreadcrumbClick` | `(segment, index) => void` | Navigate on breadcrumb click |
| `onCreateRow` | `() => void` | Create a new row (shows "+" button) |
| `onOpenRow` | `(rowId: string) => void` | Navigate to row detail view |
| `onPickRow` | `(rowId: string) => void` | Pick a row (e.g. foreign key selection). When set, the primary row action becomes "Pick" and the table behaves as read-only |
| `onDuplicateRow` | `(rowId: string) => void` | Duplicate a row |
| `onSearchForeignKey` | `SearchForeignKeySearchFn` | Foreign key search handler |
| `onUploadFile` | `(params: { rowId: string; fileId: string; file: File }) => Promise<Record<string, unknown> \| null>` | Upload a file for a file field |
| `onOpenFile` | `(url: string) => void` | Open/preview a file URL |
| `onCopyPath` | `(path: string) => void` | Copy JSON path to clipboard |
| `onReadonlyEditAttempt` | `() => void` | Called when the user tries to edit a read-only cell (double-click, Enter, typing). Use this to show a toast/notification. Throttled internally (2 s). |

In read-only mode (`fetchMetadata` returns `readonly: true`), delete and duplicate actions are hidden automatically. Open row still works.

#### File columns

File fields (`$ref` to the File schema) are automatically resolved into:
- A **parent file column** (`FilterFieldType.File`) that displays the `fileName` and supports inline editing of the file name
- **Sub-field columns** (e.g., `avatar.status`, `avatar.url`) for each primitive property of the file object

Sub-field columns are hidden by default but can be added via the "+" column button. File columns are excluded from filters and sorts.

To enable file upload/preview in the table, pass `onUploadFile` and `onOpenFile` in `TableEditorCallbacks`. The file cell shows upload and preview buttons on hover when these callbacks are provided. File schemas must be passed through `fetchMetadata` as `refSchemas` in the `TableMetadata` return value:

```tsx
async fetchMetadata() {
  return {
    schema,
    columns,
    viewState,
    readonly: false,
    refSchemas: { [SystemSchemaIds.File]: fileSchema },
  };
}
```

#### View model API

```tsx
core.rows               // current RowVM[]
core.isBootstrapping    // true during initial load
core.isLoadingMore      // true during pagination
core.readonly           // read-only flag from metadata
core.tableId            // table identifier

core.loadMore()         // load next page
core.deleteRows(ids)    // delete rows by ID
core.getViewState()     // serialize current view settings
core.applyViewState(s)  // restore view settings
core.dispose()          // cleanup
```

### Cleanup

Call `vm.dispose()` (or `core.dispose()` for `TableEditorCore`) when the editor is unmounted.

## License

MIT
