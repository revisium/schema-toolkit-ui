# TableEditor Architecture

## Overview

TableEditor is the main table-editing widget. It displays rows in a virtualized spreadsheet with column management, inline editing, filtering, sorting, search, and view persistence.

## Module Structure

```
table-editor/
├── TableEditor/              # Orchestrator layer
│   ├── model/
│   │   ├── TableEditorCore   # Main ViewModel — owns all sub-models
│   │   ├── SchemaContext      # Schema parsing + column extraction
│   │   ├── ITableDataSource  # Data contract (interface)
│   │   └── MockDataSource    # Mock for stories/tests
│   └── ui/
│       └── TableEditor       # Root React component
├── Columns/                  # Column management
│   └── model/
│       ├── ColumnsModel      # Visibility, ordering, pinning, widths
│       ├── extractColumns    # Schema → ColumnSpec[]
│       ├── selectDefaultColumns  # ColumnSpec[] → default visible set
│       └── types             # ColumnSpec, ViewColumn
├── Table/                    # Table rendering + cell editing
│   ├── model/
│   │   ├── RowVM            # Per-row ViewModel (wraps RowModel + systemValues)
│   │   ├── CellVM           # Per-cell ViewModel (editing, value access)
│   │   ├── CellFSM          # Cell focus/edit state machine
│   │   └── SelectionModel   # Row selection (checkbox mode)
│   └── ui/
│       ├── TableWidget       # Virtuoso-based table
│       ├── HeaderRow         # Column headers
│       └── DataRow           # Data cells
├── Filters/                  # Filter conditions
├── Sortings/                 # Sort configuration
├── Search/                   # Text search
├── Status/                   # Row count + view settings badge
└── shared/
    ├── field-types           # FilterFieldType enum
    └── system-fields         # SystemFieldId, SYSTEM_FIELD_BY_REF
```

## Data Flow

### Bootstrap Sequence

```
_bootstrap()
  │
  ├─ meta = dataSource.fetchMetadata()
  │    → { dataSchema, viewState, readonly, refSchemas? }
  │
  ├─ schemaContext.init(meta.dataSchema, meta.refSchemas)
  │    → builds row schema (data + system $ref fields)
  │    → parses with SchemaParser
  │    → extracts allColumns via extractColumns()
  │
  ├─ columns.init(schemaContext.allColumns)
  │    → selectDefaultColumns → _visibleFields
  │
  ├─ sorts.init(schemaContext.sortableFields)
  ├─ filters.init(schemaContext.filterableFields)
  │
  ├─ if (meta.viewState) applyViewState(meta.viewState)
  │    → columns.applyViewColumns() — with fallback to defaults if all fields gone
  │    → filters.applySnapshot() — strips conditions for removed fields
  │    → sorts.applyViewSorts() — skips unknown fields
  │
  ├─ _saveViewSnapshot() (baseline for dirty check)
  └─ _loadRows()

dataSource.fetchRows(query)
  → { rows: RowDataItem[], totalCount, hasNextPage, endCursor }
      │
      └─ createTableModel({ tableId, schema: dataSchema, rows, refSchemas })
           → tableModel.rows → RowVM[] (each wraps RowModel + systemValues)
```

### Column Resolution Pipeline (schema → visible columns)

This is the critical path that determines which columns appear in the table. It has two branches: default selection (no saved view) and view restoration (saved view exists).

#### Step 1: SchemaContext parses the schema

```
SchemaContext.init(dataSchema, refSchemas?)
  │
  ├─ Build row schema: system $ref properties + dataSchema.properties
  ├─ Merge refSchemas: SYSTEM_REF_SCHEMAS + consumer refSchemas
  ├─ SchemaParser.parse(rowSchema, fullRefSchemas) → SchemaNode tree
  └─ extractColumns(root) → allColumns: ColumnSpec[]
```

Consumer passes only `dataSchema` (user fields). System field knowledge is fully owned by SchemaContext via built-in `SYSTEM_REF_SCHEMAS`.

