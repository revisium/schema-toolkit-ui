export {
  SchemaEditorCore,
  type SchemaEditorCoreOptions,
  type ForeignKeySelectionCallback,
  type ViewMode,
} from './model/core';

export {
  SchemaTreeVM,
  CreatingEditorVM,
  UpdatingEditorVM,
  type CreatingEditorVMOptions,
  type UpdatingEditorVMOptions,
  type CreateDialogViewMode,
  type UpdateDialogViewMode,
} from './model/vm';

export { TreeState } from './model/state';

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

export {
  ReviewErrorsDialogVM,
  ReviewChangesDialogVM,
  CreateTableDialogVM,
  type ReviewChangesViewMode,
  type CreateTableViewMode,
  type TableIdChangeInfo,
} from './model/dialog';

export {
  SchemaTypeIds,
  getLabelByRef,
  typeMenuGroups,
  type MenuOptionItem,
  type MenuGroup,
} from './config';

export {
  CreatingSchemaEditor,
  UpdatingSchemaEditor,
  type CreatingSchemaEditorProps,
  type UpdatingSchemaEditorProps,
} from './ui';

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

export {
  ReviewErrorsDialog,
  ReviewChangesDialog,
  CreateTableDialog,
} from './ui/dialog';

export type {
  JsonValue,
  NodeType,
  NodeUIState,
  FormulaState,
  DragState,
} from './types';
