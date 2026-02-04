// VM exports
export {
  SchemaEditorVM,
  type SchemaEditorMode,
  type SchemaEditorOptions,
  type ForeignKeySelectionCallback,
} from './vm';
export { BaseNodeVM } from './vm';
export { ObjectNodeVM } from './vm';
export { ArrayNodeVM } from './vm';
export { PrimitiveNodeVM } from './vm';
export { ForeignKeyNodeVM } from './vm';
export { RefNodeVM } from './vm';
export { createNodeVM, type NodeVM } from './vm';

// Config exports
export {
  SchemaTypeIds,
  typeMenuGroups,
  type MenuOptionItem,
  type MenuGroup,
  fileSchema,
  systemSchemaRegistry,
  getResolvedSchema,
  isResolvableRef,
} from './config';

// Type exports
export {
  type JsonValue,
  JsonSchemaTypeName,
  type JsonPatch,
  ViewerSwitcherMode,
  SystemSchemaIds,
  getLabelByRef,
} from './types';

// UI exports
export * from './ui';