#### Step 2: ColumnsModel.init(columns) — set all + select defaults

```
ColumnsModel.init(columns: ColumnSpec[])
  │
  ├─ _allColumns = columns                          # Full catalog of all columns
  ├─ selectDefaultColumns(columns) → defaults[]     # Priority-based selection
  │   ├─ Exclude: isSystem, isDeprecated, file sub-fields (avatar.status, etc.)
  │   ├─ Sort by priority:
  │   │   SemanticString=1, File/String=2, Number/Boolean/DateTime=3, ForeignKey=4
  │   │   (Semantic = field label matches 13 patterns, see below)
  │   ├─ Max 1 File column in result
  │   └─ Take first maxVisible (default=3)
  │
  └─ _visibleFields = defaults.map(col => col.field) # Initial visible set
```

#### Step 3: SortModel/FilterModel init

```
SortModel.init(schemaContext.sortableFields)
FilterModel.init(schemaContext.filterableFields)
  │
  └─ sortableFields / filterableFields = allColumns
       .filter(col => !col.isDeprecated && col.fieldType !== File)
```

#### Step 4 (conditional): ViewState overrides defaults

```
if (meta.viewState) {
  applyViewState(viewState)
}
```

`applyViewState` replaces the defaults with saved configuration:

```
applyViewState(state: ViewState)
  │
  ├─ columns.applyViewColumns(state.columns)
  │   │
  │   │  For each ViewColumn:
  │   │    ├─ _fromViewField("data.name") → "name"     # Strip "data." prefix for data fields
  │   │    ├─ _fromViewField("id") → "id"               # System fields stored as-is
  │   │    ├─ lookup.has(field)?                         # VALIDATION: field exists in _allColumns?
  │   │    │   ├─ YES → add to visible, apply width/pinned
  │   │    │   └─ NO  → skip silently (field was removed from schema)
  │   │    └─ Result: _visibleFields = only validated fields from viewState
  │   │
  │   └─ If ALL fields in viewState are gone → fallback to selectDefaultColumns
  │
  ├─ sorts.applyViewSorts(state.sorts)
  │   │  Same validation: lookup.has(field) → skip unknown fields
  │   └─ commit() → sets as baseline
  │
  ├─ filters.applySnapshot(state.filters)
  │   │  Parse JSON → FilterGroup
  │   │  Strip conditions referencing fields not in availableFields
  │   │  Strip empty groups after cleanup
  │   └─ Apply cleaned filter tree
  │
  └─ search.setQuery(state.search)
```

#### Summary: Two Paths

```
                    fetchMetadata()
                         │
                    SchemaContext.init(dataSchema, refSchemas)
                    ColumnsModel.init(schemaContext.allColumns)
                    selectDefaultColumns() → _visibleFields (defaults)
                         │
                    ┌────┴────┐
                    │         │
              no viewState   has viewState
                    │         │
              keep defaults   applyViewColumns()
                    │         ├─ validate each field exists in allColumns
                    │         ├─ apply widths + pins
                    │         ├─ fallback to defaults if all fields gone
                    │         │
                    │         applySnapshot() → strip invalid filter fields
                    │         │
                    └────┬────┘
                         │
                    _saveViewSnapshot() (baseline for dirty check)
                    _loadRows()
```

### Column Pipeline

```
JSON Schema (with $ref for system fields and files)
  │
  ├─ SchemaParser.parse(schema, refSchemas) → SchemaNode tree
  │
  └─ extractColumns(rootNode) → ColumnSpec[]
       │
       ├─ Primitives (string/number/boolean) → ColumnSpec
       ├─ Nested objects → recurse, dot-path fields (a.b.c)
       ├─ Arrays → skipped
       ├─ Foreign keys → ColumnSpec with foreignKeyTableId
       ├─ System $ref (RowId, RowCreatedAt, etc.) → ColumnSpec with isSystem=true
       │     field = SystemFieldId (e.g., "id", "createdAt")
       └─ File $ref → parent File ColumnSpec + primitive sub-field ColumnSpecs
             (avatar, avatar.status, avatar.fileId, avatar.url, ...)
```

