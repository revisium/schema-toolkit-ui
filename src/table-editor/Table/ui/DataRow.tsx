import { observer } from 'mobx-react-lite';
import { Box } from '@chakra-ui/react';
import type { SystemStyleObject } from '@chakra-ui/react';
import type { RowVM } from '../model/RowVM.js';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { SearchForeignKeySearchFn } from '../../../search-foreign-key/index.js';
import { CellRenderer } from './Cell/CellRenderer.js';
import { RowActionOverlay } from './RowActionOverlay.js';
import { SelectionCheckboxCell } from './SelectionCheckboxCell.js';

const SELECTION_COLUMN_WIDTH = 40;
const ADD_COLUMN_BUTTON_WIDTH = 40;

interface DataRowProps {
  row: RowVM;
  columnsModel: ColumnsModel;
  showSelection: boolean;
  showLeftShadow?: boolean;
  showRightShadow?: boolean;
  onSearchForeignKey?: SearchForeignKeySearchFn;
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
        '&:hover .row-action-buttons': {
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

export const DataRow = observer(
  ({
    row,
    columnsModel,
    showSelection,
    showLeftShadow,
    showRightShadow,
    onSearchForeignKey,
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
          const isBoundary = isLeftBoundary || isRightBoundary;
          const showShadow =
            (isLeftBoundary && Boolean(showLeftShadow)) ||
            (isRightBoundary && Boolean(showRightShadow));
          const boundarySide = isStickyLeft ? 'left' : 'right';

          const rightValue =
            isStickyRight && rightBase !== undefined
              ? rightBase + addColOffset
              : undefined;

          const colWidth = isSticky
            ? `${columnsModel.resolveColumnWidth(col.field)}px`
            : undefined;

          const stickyBorder = isStickyLeft
            ? 'inset -1px 0 0 0 var(--chakra-colors-gray-100)'
            : 'inset 1px 0 0 0 var(--chakra-colors-gray-100)';

          return (
            <Box
              as="td"
              key={col.field}
              width={colWidth}
              minWidth={colWidth}
              maxWidth={isSticky ? colWidth : '0'}
              overflow={isBoundary ? 'visible' : 'hidden'}
              borderRight={isSticky ? undefined : '1px solid'}
              borderColor={isSticky ? undefined : 'gray.100'}
              p={0}
              position={isSticky ? 'sticky' : 'relative'}
              left={isStickyLeft ? `${leftOffset}px` : undefined}
              right={rightValue !== undefined ? `${rightValue}px` : undefined}
              zIndex={isSticky ? 1 : undefined}
              bg={isSticky ? 'white' : undefined}
              boxShadow={isSticky ? stickyBorder : undefined}
              css={buildCellCss(
                isBoundary,
                boundarySide,
                showShadow,
                hasRowActions,
                isFirstColumn,
              )}
            >
              {isBoundary ? (
                <Box overflow="hidden">
                  <CellRenderer
                    cell={cellVM}
                    onSearchForeignKey={onSearchForeignKey}
                  />
                </Box>
              ) : (
                <CellRenderer
                  cell={cellVM}
                  onSearchForeignKey={onSearchForeignKey}
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
        <Box as="td" width="100%" p={0} />
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
            boxShadow="inset 1px 0 0 0 var(--chakra-colors-gray-100)"
          />
        )}
      </>
    );
  },
);
