import { Box, Menu } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import type { CellVM } from '../../model/CellVM.js';
import { CellContextMenu } from './CellContextMenu.js';
import { useDeferredMenuEdit } from './useDeferredMenuEdit.js';
import {
  FOCUS_RING_RESET,
  buildSelectionBorderStyle,
  stateStyles,
  getCellState,
  isPrintableKey,
} from './cellStyles.js';

interface CellWrapperProps extends PropsWithChildren {
  cell: CellVM;
  onDoubleClick?: (clientX?: number) => void;
  onStartEdit?: () => void;
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
  onStartEdit?: () => void,
  onDoubleClick?: (clientX?: number) => void,
  onTypeChar?: (char: string) => void,
  onDelete?: () => void,
): void {
  if (cell.isReadOnly) {
    return;
  }
  const hasRange = cell.hasRangeSelection;
  if (!hasRange && e.key === 'Enter') {
    e.preventDefault();
    if (onStartEdit) {
      onStartEdit();
    } else if (onDoubleClick) {
      onDoubleClick();
    }
  } else if (
    !hasRange &&
    (e.key === 'Delete' || e.key === 'Backspace') &&
    onDelete
  ) {
    e.preventDefault();
    onDelete();
  } else if (isPrintableKey(e) && onTypeChar) {
    e.preventDefault();
    onTypeChar(e.key);
  }
}

export const CellWrapper: FC<CellWrapperProps> = observer(
  ({ cell, children, onDoubleClick, onStartEdit, onTypeChar, onDelete }) => {
    const cellRef = useRef<HTMLDivElement>(null);
    const menuOpenRef = useRef(false);
    const deferredEdit = useDeferredMenuEdit(onStartEdit ?? onDoubleClick);
    const state = getCellState(cell);
    const selectionEdges = cell.selectionEdges;
    const isAnchorInRange = cell.isAnchor && cell.hasRangeSelection;
    const navVersion = cell.navigationVersion;

    useEffect(() => {
      if (!cellRef.current) {
        return;
      }
      if (
        state === 'focused' ||
        state === 'readonlyFocused' ||
        isAnchorInRange
      ) {
        cellRef.current.focus();
      } else if (
        state === 'display' ||
        state === 'readonly' ||
        state === 'selected'
      ) {
        cellRef.current.blur();
      }
    }, [state, isAnchorInRange, navVersion]);

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

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (
          e.detail === 2 &&
          state !== 'readonly' &&
          state !== 'readonlyFocused'
        ) {
          e.preventDefault();
        }
        if (!e.shiftKey && e.button === 0 && state !== 'editing') {
          e.preventDefault();
          cell.dragStart();
          cellRef.current?.focus();
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

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        if (state !== 'readonly' && state !== 'readonlyFocused') {
          onDoubleClick?.(e.clientX);
        }
      },
      [state, onDoubleClick],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
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
          handleEditableKeys(
            cell,
            e,
            onStartEdit,
            onDoubleClick,
            onTypeChar,
            onDelete,
          );
        }
      },
      [
        state,
        cell,
        isAnchorInRange,
        onStartEdit,
        onDoubleClick,
        onTypeChar,
        onDelete,
      ],
    );

    const afterStyle = selectionEdges
      ? buildSelectionBorderStyle(selectionEdges)
      : undefined;

    const needsFocus =
      state === 'focused' ||
      state === 'editing' ||
      state === 'readonlyFocused' ||
      isAnchorInRange;

    const handleBlur = useCallback(
      (e: React.FocusEvent) => {
        if (!cell.isFocused || cell.isEditing) {
          return;
        }
        if (menuOpenRef.current) {
          return;
        }
        const related = e.relatedTarget as HTMLElement | null;
        if (related?.closest('[data-testid^="cell-"]')) {
          return;
        }
        cell.blur();
      },
      [cell],
    );

    const handleContextMenu = useCallback(() => {
      if (!cell.isFocused && !cell.isInSelection) {
        cell.focus();
      }
    }, [cell]);

    const handleMenuOpenChange = useCallback(
      (details: { open: boolean }) => {
        menuOpenRef.current = details.open;
        if (details.open) {
          return;
        }
        if (deferredEdit.triggerIfRequested()) {
          return;
        }
        if (cell.isEditing) {
          return;
        }
        if (cell.isAnchor || (cell.isFocused && !cell.hasRangeSelection)) {
          cellRef.current?.focus();
        } else {
          const table = cellRef.current?.closest(
            '[data-testid="table-widget"]',
          );
          const anchor = table?.querySelector<HTMLElement>(
            '[data-testid^="cell-"][tabindex="0"]',
          );
          anchor?.focus();
        }
      },
      [cell, deferredEdit],
    );

    const extraStyles: Record<string, unknown> = {};
    if (isAnchorInRange) {
      extraStyles._before = {
        content: '""',
        position: 'absolute',
        inset: '1px',
        border: '2px solid',
        borderColor: 'blue.400',
        borderRadius: '1px',
        pointerEvents: 'none',
        zIndex: 3,
      };
      extraStyles._focus = FOCUS_RING_RESET;
      extraStyles._focusVisible = FOCUS_RING_RESET;
    }

    return (
      <Menu.Root onOpenChange={handleMenuOpenChange}>
        <Menu.ContextTrigger asChild>
          <Box
            ref={cellRef}
            height="40px"
            px="8px"
            position="relative"
            overflow={selectionEdges ? 'visible' : 'hidden'}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            onMouseEnter={handleMouseEnter}
            onDoubleClick={handleDoubleClick}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onContextMenu={handleContextMenu}
            tabIndex={needsFocus ? 0 : -1}
            userSelect={state === 'selected' ? 'none' : undefined}
            data-testid={`cell-${cell.rowId}-${cell.field}`}
            {...stateStyles[state]}
            {...extraStyles}
            _after={afterStyle}
          >
            <Box
              display="flex"
              alignItems="center"
              height="100%"
              width="100%"
              minWidth={0}
              overflow="hidden"
            >
              {children}
            </Box>
            {state === 'readonlyFocused' && (
              <Box
                position="absolute"
                top="1px"
                right="4px"
                fontSize="9px"
                lineHeight="1"
                color="gray.500"
                bg="gray.100"
                px="3px"
                py="1px"
                borderRadius="2px"
                userSelect="none"
                pointerEvents="none"
              >
                readonly
              </Box>
            )}
          </Box>
        </Menu.ContextTrigger>
        <CellContextMenu
          cell={cell}
          onEditPointerDown={deferredEdit.requestEdit}
        />
      </Menu.Root>
    );
  },
);