### Row Data Pipeline

```
RowDataItem { rowId, data, systemFields? }
  │
  ├─ createTableModel({ tableId, schema: dataSchema, rows: [data only], refSchemas })
  │    → RowModel per row (for user data field access)
  │
  └─ _buildSystemValues(rawRow) → { id: rowId, ...systemFields }
       │
       └─ RowVM (per row, receives RowModel + systemValues)
            │
            └─ CellVM (per cell, lazily created)
                 │
                 ├─ Data columns:
                 │   ├─ value → rowModel.get(field).getPlainValue()
                 │   ├─ isReadOnly → node.isReadOnly
                 │   └─ isEditable → node.isPrimitive() && !isReadOnly
                 │
                 └─ System columns (column.isSystem):
                     ├─ value → systemValues[field]
                     ├─ isReadOnly → true (always)
                     └─ isEditable → false (always)
```

### Rendering Pipeline

```
TableEditor (root observer component)
  │
  ├─ Breadcrumbs + PlusButton
  ├─ SearchWidget ← search model
  ├─ FilterWidget ← filters model + columns.filterableFields
  ├─ SortingsWidget ← sorts model + columns.sortableFields
  │
  ├─ TableWidget (react-virtuoso)
  │   ├─ HeaderRow ← columnsModel.visibleColumns
  │   └─ DataRow[] ← rows: RowVM[]
  │       └─ Cell ← row.getCellVM(column)
  │           ├─ StringCell / NumberCell / BooleanCell / ForeignKeyCell / FileCell
  │           └─ CellVM handles focus/edit/commit
  │
  └─ RowCountWidget + ViewSettingsBadge
```

## Key Contracts

### ITableDataSource

```typescript
interface ITableDataSource {
  fetchMetadata(): Promise<TableMetadata>
  fetchRows(query: TableQuery): Promise<FetchRowsResult>
  patchCells(patches: CellPatch[]): Promise<CellPatchResult[]>
  deleteRows(rowIds: string[]): Promise<DeleteRowsResult>
  saveView(viewState: ViewState): Promise<{ ok: boolean }>
}
```

### TableMetadata

```typescript
interface TableMetadata {
  dataSchema: JsonObjectSchema    // User fields only (name, age, avatar...)
  viewState: ViewState | null     // Saved view configuration
  readonly: boolean
  refSchemas?: RefSchemas         // For File and custom $refs (NOT system refs)
}
```

### RowDataItem

```typescript
interface RowDataItem {
  rowId: string
  data: Record<string, unknown>   // User data (from row.data)
  systemFields?: SystemFields     // From row.id, row.createdAt, etc.
}

interface SystemFields {
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  versionId?: string
  createdId?: string
  hash?: string
  schemaHash?: string
}
```

### ColumnSpec

```typescript
interface ColumnSpec {
  field: string               // Dot-path: "name", "author.email", "avatar.status"
  label: string               // Display label (= field path)
  fieldType: FilterFieldType  // String | Number | Boolean | ForeignKey | File | DateTime
  isSystem: boolean           // True for id, createdAt, etc.
  systemFieldId?: SystemFieldId
  isDeprecated: boolean
  hasFormula: boolean
  foreignKeyTableId?: string
}
```

### ViewState (persistence)

```typescript
interface ViewState {
  columns: Array<{ field: string; width?: number }>  // "data.name" or "id"
  filters: string | null       // Serialized filter JSON
  sorts: Array<{ field: string; direction: string }>
  search: string
}
```

## Column Selection Logic

### selectDefaultColumns(columns, maxVisible=3)

1. Exclude: system fields, deprecated fields, file sub-fields
2. Sort by priority: SemanticString=1 > File/String=2 > Number/Boolean/DateTime=3 > ForeignKey=4
3. Max 1 File column in result
4. Take first `maxVisible`

