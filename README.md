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

### Cleanup

Call `vm.dispose()` when the editor is unmounted.

## License

MIT
