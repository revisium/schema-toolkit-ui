import type { CellVM } from '../../model/CellVM.js';
import type { SelectionEdges } from '../../model/CellFSM.js';

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

export const RANGE_BORDER_COLOR = 'blue.400';

export function buildSelectionBorderStyle(edges: SelectionEdges): object {
  return {
    content: '""',
    position: 'absolute',
    top: edges.top ? '-1px' : 0,
    bottom: edges.bottom ? '-1px' : 0,
    left: edges.left ? '-1px' : 0,
    right: edges.right ? '-1px' : 0,
    borderTop: edges.top ? '2px solid' : 'none',
    borderBottom: edges.bottom ? '2px solid' : 'none',
    borderLeft: edges.left ? '2px solid' : 'none',
    borderRight: edges.right ? '2px solid' : 'none',
    borderColor: RANGE_BORDER_COLOR,
    pointerEvents: 'none',
    zIndex: 2,
  };
}

export const stateStyles: Record<CellState, object> = {
  display: {
    cursor: 'cell',
    _hover: {
      bg: 'gray.50',
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
    cursor: 'default',
    color: 'gray.500',
  },
  readonlyFocused: {
    cursor: 'default',
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
  const hasRange = cell.hasRangeSelection;

  if (cell.isReadOnly) {
    if (cell.isFocused && !hasRange) {
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
  if (cell.isFocused && !hasRange) {
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
