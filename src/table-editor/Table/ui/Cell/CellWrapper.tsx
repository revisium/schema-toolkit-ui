import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { FC, PropsWithChildren, useCallback, useEffect, useRef } from 'react';
import type { CellVM } from '../../model/CellVM.js';

type CellState = 'display' | 'focused' | 'editing' | 'readonly';

interface CellWrapperProps extends PropsWithChildren {
  cell: CellVM;
  onDoubleClick?: (clientX?: number) => void;
  onStartEdit?: () => void;
  onTypeChar?: (char: string) => void;
}

const stateStyles: Record<CellState, object> = {
  display: {
    cursor: 'cell',
    _hover: {
      bg: 'gray.50',
    },
  },
  focused: {
    cursor: 'cell',
    outline: '2px solid',
    outlineColor: 'blue.400',
    outlineOffset: '-2px',
    bg: 'blue.50',
  },
  editing: {
    cursor: 'text',
    outline: '2px solid',
    outlineColor: 'blue.500',
    outlineOffset: '-2px',
    bg: 'white',
    zIndex: 1000,
  },
  readonly: {
    cursor: 'default',
    color: 'gray.500',
  },
};

function getCellState(cell: CellVM): CellState {
  if (cell.isReadOnly) {
    return 'readonly';
  }
  if (cell.isEditing) {
    return 'editing';
  }
  if (cell.isFocused) {
    return 'focused';
  }
  return 'display';
}

function isPrintableKey(e: React.KeyboardEvent): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return false;
  }
  return e.key.length === 1;
}

export const CellWrapper: FC<CellWrapperProps> = observer(
  ({ cell, children, onDoubleClick, onStartEdit, onTypeChar }) => {
    const cellRef = useRef<HTMLDivElement>(null);
    const state = getCellState(cell);

    useEffect(() => {
      if (state === 'focused' && cellRef.current) {
        cellRef.current.focus();
      }
    }, [state]);

    const handleClick = useCallback(() => {
      if (state !== 'editing') {
        cell.focus();
      }
    }, [state, cell]);

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        if (e.detail === 2 && state !== 'readonly') {
          e.preventDefault();
        }
      },
      [state],
    );

    const handleDoubleClick = useCallback(
      (e: React.MouseEvent) => {
        if (state !== 'readonly') {
          onDoubleClick?.(e.clientX);
        }
      },
      [state, onDoubleClick],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (state === 'focused') {
          if (e.key === 'Escape') {
            e.preventDefault();
            cell.blur();
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (onStartEdit) {
              onStartEdit();
            } else if (onDoubleClick) {
              onDoubleClick();
            }
          } else if (isPrintableKey(e) && onTypeChar) {
            e.preventDefault();
            onTypeChar(e.key);
          }
        }
      },
      [state, cell, onStartEdit, onDoubleClick, onTypeChar],
    );

    return (
      <Box
        ref={cellRef}
        height="40px"
        px="8px"
        position="relative"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        tabIndex={state === 'focused' ? 0 : -1}
        data-testid={`cell-${cell.rowId}-${cell.field}`}
        {...stateStyles[state]}
      >
        <Box
          display="flex"
          alignItems="center"
          height="100%"
          width="100%"
          minWidth={0}
        >
          {children}
        </Box>
      </Box>
    );
  },
);
