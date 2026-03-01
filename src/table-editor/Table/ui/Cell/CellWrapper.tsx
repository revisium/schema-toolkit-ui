import { Menu } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import {
  type CSSProperties,
  FC,
  PropsWithChildren,
  useCallback,
  useRef,
} from 'react';
import type { CellVM } from '../../model/CellVM.js';
import { CellContextMenu } from './CellContextMenu.js';
import {
  buildSelectionBoxShadow,
  CLS_ANCHOR,
  ensureCellStyles,
  INNER_STYLE,
  STATE_CLASS,
} from './cellCss.js';
import { getCellState } from './cellStyles.js';
import {
  useCellContextMenu,
  setPendingContextMenu,
  hasPendingContextMenu,
} from './useCellContextMenu.js';
import { useCellFocus } from './useCellFocus.js';
import { useCellKeyboard } from './useCellKeyboard.js';
import { useDeferredMenuEdit } from './useDeferredMenuEdit.js';

interface CellWrapperProps extends PropsWithChildren {
  cell: CellVM;
  onDoubleClick?: (clientX?: number) => void;
  onStartEdit?: () => void;
  onTypeChar?: (char: string) => void;
  onDelete?: () => void;
}

// ───────────────── Context menu (lazy) ─────────────────

interface LazyMenuProps {
  cell: CellVM;
  cellRef: React.RefObject<HTMLDivElement | null>;
  anchorRect: DOMRect | null;
  onClose: () => void;
  onEditPointerDown: () => void;
}

const LazyContextMenu: FC<LazyMenuProps> = observer(
  ({ cell, cellRef, anchorRect, onClose, onEditPointerDown }) => {
    const handleOpenChange = useCallback(
      (details: { open: boolean }) => {
        if (!details.open) {
          onClose();
        }
      },
      [onClose],
    );

    const handleInteractOutside = useCallback((e: Event) => {
      const ce = e as CustomEvent<{ originalEvent?: PointerEvent }>;
      const originalEvent = ce.detail?.originalEvent;
      if (!originalEvent || originalEvent.button !== 2) {
        return;
      }
      const target = originalEvent.target as HTMLElement | null;
      const targetCell = target?.closest(
        '[data-testid^="cell-"]',
      ) as HTMLElement | null;
      if (targetCell) {
        setPendingContextMenu({
          target: targetCell,
          clientX: originalEvent.clientX,
          clientY: originalEvent.clientY,
        });
      }
    }, []);

    const getAnchorRect = useCallback(() => {
      return anchorRect ?? (cellRef.current?.getBoundingClientRect() || null);
    }, [anchorRect, cellRef]);

    return (
      <Menu.Root
        open
        onOpenChange={handleOpenChange}
        onInteractOutside={handleInteractOutside}
        positioning={{
          placement: 'bottom-start',
          getAnchorRect,
        }}
      >
        <CellContextMenu cell={cell} onEditPointerDown={onEditPointerDown} />
      </Menu.Root>
    );
  },
);

// ───────────────── Main component ─────────────────

export const CellWrapper: FC<CellWrapperProps> = observer(
  ({ cell, children, onDoubleClick, onStartEdit, onTypeChar, onDelete }) => {
    ensureCellStyles();

    const cellRef = useRef<HTMLDivElement>(null);
    const state = getCellState(cell);
    const selectionEdges = cell.selectionEdges;
    const isAnchorInRange = cell.isAnchor && cell.isInSelection;
    const navVersion = cell.navigationVersion;

    const isActive =
      state === 'focused' ||
      state === 'editing' ||
      state === 'readonlyFocused' ||
      isAnchorInRange;

    const editFn = onStartEdit ?? onDoubleClick;
    const deferredEdit = useDeferredMenuEdit(editFn);

    const {
      menuAnchor,
      menuOpen,
      openContextMenuAt,
      handleMenuClose,
      menuCloseRef,
    } = useCellContextMenu(cell, cellRef, deferredEdit);

    useCellFocus(cellRef, state, isAnchorInRange, navVersion);

    const { handleKeyDown, handleDoubleClick } = useCellKeyboard(
      cell,
      state,
      isAnchorInRange,
      menuOpen,
      menuCloseRef,
      { onStartEdit, onDoubleClick, onTypeChar, onDelete },
    );

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (
          e.detail === 2 &&
          state !== 'readonly' &&
          state !== 'readonlyFocused'
        ) {
          e.preventDefault();
        }
        if (e.button === 2) {
          if (!hasPendingContextMenu()) {
            openContextMenuAt(e.clientX, e.clientY);
          }
          return;
        }
        if (!e.shiftKey && e.button === 0 && state !== 'editing') {
          e.preventDefault();
          cell.dragStart();
          cellRef.current?.focus();
        }
      },
      [state, cell, openContextMenuAt],
    );

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        if (state === 'editing') {
          return;
        }
        if (e.shiftKey) {
          cell.selectTo();
        } else {
          cell.focus();
        }
      },
      [state, cell],
    );

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent) => {
        if (e.buttons === 1) {
          cell.dragExtend();
        }
      },
      [cell],
    );

    const handleBlur = useCallback(
      (e: React.FocusEvent) => {
        if (!cell.isFocused || cell.isEditing) {
          return;
        }
        if (menuOpen) {
          return;
        }
        const related = e.relatedTarget as HTMLElement | null;
        if (related?.closest('[data-testid^="cell-"]')) {
          return;
        }
        cell.blur();
      },
      [cell, menuOpen],
    );

    const selectionShadow = selectionEdges
      ? buildSelectionBoxShadow(selectionEdges)
      : null;

    let className = STATE_CLASS[state];
    if (isAnchorInRange) {
      className += ` ${CLS_ANCHOR}`;
    }

    const cellStyle = selectionShadow
      ? ({ '--cw-shadow': selectionShadow } as CSSProperties)
      : undefined;

    return (
      <>
        <div
          ref={cellRef}
          className={className}
          style={cellStyle}
          tabIndex={isActive ? 0 : -1}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          onMouseEnter={handleMouseEnter}
          onDoubleClick={isActive ? handleDoubleClick : undefined}
          onKeyDown={isActive ? handleKeyDown : undefined}
          onBlur={isActive ? handleBlur : undefined}
          onContextMenu={preventContextMenu}
          data-testid={`cell-${cell.rowId}-${cell.field}`}
        >
          <div style={INNER_STYLE}>{children}</div>
        </div>
        {menuOpen && (
          <LazyContextMenu
            cell={cell}
            cellRef={cellRef}
            anchorRect={menuAnchor}
            onClose={handleMenuClose}
            onEditPointerDown={deferredEdit.requestEdit}
          />
        )}
      </>
    );
  },
);

function preventContextMenu(e: React.MouseEvent): void {
  e.preventDefault();
}
