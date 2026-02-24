import { useCallback, useEffect, useRef, useState } from 'react';
import type { CellVM } from '../../model/CellVM.js';

interface PendingContextMenu {
  target: HTMLElement;
  clientX: number;
  clientY: number;
}

export let pendingContextMenu: PendingContextMenu | null = null;

export function clearPendingContextMenu(): PendingContextMenu | null {
  const pending = pendingContextMenu;
  pendingContextMenu = null;
  return pending;
}

export function setPendingContextMenu(value: PendingContextMenu): void {
  pendingContextMenu = value;
}

type OpenMenuFn = (clientX: number, clientY: number) => void;
export const cellMenuRegistry = new WeakMap<HTMLElement, OpenMenuFn>();

export function useCellContextMenu(
  cell: CellVM,
  cellRef: React.RefObject<HTMLDivElement | null>,
  deferredEdit: { triggerIfRequested: () => boolean },
): {
  menuAnchor: DOMRect | null;
  menuOpen: boolean;
  openContextMenuAt: (clientX: number, clientY: number) => void;
  handleMenuClose: () => void;
  menuCloseRef: React.RefObject<(() => void) | null>;
} {
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const menuOpen = menuAnchor !== null;

  const openContextMenuAt = useCallback(
    (clientX: number, clientY: number) => {
      if (!cell.isFocused && !cell.isInSelection) {
        cell.focus();
      }
      const rect = new DOMRect(clientX, clientY, 0, 0);
      setMenuAnchor(rect);
    },
    [cell],
  );

  useEffect(() => {
    const el = cellRef.current;
    if (el) {
      cellMenuRegistry.set(el, openContextMenuAt);
    }
    return () => {
      if (el) {
        cellMenuRegistry.delete(el);
      }
    };
  }, [cellRef, openContextMenuAt]);

  const menuCloseRef = useRef<(() => void) | null>(null);

  const handleMenuClose = useCallback(() => {
    const pending = clearPendingContextMenu();

    const didTriggerEdit = deferredEdit.triggerIfRequested();
    if (!pending && !didTriggerEdit && !cell.isEditing) {
      if (cell.isAnchor || (cell.isFocused && !cell.hasRangeSelection)) {
        cellRef.current?.focus();
      } else {
        const table = cellRef.current?.closest('[data-testid="table-widget"]');
        const anchor = table?.querySelector<HTMLElement>(
          '[data-testid^="cell-"][tabindex="0"]',
        );
        anchor?.focus();
      }
    }
    setMenuAnchor(null);

    if (pending) {
      const openFn = cellMenuRegistry.get(pending.target);
      if (openFn) {
        setTimeout(() => {
          openFn(pending.clientX, pending.clientY);
        }, 0);
      }
    }
  }, [cell, cellRef, deferredEdit]);

  menuCloseRef.current = handleMenuClose;

  return {
    menuAnchor,
    menuOpen,
    openContextMenuAt,
    handleMenuClose,
    menuCloseRef,
  };
}
