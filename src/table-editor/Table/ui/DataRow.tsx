import { observer } from 'mobx-react-lite';
import { Box } from '@chakra-ui/react';
import type { SystemStyleObject } from '@chakra-ui/react';
import type { RowVM } from '../model/RowVM.js';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { SearchForeignKeySearchFn } from '../../../search-foreign-key/index.js';
import type { ScrollShadowModel } from './hooks/useScrollShadow.js';
import { CellRenderer } from './Cell/CellRenderer.js';
import { RowActionOverlay } from './RowActionOverlay.js';
import { SelectionCheckboxCell } from './SelectionCheckboxCell.js';

const SELECTION_COLUMN_WIDTH = 40;
const ADD_COLUMN_BUTTON_WIDTH = 40;

interface DataRowProps {
  row: RowVM;
  columnsModel: ColumnsModel;
  showSelection: boolean;
  scrollShadow?: ScrollShadowModel;
  onSearchForeignKey?: SearchForeignKeySearchFn;
  onUploadFile?: (params: {
    rowId: string;
    fileId: string;
    file: File;
  }) => Promise<Record<string, unknown> | null>;
  onOpenFile?: (url: string) => void;
  onOpenRow?: (rowId: string) => void;
  onSelectRow?: (rowId: string) => void;
  onDuplicateRow?: (rowId: string) => void;
  onDeleteRow?: (rowId: string) => void;
}

function buildShadowCss(
  side: 'left' | 'right',
  showShadow: boolean,
): SystemStyleObject {
  return {
    '&::after': {
      content: '""',
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: '8px',
      pointerEvents: 'none',
      transition: 'opacity 0.15s',
      opacity: showShadow ? 1 : 0,
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
  showShadow: boolean,
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
      ...buildShadowCss(boundarySide, showShadow),
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
  showShadow: boolean;
  leftOffset?: number;
  rightOffset?: number;
  colWidth?: string;
}

function computeStickyProps(
  col: { field: string },
  columnsModel: ColumnsModel,
  selectionWidth: number,
  addColOffset: number,
  showLeftShadow: boolean | undefined,
  showRightShadow: boolean | undefined,
): StickyColumnProps {
  const leftOffset = columnsModel.getColumnStickyLeft(
    col.field,
    selectionWidth,
  );
  const rightBase = columnsModel.getColumnStickyRight(col.field);
  const isStickyLeft = leftOffset !== undefined;
  const isStickyRight = rightBase !== undefined;
  const isSticky = isStickyLeft || isStickyRight;
  const isLeftBoundary = columnsModel.isStickyLeftBoundary(col.field);
  const isRightBoundary = columnsModel.isStickyRightBoundary(col.field);

  return {
    isSticky,
    isBoundary: isLeftBoundary || isRightBoundary,
    boundarySide: isStickyLeft ? 'left' : 'right',
    showShadow:
      (isLeftBoundary && Boolean(showLeftShadow)) ||
      (isRightBoundary && Boolean(showRightShadow)),
    leftOffset: isStickyLeft ? leftOffset : undefined,
    rightOffset: isStickyRight ? rightBase + addColOffset : undefined,
    colWidth: isSticky
      ? `${columnsModel.resolveColumnWidth(col.field)}px`
      : undefined,
  };
}

const BOTTOM_BORDER_SHADOW = 'inset 0 -1px 0 0 var(--chakra-colors-gray-100)';

function getCellBoxShadow(isSticky: boolean, side: 'left' | 'right'): string {
  if (!isSticky) {
    return BOTTOM_BORDER_SHADOW;
  }
  const stickyBorder =
    side === 'left'
      ? 'inset -1px 0 0 0 var(--chakra-colors-gray-100)'
      : 'inset 1px 0 0 0 var(--chakra-colors-gray-100)';
  return `${BOTTOM_BORDER_SHADOW}, ${stickyBorder}`;
}

export const DataRow = observer(
  ({
    row,
    columnsModel,
    showSelection,
    scrollShadow,
    onSearchForeignKey,
    onUploadFile,
    onOpenFile,
    onOpenRow,
    onSelectRow,
    onDuplicateRow,
    onDeleteRow,
  }: DataRowProps) => {
    const hasRowActions = Boolean(
      onOpenRow || onSelectRow || onDuplicateRow || onDeleteRow,
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
            scrollShadow?.showLeftShadow,
            scrollShadow?.showRightShadow,
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
              borderColor={sticky.isSticky ? undefined : 'gray.100'}
              p={0}
              position={sticky.isSticky ? 'sticky' : 'relative'}
              left={
                sticky.leftOffset !== undefined
                  ? `${sticky.leftOffset}px`
                  : undefined
              }
              right={
                sticky.rightOffset !== undefined
                  ? `${sticky.rightOffset}px`
                  : undefined
              }
              zIndex={sticky.isSticky ? 1 : undefined}
              bg={sticky.isSticky ? 'white' : undefined}
              boxShadow={getCellBoxShadow(sticky.isSticky, sticky.boundarySide)}
              css={buildCellCss(
                sticky.isBoundary,
                sticky.boundarySide,
                sticky.showShadow,
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
                  onSelect={onSelectRow}
                  onDuplicate={onDuplicateRow}
                  onDelete={onDeleteRow}
                />
              )}
            </Box>
          );
        })}
        <Box as="td" width="100%" p={0} boxShadow={BOTTOM_BORDER_SHADOW} />
        {addColumnStickyRight && (
          <Box
            as="td"
            width={`${ADD_COLUMN_BUTTON_WIDTH}px`}
            minWidth={`${ADD_COLUMN_BUTTON_WIDTH}px`}
            maxWidth={`${ADD_COLUMN_BUTTON_WIDTH}px`}
            p={0}
            position="sticky"
            right={0}
            zIndex={1}
            bg="white"
            boxShadow={`${BOTTOM_BORDER_SHADOW}, inset 1px 0 0 0 var(--chakra-colors-gray-100)`}
          />
        )}
      </>
    );
  },
);
