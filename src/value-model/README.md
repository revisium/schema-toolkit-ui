# value-model

Reactive TypeScript library for managing JSON Schema-based data structures with built-in validation, computed fields (formulas), and change tracking.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         ValueTree                                │
│  ┌─────────────┐  ┌─────────────┐   ┌─────────────────────────┐  │
│  │  TreeIndex  │  │ChangeTracker│   │     Root ValueNode      │  │
│  │  (lookup)   │  │  (patches)  │   │                         │  │
│  └─────────────┘  └─────────────┘   │  ┌───────────────────┐  │  │
│                                     │  │  ObjectValueNode  │  │  │
│                                     │  │  ┌─────┐ ┌─────┐  │  │  │
│                                     │  │  │Str  │ │Num  │  │  │  │
│                                     │  │  │Node │ │Node │  │  │  │
│                                     │  │  └─────┘ └─────┘  │  │  │
│                                     │  └───────────────────┘  │  │
│                                     └─────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ FormulaEngine   │  │ValidationEngine │  │  Serialization  │
│ (computed)      │  │ (diagnostics)   │  │  (transforms)   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Directory Structure

```
value-model/
├── core/                 # Path abstraction, types, diagnostics
├── node/                 # ValueNode hierarchy (String, Number, Boolean, Object, Array)
├── tree/                 # ValueTree, TreeIndex, ChangeTracker
├── formula/              # Formula evaluation with dependency tracking
├── validation/           # Rule-based validation engine
├── serialization/        # Custom serializers (Date, File)
├── defaults/             # Default value generators
├── handlers/             # Change handlers
├── factory.ts            # Entry point factories
└── index.ts              # Public API exports
```

## Quick Start

```typescript
import { createValueModel } from './value-model';

const schema = {
  type: 'object',
  properties: {
    price: { type: 'number', default: 0 },
    quantity: { type: 'number', default: 0 },
    total: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'price * quantity' },
    },
  },
};

const tree = createValueModel(schema, { price: 100, quantity: 5, total: 0 });

// Query
tree.getValue('total');           // 500 (computed by formula)
tree.get('price')?.value;         // 100

// Mutate
tree.setValue('price', 200);
tree.getValue('total');           // 1000 (auto-recalculated)

// Validation
tree.isValid;                     // true/false
tree.allErrors;                   // Diagnostic[]

// Change tracking
tree.getPatches();                // JSON Patch (RFC 6902)

// Commit/Revert
tree.commit();
tree.revert();
```

## Core Concepts

### ValueNode Hierarchy

| Type | Description | Key Methods |
|------|-------------|-------------|
| `StringValueNode` | String primitive | `value`, `setValue()` |
| `NumberValueNode` | Number primitive | `value`, `setValue()` |
| `BooleanValueNode` | Boolean primitive | `value`, `setValue()` |
| `ObjectValueNode` | Object container | `child()`, `children()` |
| `ArrayValueNode` | Array container | `at()`, `push()`, `insertAt()`, `removeAt()`, `move()` |

All nodes support:
- `id` - unique identifier
- `name` - property name
- `schema` - JSON Schema definition
- `parent` - parent node reference
- `errors` / `warnings` - diagnostics
- `isDirty` / `commit()` / `revert()` - dirty tracking

### Path Navigation

```typescript
import { Path } from './value-model';

const path = Path.fromString('items[0].price');

path.asSimple();        // "items[0].price"
path.asJsonPointer();   // "/items/0/price"
path.parent();          // Path for "items[0]"
path.child('tax');      // Path for "items[0].price.tax"
```

### ValueTree API

```typescript
interface ValueTree {
  // Root
  root: ValueNode;

  // Queries
  get(path: string): ValueNode | undefined;
  getValue(path: string): unknown;
  getPlainValue(): unknown;
  nodeById(id: string): ValueNode | undefined;
  pathOf(node: ValueNode): Path;

  // Mutations
  setValue(path: string, value: unknown): void;

  // Validation
  isValid: boolean;
  allErrors: Diagnostic[];
  allWarnings: Diagnostic[];

  // Change tracking
  changes: Change[];
  hasChanges: boolean;
  getPatches(): JsonPatch[];

  // Lifecycle
  isDirty: boolean;
  commit(): void;
  revert(): void;
}
```

## Formula Engine

Evaluates computed fields with automatic dependency tracking.

