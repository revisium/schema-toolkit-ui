import { observer } from 'mobx-react-lite';
import { Box, Spinner, Text } from '@chakra-ui/react';
import { useCallback, useMemo, useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import type { RowVM } from '../model/RowVM.js';
import type { CellFSM } from '../model/CellFSM.js';
import type { SelectionModel } from '../model/SelectionModel.js';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { FilterModel } from '../../Filters/model/FilterModel.js';
import type { SortModel } from '../../Sortings/model/SortModel.js';
import type { SearchForeignKeySearchFn } from '../../../search-foreign-key/index.js';
import {
  copyRangeToClipboard,
  pasteRangeFromClipboard,
  getFocusedPosition,
  clearRange,
} from '../model/clipboardOperations.js';
import { HeaderRow } from './HeaderRow.js';
import { DataRow } from './DataRow.js';
import { SelectionToolbar } from './SelectionToolbar.js';
import { DeleteConfirmDialog } from './DeleteConfirmDialog/DeleteConfirmDialog.js';
import type { CellContextActions } from './Cell/CellContextActionsContext.js';
import { CellContextActionsContext } from './Cell/CellContextActionsContext.js';
import { TableComponent } from './TableComponent.js';
import { TableRowComponent } from './TableRowComponent.js';
import { useScrollShadow } from './hooks/useScrollShadow.js';

interface DeleteConfirmState {
  rowId?: string;
  batchIds?: string[];
}

export interface TableWidgetContext {
  rows: RowVM[];
}

interface TableWidgetProps {
  rows: RowVM[];
  columnsModel: ColumnsModel;
  cellFSM?: CellFSM;
  selection: SelectionModel;
  sortModel?: SortModel;
  filterModel?: FilterModel;
  onSearchForeignKey?: SearchForeignKeySearchFn;
  onUploadFile?: (
    fileId: string,
    file: File,
  ) => Promise<Record<string, unknown> | null>;
  onOpenFile?: (url: string) => void;
  onOpenRow?: (rowId: string) => void;
  onDeleteSelected?: (ids: string[]) => void;
  onDuplicateSelected?: (ids: string[]) => void;
  onDeleteRow?: (rowId: string) => void;
  onDuplicateRow?: (rowId: string) => void;
  onCopyPath?: (path: string) => void;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
  useWindowScroll?: boolean;
}

const baseComponents = {
  Table: TableComponent,
  TableRow: TableRowComponent,
};

export const TableWidget = observer(
  ({
    rows,
    columnsModel,
    cellFSM,
    selection,
    sortModel,
    filterModel,
    onSearchForeignKey,
    onUploadFile,
    onOpenFile,
    onOpenRow,
    onDeleteSelected,
    onDuplicateSelected,
    onDeleteRow,
    onDuplicateRow,
    onCopyPath,
    onEndReached,
    isLoadingMore,
    useWindowScroll: useWindowScrollProp,
  }: TableWidgetProps) => {
    const showSelection = selection.isSelectionMode;
    const allRowIds = rows.map((r) => r.rowId);
    const [deleteConfirm, setDeleteConfirm] =
      useState<DeleteConfirmState | null>(null);

    const { state: scrollShadow, setScrollerRef } = useScrollShadow();

    const handleSelectRow = useCallback(
      (rowId: string) => {
        selection.enterSelectionMode(rowId);
      },
      [selection],
    );

    const handleDeleteRowRequest = useCallback((rowId: string) => {
      setDeleteConfirm({ rowId });
    }, []);

    const handleBatchDeleteRequest = useCallback((ids: string[]) => {
      setDeleteConfirm({ batchIds: ids });
    }, []);

    const handleDeleteConfirm = useCallback(() => {
      if (deleteConfirm?.rowId) {
        selection.deselect(deleteConfirm.rowId);
        if (onDeleteRow) {
          onDeleteRow(deleteConfirm.rowId);
        } else if (onDeleteSelected) {
          onDeleteSelected([deleteConfirm.rowId]);
        }
      } else if (deleteConfirm?.batchIds) {
        onDeleteSelected?.(deleteConfirm.batchIds);
        selection.exitSelectionMode();
      }
      setDeleteConfirm(null);
    }, [deleteConfirm, onDeleteRow, onDeleteSelected, selection]);

    const handleDeleteCancel = useCallback(() => {
      setDeleteConfirm(null);
    }, []);

    const deleteCount = deleteConfirm?.batchIds?.length;

    const canDeleteRow = Boolean(onDeleteRow || onDeleteSelected);
    const canDuplicateRow = Boolean(onDuplicateRow);
    const canSelect =
      canDeleteRow || canDuplicateRow || Boolean(onDuplicateSelected);

    const contextActions = useMemo(
      (): CellContextActions => ({
        copyRange: () => {
          const range = cellFSM?.getSelectedRange();
          const cols = columnsModel.visibleColumns;
          if (range) {
            void copyRangeToClipboard(range, rows, cols);
          }
        },
        pasteRange: () => {
          if (!cellFSM) {
            return;
          }
          const cols = columnsModel.visibleColumns;
          const range = cellFSM.getSelectedRange();
          const focusedPos = getFocusedPosition(cellFSM, cols, rows);
          if (range) {
            void pasteRangeFromClipboard(
              range.startRow,
              range.startCol,
              rows,
              cols,
            );
          } else if (focusedPos) {
            void pasteRangeFromClipboard(
              focusedPos.rowIndex,
              focusedPos.colIndex,
              rows,
              cols,
            );
          }
        },
        clearRange: () => {
          const range = cellFSM?.getSelectedRange();
          const cols = columnsModel.visibleColumns;
          if (range) {
            clearRange(range, rows, cols);
          }
        },
      }),
      [cellFSM, rows, columnsModel],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (!cellFSM) {
          return;
        }

        const isMod = e.ctrlKey || e.metaKey;
        const cols = columnsModel.visibleColumns;

        if (isMod && e.key === 'v' && cellFSM.focusedCell) {
          const range = cellFSM.getSelectedRange();
          const focusedPos = getFocusedPosition(cellFSM, cols, rows);
          if (range) {
            e.preventDefault();
            void pasteRangeFromClipboard(
              range.startRow,
              range.startCol,
              rows,
              cols,
            );
          } else if (focusedPos) {
            e.preventDefault();
            void pasteRangeFromClipboard(
              focusedPos.rowIndex,
              focusedPos.colIndex,
              rows,
              cols,
            );
          }
          return;
        }

        if (!cellFSM.hasSelection) {
          return;
        }

        if (isMod && e.key === 'c') {
          const range = cellFSM.getSelectedRange();
          if (range) {
            e.preventDefault();
            void copyRangeToClipboard(range, rows, cols);
          }
          return;
        }

        if (e.key === 'Delete' || e.key === 'Backspace') {
          const range = cellFSM.getSelectedRange();
          if (range) {
            e.preventDefault();
            clearRange(range, rows, cols);
          }
        }
      },
      [cellFSM, rows, columnsModel],
    );

    const itemContent = useCallback(
      (_index: number, row: RowVM) => (
        <DataRow
          row={row}
          columnsModel={columnsModel}
          showSelection={showSelection}
          showLeftShadow={scrollShadow.showLeftShadow}
          showRightShadow={scrollShadow.showRightShadow}
          onSearchForeignKey={onSearchForeignKey}
          onUploadFile={onUploadFile}
          onOpenFile={onOpenFile}
          onOpenRow={onOpenRow}
          onSelectRow={canSelect ? handleSelectRow : undefined}
          onDuplicateRow={canDuplicateRow ? onDuplicateRow : undefined}
          onDeleteRow={canDeleteRow ? handleDeleteRowRequest : undefined}
        />
      ),
      [
        columnsModel,
        showSelection,
        scrollShadow.showLeftShadow,
        scrollShadow.showRightShadow,
        onSearchForeignKey,
        onUploadFile,
        onOpenFile,
        onOpenRow,
        canSelect,
        canDeleteRow,
        canDuplicateRow,
        handleSelectRow,
        onDuplicateRow,
        handleDeleteRowRequest,
      ],
    );

    const fixedHeaderContent = useCallback(
      () => (
        <HeaderRow
          columnsModel={columnsModel}
          sortModel={sortModel}
          filterModel={filterModel}
          onCopyPath={onCopyPath}
          showSelection={showSelection}
          showLeftShadow={scrollShadow.showLeftShadow}
          showRightShadow={scrollShadow.showRightShadow}
        />
      ),
      [
        columnsModel,
        sortModel,
        filterModel,
        onCopyPath,
        showSelection,
        scrollShadow.showLeftShadow,
        scrollShadow.showRightShadow,
      ],
    );

    const virtuosoContext = useMemo(
      (): TableWidgetContext => ({
        rows,
      }),
      [rows],
    );

    const totalColumns =
      columnsModel.visibleColumns.length + (showSelection ? 4 : 3);

    const LoadingMoreFooter = useCallback(
      () =>
        isLoadingMore ? (
          <tfoot>
            <tr>
              <td
                colSpan={totalColumns}
                style={{ textAlign: 'center', padding: '16px 0' }}
              >
                <Spinner size="sm" color="gray.400" />
              </td>
            </tr>
          </tfoot>
        ) : null,
      [isLoadingMore, totalColumns],
    );

    const tableComponents = useMemo(
      () => ({
        ...baseComponents,
        Footer: LoadingMoreFooter,
      }),
      [LoadingMoreFooter],
    );

    if (columnsModel.visibleColumns.length === 0) {
      return (
        <Box p={4}>
          <Text fontSize="sm" color="gray.500">
            No columns to display.
          </Text>
        </Box>
      );
    }

    return (
      <CellContextActionsContext.Provider
        value={cellFSM ? contextActions : null}
      >
        <Box
          position="relative"
          height={useWindowScrollProp ? undefined : '100%'}
          data-testid="table-widget"
          onKeyDown={handleKeyDown}
        >
          {rows.length === 0 ? (
            <Box>
              <table
                style={{
                  width: 'max-content',
                  minWidth: '100%',
                  tableLayout: 'fixed',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                }}
              >
                <thead>
                  <HeaderRow
                    columnsModel={columnsModel}
                    sortModel={sortModel}
                    filterModel={filterModel}
                    onCopyPath={onCopyPath}
                    showSelection={showSelection}
                  />
                </thead>
              </table>
              <Box p={4}>
                <Text fontSize="sm" color="gray.500">
                  No rows to display.
                </Text>
              </Box>
            </Box>
          ) : (
            <TableVirtuoso
              useWindowScroll={useWindowScrollProp}
              style={useWindowScrollProp ? undefined : { height: '100%' }}
              data={rows}
              context={virtuosoContext}
              defaultItemHeight={40}
              initialItemCount={Math.min(rows.length, 20)}
              increaseViewportBy={40 * 50}
              endReached={onEndReached}
              fixedHeaderContent={fixedHeaderContent}
              itemContent={itemContent}
              components={tableComponents}
              scrollerRef={setScrollerRef}
            />
          )}
          <SelectionToolbar
            selection={selection}
            allRowIds={allRowIds}
            onDuplicate={onDuplicateSelected}
            onDelete={onDeleteSelected ? handleBatchDeleteRequest : undefined}
          />
        </Box>
        <DeleteConfirmDialog
          isOpen={deleteConfirm !== null}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          count={deleteCount}
        />
      </CellContextActionsContext.Provider>
    );
  },
);
