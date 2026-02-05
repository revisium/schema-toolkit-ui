export type {
  SchemaNode,
  SchemaModel,
  FieldType,
  JsonPatch,
} from '@revisium/schema-toolkit';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type NodeType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'ref'
  | 'foreignKey';

export interface NodeUIState {
  isExpanded: boolean;
  isFocused: boolean;
  isMenuOpen: boolean;
  isSettingsOpen: boolean;
}

export interface FormulaState {
  inputValue: string | null;
  errorValue: string | null;
}

export interface DragState {
  isDragging: boolean;
  isDraggedOver: boolean;
}

export enum ViewerSwitcherMode {
  Tree = 'Tree',
  Json = 'Json',
  RefBy = 'RefBy',
}
