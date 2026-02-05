// Model - Core
export {
  SchemaEditorCore,
  type SchemaEditorCoreOptions,
  type ForeignKeySelectionCallback,
  type ViewMode,
} from './model/core';

// Model - ViewModels
export {
  SchemaTreeVM,
  CreatingEditorVM,
  UpdatingEditorVM,
  type CreatingEditorVMOptions,
  type UpdatingEditorVMOptions,
  type CreateDialogViewMode,
  type UpdateDialogViewMode,
} from './model/vm';

// Model - State
export { TreeState } from './model/state';

// Model - Accessor
export {
  NodeAccessor,
  NodeState,
  NodeLabel,
  NodeFormula,
  NodeValidation,
  NodeActions,
  type NodeAccessorContext,
  type NodeActionsCallbacks,
} from './model/accessor';

// Model - Dialog ViewModels
export {
  ReviewErrorsDialogVM,
  ReviewChangesDialogVM,
  CreateTableDialogVM,
  type ReviewChangesViewMode,
  type CreateTableViewMode,
  type TableIdChangeInfo,
} from './model/dialog';

// Config
export {
  SchemaTypeIds,
  SystemSchemaIds,
  getLabelByRef,
  typeMenuGroups,
  type MenuOptionItem,
  type MenuGroup,
} from './config';

// UI - Main editors
export {
  CreatingSchemaEditor,
  UpdatingSchemaEditor,
  type CreatingSchemaEditorProps,
  type UpdatingSchemaEditorProps,
} from './ui';

// UI - Tree components
export {
  TreeNodeView,
  TreeNodeWrapper,
  TreeNodeField,
  TreeNodeContextMenu,
  TreeNodeIndicators,
  TreeNodeRightContent,
  ObjectNodeView,
  ArrayNodeView,
  PrimitiveNodeView,
  ForeignKeyNodeView,
  RefNodeView,
} from './ui/tree';

// UI - Dialog components
export {
  ReviewErrorsDialog,
  ReviewChangesDialog,
  CreateTableDialog,
} from './ui/dialog';

// Types
export type {
  JsonValue,
  NodeType,
  NodeUIState,
  FormulaState,
  DragState,
} from './types';
