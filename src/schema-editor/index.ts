// Types
export {
  JsonSchemaTypeName,
  ViewerSwitcherMode,
  SystemSchemaIds,
  getLabelByRef,
  type JsonValue,
  type JsonPatch,
} from './types';

// Model (engine, nodes, tree, etc.)
export * from './model';

// ViewModels
export {
  SchemaEditorVM,
  type SchemaEditorOptions,
  type ForeignKeySelectionCallback,
} from './vm';
export type { NodeVM } from './vm';
export {
  BaseNodeVM,
  ObjectNodeVM,
  ArrayNodeVM,
  PrimitiveNodeVM,
  ForeignKeyNodeVM,
  RefNodeVM,
} from './vm';

// Config
export {
  SchemaTypeIds,
  createNodeByTypeId,
  typeMenuGroups,
  type MenuOptionItem,
  type MenuGroup,
} from './config';

// UI Components
export { SchemaEditor } from './ui';
