import type { CellVM } from '../../model/CellVM.js';
import type { SelectionEdges } from '../../model/CellFSM.js';
import { BOTTOM_BORDER_SHADOW } from '../borderConstants.js';

export type CellState =
  | 'display'
  | 'focused'
  | 'editing'
  | 'readonly'
  | 'readonlyFocused'
  | 'selected';

export const FOCUS_RING_RESET = {
  outline: 'none',
  boxShadow: 'none',
};

export const SELECTION_BORDER_COLOR = '#3b82f6';

export function buildSelectionBoxShadow(edges: SelectionEdges): string | null {
  const shadows: string[] = [];
  if (edges.top) {
    shadows.push(`inset 0 2px 0 0 ${SELECTION_BORDER_COLOR}`);
  }
  if (edges.bottom) {
    shadows.push(`inset 0 -2px 0 0 ${SELECTION_BORDER_COLOR}`);
  }
  if (edges.left) {
    shadows.push(`inset 2px 0 0 0 ${SELECTION_BORDER_COLOR}`);
  }
  if (edges.right) {
    shadows.push(`inset -2px 0 0 0 ${SELECTION_BORDER_COLOR}`);
  }
  return shadows.length > 0 ? shadows.join(', ') : null;
}

export const stateStyles: Record<CellState, object> = {
  display: {
    cursor: 'cell',
    _hover: {
      bg: 'gray.50',
      boxShadow: BOTTOM_BORDER_SHADOW,
    },
  },
  focused: {
    cursor: 'cell',
    bg: 'blue.50',
    _before: {
      content: '""',
      position: 'absolute',
      inset: '1px',
      border: '2px solid',
      borderColor: 'blue.400',
      borderRadius: '1px',
      pointerEvents: 'none',
    },
    _focus: FOCUS_RING_RESET,
    _focusVisible: FOCUS_RING_RESET,
  },
  editing: {
    cursor: 'text',
    bg: 'white',
    zIndex: 1,
    _before: {
      content: '""',
      position: 'absolute',
      inset: '1px',
      border: '2px solid',
      borderColor: 'blue.500',
      borderRadius: '1px',
      pointerEvents: 'none',
    },
    _focus: FOCUS_RING_RESET,
    _focusVisible: FOCUS_RING_RESET,
  },
  readonly: {
    cursor: 'cell',
    _hover: {
      bg: 'gray.50',
      boxShadow: BOTTOM_BORDER_SHADOW,
    },
  },
  readonlyFocused: {
    cursor: 'cell',
    bg: 'gray.50',
    _before: {
      content: '""',
      position: 'absolute',
      inset: '1px',
      border: '2px solid',
      borderColor: 'gray.400',
      borderRadius: '1px',
      pointerEvents: 'none',
    },
    _focus: FOCUS_RING_RESET,
    _focusVisible: FOCUS_RING_RESET,
  },
  selected: {
    cursor: 'cell',
    bg: 'blue.100',
  },
};

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
