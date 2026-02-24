import type { CellVM } from '../../model/CellVM.js';

export type CellState =
  | 'display'
  | 'focused'
  | 'editing'
  | 'readonly'
  | 'readonlyFocused'
  | 'selected';

export const SELECTION_BORDER_COLOR = '#3b82f6';

export function getCellState(cell: CellVM): CellState {
  if (cell.isReadOnly) {
    if (cell.isFocused && !cell.isInSelection) {
      return 'readonlyFocused';
    }
    if (cell.isInSelection) {
      return 'selected';
    }
    return 'readonly';
  }
  if (cell.isEditing) {
    return 'editing';
  }
  if (cell.isFocused && !cell.isInSelection) {
    return 'focused';
  }
  if (cell.isInSelection) {
    return 'selected';
  }
  return 'display';
}

export function isPrintableKey(e: React.KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return false;
  }
  return e.key.length === 1;
}
