import { useEffect } from 'react';
import type { CellState } from './cellStyles.js';

export function useCellFocus(
  cellRef: React.RefObject<HTMLDivElement | null>,
  state: CellState,
  isAnchorInRange: boolean,
  navVersion: number,
): void {
  useEffect(() => {
    if (!cellRef.current) {
      return;
    }
    if (state === 'focused' || state === 'readonlyFocused' || isAnchorInRange) {
      cellRef.current.focus();
    } else if (
      state === 'display' ||
      state === 'readonly' ||
      state === 'selected'
    ) {
      cellRef.current.blur();
    }
  }, [cellRef, state, isAnchorInRange, navVersion]);
}
