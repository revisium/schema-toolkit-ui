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
    onUploadFile: async (fileId, file) => { ... },
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

### Cleanup

Call `vm.dispose()` when the editor is unmounted.

## License

MIT
