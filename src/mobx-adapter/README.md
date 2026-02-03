# MobX Adapter

MobX implementation of the `ReactivityAdapter` interface from `@revisium/schema-toolkit`.

## Usage

```typescript
import { mobxAdapter } from '@revisium/schema-toolkit-ui';
import { createSchemaModel } from '@revisium/schema-toolkit/model';

const model = createSchemaModel(schema, {
  reactivity: mobxAdapter,
});
```

## API

### `mobxAdapter.makeObservable(target, annotations)`

Makes object properties observable using MobX.

**Annotation mapping:**
- `'observable'` → `mobx.observable`
- `'observable.ref'` → `mobx.observable.ref`
- `'computed'` → `mobx.computed`
- `'action'` → `mobx.action`

### `mobxAdapter.observableArray<T>()`

Creates an empty MobX observable array.

### `mobxAdapter.observableMap<K, V>()`

Creates an empty MobX observable map.

### `mobxAdapter.reaction(expression, effect)`

Creates a MobX reaction. Returns a dispose function.

### `mobxAdapter.runInAction(fn)`

Executes function in MobX action context, batching updates.
