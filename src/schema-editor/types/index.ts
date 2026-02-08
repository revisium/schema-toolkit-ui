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