Semantic patterns (13, case-insensitive): `title`, `name`, `label`, `subject`, `summary`, `description`, `heading`, `caption`, `email`, `username`, `displayName`, `firstName`, `lastName`

### ColumnsModel responsibilities

- `init(columns)` → stores all columns, selects defaults as visible
- `visibleColumns` → ordered list currently displayed
- `sortableFields` / `filterableFields` → all non-deprecated, non-File columns
- `showColumn(field)` / `hideColumn(field)` / `pinLeft(field)` / `pinRight(field)`
- `serializeToViewColumns()` / `applyViewColumns()` — view persistence
  - Data fields serialized as `"data.name"`, system fields as `"id"`
  - `applyViewColumns` falls back to `selectDefaultColumns` if all saved fields are gone

## System Fields

Defined in `shared/system-fields.ts`. Detected by `extractColumns` via `$ref` matching:

| SystemFieldId | $ref | FilterFieldType |
|---|---|---|
| id | SystemSchemaIds.RowId | String |
| createdAt | SystemSchemaIds.RowCreatedAt | DateTime |
| updatedAt | SystemSchemaIds.RowUpdatedAt | DateTime |
| createdId | SystemSchemaIds.RowCreatedId | String |
| versionId | SystemSchemaIds.RowVersionId | String |
| publishedAt | SystemSchemaIds.RowPublishedAt | DateTime |
| hash | SystemSchemaIds.RowHash | String |
| schemaHash | SystemSchemaIds.RowSchemaHash | String |

Schema property names MUST match SystemFieldId values — `extractColumns` uses `systemDef.id` as the column field.

### System Field Display

System field values flow through a separate path from data fields:

1. `RowDataItem.systemFields` carries optional system values from the backend
2. `TableEditorCore._buildSystemValues()` merges `{ id: rowId, ...systemFields }`
3. `RowVM` stores `_systemValues` and passes them to CellVM when `column.isSystem`
4. `CellVM` reads from `_systemValues[field]` instead of `rowModel.get(field)`
5. System cells are always read-only and non-editable

## SchemaContext

Central reference model. Owns the parsed schema and derives all column metadata.

```
SchemaContext
├── init(dataSchema, refSchemas?)
│   │
│   ├─ 1. Build row schema (data fields + system $ref fields)
│   ├─ 2. Build full refSchemas: SYSTEM_REF_SCHEMAS + consumer refSchemas
│   ├─ 3. Parse: SchemaParser.parse(rowSchema, fullRefSchemas) → SchemaNode
│   ├─ 4. Extract: extractColumns(root) → allColumns
│   └─ 5. Derive subsets: sortableFields, filterableFields
│
├── allColumns: ColumnSpec[]
├── sortableFields: ColumnSpec[]
├── filterableFields: ColumnSpec[]
├── dataSchema: JsonObjectSchema       # Original, for createTableModel
├── fullRefSchemas: RefSchemas         # Merged, for createTableModel
└── rootNode: SchemaNode               # Parsed tree, for future use
```

## Model Hierarchy

### Ownership Tree

```
TableEditorCore                          # Root orchestrator
├── SchemaContext         (owns)         # Parsed schema + all columns
├── ColumnsModel          (owns)         # Column visibility, ordering, pinning, widths
├── FilterModel           (owns)         # Filter tree (conditions + groups)
│   ├── FilterTreeOps     (owns)         # Tree mutations (add/remove/update)
│   ├── FilterSerializer  (owns)         # Serialize/deserialize filter tree
│   └── FilterValidator   (owns)         # Condition validation
├── SortModel             (owns)         # Sort entries (field + direction)
├── SearchModel           (owns)         # Search query with debounce
├── ViewSettingsBadgeModel (owns)        # Dirty-check (current vs saved snapshot)
├── RowCountModel         (owns)         # Total/filtered row counts
├── CellFSM              (owns)         # Cell focus/edit/selection state machine
├── SelectionModel        (owns)         # Row checkbox selection
└── RowVM[]               (owns, dynamic) # One per loaded row
    └── CellVM            (lazy cache)   # One per visible cell per row
```

