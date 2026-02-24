import { useCallback } from 'react';
import type { CellVM } from '../../model/CellVM.js';
import { isPrintableKey, type CellState } from './cellStyles.js';

export interface CellKeyboardCallbacks {
  onStartEdit?: () => void;
  onDoubleClick?: (clientX?: number) => void;
  onTypeChar?: (char: string) => void;
  onDelete?: () => void;
}

function handleArrowKey(
  cell: CellVM,
  e: React.KeyboardEvent,
  shiftAction: () => void,
  moveAction: () => void,
): void {
  e.preventDefault();
  if (e.shiftKey) {
    shiftAction();
  } else if (cell.hasRangeSelection) {
    cell.focus();
  } else {
    moveAction();
  }
}

function handleEditableKeys(
  cell: CellVM,
  e: React.KeyboardEvent,
  callbacks: CellKeyboardCallbacks,
): void {
  if (cell.isReadOnly) {
    if (
      e.key === 'Enter' ||
      e.key === 'Delete' ||
      e.key === 'Backspace' ||
      isPrintableKey(e)
    ) {
      e.preventDefault();
      cell.notifyReadonlyEditAttempt();
    }
    return;
  }
  const hasRange = cell.hasRangeSelection;
  if (!hasRange && e.key === 'Enter') {
    e.preventDefault();
    if (callbacks.onStartEdit) {
      callbacks.onStartEdit();
    } else if (callbacks.onDoubleClick) {
      callbacks.onDoubleClick();
    }
  } else if (
    !hasRange &&
    (e.key === 'Delete' || e.key === 'Backspace') &&
    callbacks.onDelete
  ) {
    e.preventDefault();
    callbacks.onDelete();
  } else if (isPrintableKey(e) && callbacks.onTypeChar) {
    e.preventDefault();
    callbacks.onTypeChar(e.key);
  }
}

export function useCellKeyboard(
  cell: CellVM,
  state: CellState,
  isAnchorInRange: boolean,
  menuOpen: boolean,
  menuCloseRef: React.RefObject<(() => void) | null>,
  callbacks: CellKeyboardCallbacks,
): {
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleDoubleClick: (e: React.MouseEvent) => void;
} {
  const { onStartEdit, onDoubleClick, onTypeChar, onDelete } = callbacks;

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (menuOpen && e.key === 'Escape') {
        e.preventDefault();
        menuCloseRef.current?.();
        return;
      }

      const canHandle =
        state === 'focused' || state === 'readonlyFocused' || isAnchorInRange;
      if (!canHandle) {
        return;
      }

      const isMod = e.ctrlKey || e.metaKey;
      if (isMod && e.key === 'c' && !cell.hasRangeSelection) {
        e.preventDefault();
        void cell.copyToClipboard();
        return;
      }
      if (isMod && e.key === 'v') {
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        if (cell.hasRangeSelection) {
          cell.focus();
        } else {
          cell.blur();
        }
      } else if (e.key === 'ArrowUp') {
        handleArrowKey(cell, e, cell.shiftMoveUp, cell.moveUp);
      } else if (e.key === 'ArrowDown') {
        handleArrowKey(cell, e, cell.shiftMoveDown, cell.moveDown);
      } else if (e.key === 'ArrowLeft') {
        handleArrowKey(cell, e, cell.shiftMoveLeft, cell.moveLeft);
      } else if (e.key === 'ArrowRight') {
        handleArrowKey(cell, e, cell.shiftMoveRight, cell.moveRight);
      } else if (e.key === 'Tab') {
        e.preventDefault();
        cell.handleTab(e.shiftKey);
      } else {
        handleEditableKeys(cell, e, {
          onStartEdit,
          onDoubleClick,
          onTypeChar,
          onDelete,
        });
      }
    },
    [
      state,
      cell,
      isAnchorInRange,
      menuOpen,
      menuCloseRef,
      onStartEdit,
      onDoubleClick,
      onTypeChar,
      onDelete,
    ],
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (state === 'readonly' || state === 'readonlyFocused') {
        cell.notifyReadonlyEditAttempt();
        return;
      }
      onDoubleClick?.(e.clientX);
    },
    [state, cell, onDoubleClick],
  );

  return { handleKeyDown, handleDoubleClick };
}
