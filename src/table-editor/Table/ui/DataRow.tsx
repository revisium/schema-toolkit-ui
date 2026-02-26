import { observer } from 'mobx-react-lite';
import { Box } from '@chakra-ui/react';
import type { SystemStyleObject } from '@chakra-ui/react';
import type { RowVM } from '../model/RowVM.js';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { SearchForeignKeySearchFn } from '../../../search-foreign-key/index.js';
import {
  CELL_BORDER_COLOR,
  BOTTOM_BORDER_SHADOW,
  buildAddColumnShadowCss,
  adjustRightOffsetCss,
} from './borderConstants.js';
import { CellRenderer } from './Cell/CellRenderer.js';
import { RowActionOverlay } from './RowActionOverlay.js';
import { SelectionCheckboxCell } from './SelectionCheckboxCell.js';

const SELECTION_COLUMN_WIDTH = 40;
const ADD_COLUMN_BUTTON_WIDTH = 40;

interface DataRowProps {
  row: RowVM;
  columnsModel: ColumnsModel;
  showSelection: boolean;
  onSearchForeignKey?: SearchForeignKeySearchFn;
  onUploadFile?: (params: {
    rowId: string;
    fileId: string;
    file: File;
  }) => Promise<Record<string, unknown> | null>;
  onOpenFile?: (url: string) => void;
  onOpenRow?: (rowId: string) => void;
  onPickRow?: (rowId: string) => void;
  onSelectRow?: (rowId: string) => void;
  onDuplicateRow?: (rowId: string) => void;
  onDeleteRow?: (rowId: string) => void;
}

function buildShadowCss(side: 'left' | 'right'): SystemStyleObject {
  const cssVar =
    side === 'left'
      ? 'var(--shadow-left-opacity, 0)'
      : 'var(--shadow-right-opacity, 0)';
  return {
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '8px',
      pointerEvents: 'none',
      transition: 'opacity 0.15s',
      opacity: cssVar,
      ...(side === 'left'
        ? {
            right: '-8px',
            boxShadow: 'inset 8px 0 12px -8px rgba(0,0,0,0.1)',
          }
        : {
            left: '-8px',
            boxShadow: 'inset -8px 0 12px -8px rgba(0,0,0,0.1)',
          }),
    },
  };
}

function buildCellCss(
  isBoundary: boolean,
  boundarySide: 'left' | 'right',
  hasRowActions: boolean,
  isFirstColumn: boolean,
): SystemStyleObject | undefined {
  const needsHover = isFirstColumn && hasRowActions;
  const hoverCss: SystemStyleObject = needsHover
    ? {
        '& .row-action-buttons': {
          opacity: 0,
        },
        '&:hover .row-action-buttons, & .row-action-buttons[data-menu-open]': {
          opacity: 1,
          transition: 'opacity 0.15s ease',
        },
      }
    : {};

  if (isBoundary) {
    return {
      ...hoverCss,
      ...buildShadowCss(boundarySide),
    };
  }

  if (needsHover) {
    return hoverCss;
  }

  return undefined;
}

interface StickyColumnProps {
  isSticky: boolean;
  isBoundary: boolean;
  boundarySide: 'left' | 'right';
  leftCss?: string;
  rightCss?: string;
  colWidth?: string;
}

function computeStickyProps(
  col: { field: string },
  columnsModel: ColumnsModel,
  selectionWidth: number,
  addColOffset: number,
): StickyColumnProps {
  const leftCss = columnsModel.getColumnStickyLeftCss(
    col.field,
    selectionWidth,
  );
  const rightCss = columnsModel.getColumnStickyRightCss(col.field);
  const isStickyLeft = leftCss !== undefined;
  const isStickyRight = rightCss !== undefined;
  const isSticky = isStickyLeft || isStickyRight;
  const isLeftBoundary = columnsModel.isStickyLeftBoundary(col.field);
  const isRightBoundary = columnsModel.isStickyRightBoundary(col.field);

  const finalRightCss =
    isStickyRight && rightCss !== undefined
      ? adjustRightOffsetCss(rightCss, addColOffset)
      : rightCss;

  return {
    isSticky,
    isBoundary: isLeftBoundary || isRightBoundary,
    boundarySide: isStickyLeft ? 'left' : 'right',
    leftCss: isStickyLeft ? leftCss : undefined,
    rightCss: isStickyRight ? finalRightCss : undefined,
    colWidth: isSticky ? columnsModel.columnWidthCssVar(col.field) : undefined,
  };
}