### Shared References (injected, not owned)

```
RowVM receives:
├── RowModel       — from @revisium/schema-toolkit (data access)
├── CellFSM        — shared across all rows (singleton from Core)
├── SelectionModel — shared across all rows (singleton from Core)
├── commitCallback — closure back to Core._commitCell()
└── systemValues   — Record<string, unknown> built from RowDataItem

CellVM receives:
├── RowModel       — from parent RowVM
├── ColumnSpec     — column definition
├── CellFSM        — same shared instance
├── commitCallback — same closure from RowVM
└── systemValues   — passed only for system columns (isSystem=true)
```

### Who Creates What

| Model | Created by | When |
|---|---|---|
| SchemaContext | TableEditorCore constructor | Once |
| ColumnsModel | TableEditorCore constructor | Once |
| FilterModel (FilterCore) | TableEditorCore constructor | Once |
| SortModel | TableEditorCore constructor | Once |
| SearchModel | TableEditorCore constructor | Once, receives `_handleSearch` callback |
| ViewSettingsBadgeModel | TableEditorCore constructor | Once |
| RowCountModel | TableEditorCore constructor | Once |
| CellFSM | TableEditorCore constructor | Once |
| SelectionModel | TableEditorCore constructor | Once |
| RowVM[] | TableEditorCore._createRowVMs() | On every `_loadRows()` / `_appendRowVMs()` |
| CellVM | RowVM.getCellVM(column) | Lazily, on first render of that cell |

### Lifecycle

```
constructor()
  → create all sub-models (including SchemaContext)
  → wire callbacks (onChange, onApply, onSave, onRevert)
  → queueMicrotask(_bootstrap)

_bootstrap()
  → fetchMetadata()
  → schemaContext.init(dataSchema, refSchemas)
  → ColumnsModel.init(schemaContext.allColumns)
  → SortModel.init(schemaContext.sortableFields)
  → FilterModel.init(schemaContext.filterableFields)
  → applyViewState() if saved
  → _saveViewSnapshot()
  → _loadRows()

dispose()
  → dispose all sub-models
  → exitSelectionMode, blur CellFSM
  → dispose all RowVMs
```

### Callback Wiring (set up in constructor)

```
ColumnsModel.onChange   → Core._handleColumnsChange  → updateNavigationContext + _checkViewChanges
FilterModel.onChange    → Core._handleFilterChange    → _checkViewChanges
FilterModel.onApply    → Core._handleFilterApply      → _reloadRows + _checkViewChanges
SortModel.onChange      → Core._handleSortChange      → _checkViewChanges
SortModel.onApply       → Core._handleSortApply       → _reloadRows + _checkViewChanges
SearchModel (callback)  → Core._handleSearch           → _reloadRows + _checkViewChanges
ViewBadge.onSave        → Core._handleViewSave         → dataSource.saveView()
ViewBadge.onRevert      → Core._handleViewRevert       → applyViewState(saved) + _reloadRows
```

### Data Mutation Flows

#### Cell Edit

```
User types in cell
  → CellVM.commitEdit(newValue)
    → RowModel node.setValue(newValue)       # Local model update (instant)
    → CellFSM.commit()                      # Exit edit state
    → commitCallback(rowId, field, value, previousValue)
      → Core._commitCell()
        → dataSource.patchCells([patch])     # Server persist
        → if failed: rollback node.setValue(previousValue)
```

#### Filter Apply

```
User clicks "Apply" in filter panel
  → FilterModel.apply()
    → removeEmptyGroups()
    → row.commit()                          # Snapshot filter state
    → _committedHasFilters = true
    → fireOnApply(where)                    # Callback to Core
      → Core._handleFilterApply()
        → _reloadRows()                     # Re-fetch from server with new where clause
          → dataSource.fetchRows(query)
          → replace RowVMs
        → _checkViewChanges()               # Update dirty badge
```