```typescript
import { FormulaEngine } from './value-model';

const schema = {
  type: 'object',
  properties: {
    a: { type: 'number', default: 0 },
    b: { type: 'number', default: 0 },
    sum: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a + b' },
    },
  },
};

const tree = createValueModel(schema, { a: 1, b: 2, sum: 0 });
const engine = new FormulaEngine(tree);

tree.getValue('sum');  // 3

tree.setValue('a', 10);
tree.getValue('sum');  // 12 (auto-recalculated)

engine.dispose();  // cleanup
```

### Formula Features

- **Relative paths**: `price`, `item.price`
- **Absolute paths**: `/taxRate`, `/settings/discount`
- **Parent references**: `../discount`
- **Array item context**: formulas in array items resolve relative to item
- **Chained dependencies**: A → B → C evaluated in correct order
- **Warnings**: NaN, Infinity, division by zero

## Validation Engine

Rule-based validation with pluggable validators.

```typescript
import { createValidationEngine } from './value-model';

const engine = createValidationEngine();

// Built-in validators:
// - required
// - minLength, maxLength
// - pattern
// - minimum, maximum
// - enum
// - foreignKey
```

### SchemaDefinition Validation Properties

```typescript
interface SchemaDefinition {
  type?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  foreignKey?: string;
}
```

## Array Operations

```typescript
const items = tree.get('items');

if (items?.isArray()) {
  // Add items
  items.pushValue({ name: 'New Item' });
  items.insertValueAt(0, { name: 'First' });

  // Manipulate
  items.move(0, 2);      // move item from index 0 to 2
  items.removeAt(1);     // remove item at index 1

  // Access
  const first = items.at(0);
  const count = items.length;
}
```

## Change Tracking

```typescript
// Track changes
tree.setValue('name', 'John');
tree.setValue('age', 30);

// Get all changes
tree.changes;
// [
//   { type: 'setValue', path: Path, value: 'John', oldValue: 'OldName' },
//   { type: 'setValue', path: Path, value: 30, oldValue: 25 }
// ]

// Convert to JSON Patch (RFC 6902)
tree.getPatches();
// [
//   { op: 'replace', path: '/name', value: 'John' },
//   { op: 'replace', path: '/age', value: 30 }
// ]

// Clear changes
tree.clearChanges();
```

## Dirty Tracking

```typescript
const tree = createValueModel(schema, { name: 'John' });

tree.isDirty;  // false

tree.setValue('name', 'Jane');
tree.isDirty;  // true

tree.commit();  // save current state as base
tree.isDirty;  // false

tree.setValue('name', 'Bob');
tree.revert();  // restore to last commit
tree.getValue('name');  // 'Jane'
```

## Type Guards

```typescript
const node = tree.get('someField');

if (node?.isPrimitive()) {
  node.value;
  node.setValue(newValue);
}

if (node?.isObject()) {
  node.child('fieldName');
  node.children();
}

if (node?.isArray()) {
  node.at(0);
  node.items;
  node.pushValue(newItem);
}
```

## Public API Exports

### Core
- `Path`, `PathSegment`
- `Diagnostic`, `DiagnosticSeverity`
- `SchemaDefinition`, `ValueType`
- `Change`, `ChangeType`, `JsonPatch`

### Nodes
- `StringValueNode`, `NumberValueNode`, `BooleanValueNode`
- `ObjectValueNode`, `ArrayValueNode`
- `NodeFactory`, `createNodeFactory`

### Tree
- `ValueTree`, `TreeIndex`, `ChangeTracker`

### Factories
- `createValueModel(schema, value, options?)`
- `createEmptyValueModel(schema, options?)`

### Formula
- `FormulaEngine`, `FormulaCollector`, `DependencyGraph`

### Validation
- `ValidationEngine`, `ValidatorRegistry`, `ValidatorResolver`
- Base validators: `BaseStringLengthValidator`, `BaseNumberBoundValidator`
- Built-in validators: `RequiredValidator`, `MinLengthValidator`, `MaxLengthValidator`, `MinimumValidator`, `MaximumValidator`, `PatternValidator`, `EnumValidator`, `ForeignKeyValidator`

### Serialization
- `SerializerRegistry`, `DateSerializer`, `FileSerializer`

### Defaults
- `DefaultValueRegistry`

### Handlers
- `ChangeHandlerRegistry`

## Design Principles

1. **Path as Value Object** - Never manipulate paths as strings
2. **Observable by Default** - MobX integration for React reactivity
3. **Plugin Architecture** - Registries for validators, serializers, handlers
4. **Immutable Node Identity** - Node instances stable, values change
5. **Tree as Single Source of Truth** - All state flows through ValueTree
6. **Separation of Concerns** - Independent engines for formula, validation