function getCellBoxShadow(isSticky: boolean, side: 'left' | 'right'): string {
  if (!isSticky) {
    return BOTTOM_BORDER_SHADOW;
  }
  const stickyBorder =
    side === 'left'
      ? `inset -1px 0 0 0 ${CELL_BORDER_COLOR}`
      : `inset 1px 0 0 0 ${CELL_BORDER_COLOR}`;
  return `${BOTTOM_BORDER_SHADOW}, ${stickyBorder}`;
}

export const DataRow = observer(
  ({
    row,
    columnsModel,
    showSelection,
    onSearchForeignKey,
    onUploadFile,
    onOpenFile,
    onOpenRow,
    onPickRow,
    onSelectRow,
    onDuplicateRow,
    onDeleteRow,
  }: DataRowProps) => {
    const hasRowActions = Boolean(
      onOpenRow || onPickRow || onSelectRow || onDuplicateRow || onDeleteRow,
    );

    const selectionWidth = showSelection ? SELECTION_COLUMN_WIDTH : 0;
    const addColumnStickyRight = columnsModel.hasHiddenColumns;
    const addColOffset = addColumnStickyRight ? ADD_COLUMN_BUTTON_WIDTH : 0;

    return (
      <>
        {showSelection && (
          <SelectionCheckboxCell
            rowId={row.rowId}
            isSelected={row.isSelected}
            onToggleSelection={() => row.toggleSelection()}
          />
        )}
        {columnsModel.visibleColumns.map((col, index) => {
          const cellVM = row.getCellVM(col);
          const isFirstColumn = index === 0;
          const showOverlay =
            isFirstColumn && hasRowActions && !cellVM.isEditing;

          const sticky = computeStickyProps(
            col,
            columnsModel,
            selectionWidth,
            addColOffset,
          );

          return (
            <Box
              as="td"
              key={col.field}
              width={sticky.colWidth}
              minWidth={sticky.colWidth}
              maxWidth={sticky.isSticky ? sticky.colWidth : '0'}
              overflow={sticky.isBoundary ? 'visible' : 'hidden'}
              borderRight={sticky.isSticky ? undefined : '1px solid'}
              borderColor={sticky.isSticky ? undefined : CELL_BORDER_COLOR}
              p={0}
              position={sticky.isSticky ? 'sticky' : 'relative'}
              left={sticky.leftCss}
              right={sticky.rightCss}
              zIndex={sticky.isSticky ? 1 : undefined}
              bg={sticky.isSticky ? 'white' : undefined}
              boxShadow={getCellBoxShadow(sticky.isSticky, sticky.boundarySide)}
              css={buildCellCss(
                sticky.isBoundary,
                sticky.boundarySide,
                hasRowActions,
                isFirstColumn,
              )}
            >
              {sticky.isBoundary ? (
                <Box overflow="hidden">
                  <CellRenderer
                    cell={cellVM}
                    onSearchForeignKey={onSearchForeignKey}
                    onUploadFile={onUploadFile}
                    onOpenFile={onOpenFile}
                  />
                </Box>
              ) : (
                <CellRenderer
                  cell={cellVM}
                  onSearchForeignKey={onSearchForeignKey}
                  onUploadFile={onUploadFile}
                  onOpenFile={onOpenFile}
                />
              )}
              {showOverlay && (
                <RowActionOverlay
                  rowId={row.rowId}
                  onOpen={onOpenRow}
                  onPick={onPickRow}
                  onSelect={onSelectRow}
                  onDuplicate={onDuplicateRow}
                  onDelete={onDeleteRow}
                />
              )}
            </Box>
          );
        })}
        {addColumnStickyRight ? (
          <Box
            as="td"
            width="100%"
            minWidth={`${ADD_COLUMN_BUTTON_WIDTH}px`}
            p={0}
            position="sticky"
            right={0}
            zIndex={1}
            bg="white"
            boxShadow={BOTTOM_BORDER_SHADOW}
            css={
              columnsModel.pinnedRightCount === 0
                ? buildAddColumnShadowCss()
                : undefined
            }
          />
        ) : (
          <Box as="td" width="100%" p={0} boxShadow={BOTTOM_BORDER_SHADOW} />
        )}
      </>
    );
  },
);