#### Sort Apply

```
User clicks "Apply" in sort panel
  → SortModel.apply()
    → row.commit()                          # Snapshot sort state
    → fireOnApply(sorts)                    # Callback to Core
      → Core._handleSortApply()
        → _reloadRows()                     # Re-fetch with new orderBy
        → _checkViewChanges()
```

#### Column Visibility Change

```
User shows/hides/reorders column
  → ColumnsModel.showColumn(field) / hideColumn(field) / reorderColumns(fields)
    → _notifyChange()                       # Callback to Core
      → Core._handleColumnsChange()
        → CellFSM.updateNavigationContext() # Update keyboard nav grid
        → _checkViewChanges()               # Update dirty badge
  (No server call — columns are client-side only, persisted via view save)
```

#### View Save

```
User clicks "Save" on ViewSettingsBadge
  → ViewSettingsBadgeModel.save()
    → onSave callback → Core._handleViewSave()
      → Core.getViewState()                 # Serialize columns + filters + sorts + search
      → dataSource.saveView(viewState)      # Persist to server
      → _saveViewSnapshot()                 # Reset dirty baseline
```

#### Row Deletion

```
User selects rows + clicks delete
  → Core.deleteRows(rowIds)
    → dataSource.deleteRows(rowIds)         # Server delete
    → if ok:
      → remove RowVMs from _rows
      → rowCount.decrementBaseTotalCount()
      → selection.exitSelectionMode()
      → _updateNavigationContext()
```

#### Search

```
User types in search box
  → SearchModel.setQuery(value)
    → _query = value (instant, for input display)
    → debounce 300ms →
      → _debouncedQuery = value
      → onSearch(value)                     # Callback to Core
        → Core._handleSearch()
          → _reloadRows()                   # Re-fetch with search param
          → _checkViewChanges()
```

### What Each Model Reads vs Writes

| Model | Reads from | Writes to |
|---|---|---|
| **SchemaContext** | dataSchema, refSchemas (init only) | own state (allColumns, rootNode) |
| **ColumnsModel** | own state (allColumns, visibleFields, widths, pins) | own state |
| **FilterModel** | own RowModel tree, availableFields | own RowModel tree |
| **SortModel** | own RowModel array, availableFields | own RowModel array |
| **SearchModel** | own query state | own query state |
| **ViewSettingsBadgeModel** | snapshot strings (JSON compare) | own snapshot state |
| **RowCountModel** | own counts | own counts |
| **CellFSM** | own FSM context (focusedCell, anchorCell, columns, rowIds) | own FSM context |
| **SelectionModel** | own observable.map | own observable.map |
| **RowVM** | RowModel, CellFSM, SelectionModel, systemValues | CellVM cache |
| **CellVM** | RowModel nodes or systemValues, CellFSM state, ColumnSpec | RowModel nodes (via setValue) |
| **TableEditorCore** | all sub-models (computed getters) | all sub-models (orchestration), dataSource |

Sub-models are fully encapsulated — they never read or write each other's state directly. All cross-model coordination goes through TableEditorCore callbacks.

## Validation

### Column Validation (applyViewColumns)

When restoring saved view columns, each field is validated against `_allColumns`. Unknown fields (removed from schema) are silently skipped. If ALL saved fields are gone, falls back to `selectDefaultColumns` to avoid showing an empty table.

### Filter Validation (applySnapshot)

When restoring saved filters, `FilterCore.applySnapshot` strips conditions referencing fields not in `availableFields`. Empty groups (after stripping) are also removed. This prevents broken queries from stale filter state.

### Sort Validation (applyViewSorts)

`SortModel.applyViewSorts` validates each field against the sortable fields lookup. Unknown fields are silently skipped.
