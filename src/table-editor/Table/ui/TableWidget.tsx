import { observer } from 'mobx-react-lite';
import { Box, Text } from '@chakra-ui/react';
import { useCallback, useMemo } from 'react';
import type { RowVM } from '../model/RowVM.js';
import type { CellFSM, SelectedRange } from '../model/CellFSM.js';
import type { SelectionModel } from '../model/SelectionModel.js';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type { FilterModel } from '../../Filters/model/FilterModel.js';
import type { SortModel } from '../../Sortings/model/SortModel.js';
import type { SearchForeignKeySearchFn } from '../../../search-foreign-key/index.js';
import { parseTSV } from '../model/parseTSV.js';
import { HeaderRow } from './HeaderRow.js';
import { DataRow } from './DataRow.js';
import { SelectionToolbar } from './SelectionToolbar.js';
import type { CellContextActions } from './Cell/CellContextActionsContext.js';
import { CellContextActionsContext } from './Cell/CellContextActionsContext.js';

function copyRangeToClipboard(
  range: SelectedRange,
  rows: RowVM[],
  cols: ColumnSpec[],
): Promise<void> {
  const lines: string[] = [];
  for (let r = range.startRow; r <= range.endRow; r++) {
    const cells: string[] = [];
    for (let c = range.startCol; c <= range.endCol; c++) {
      const row = rows[r];
      const col = cols[c];
      if (row && col) {
        cells.push(row.getCellVM(col).displayValue);
      }
    }
    lines.push(cells.join('\t'));
  }
  return navigator.clipboard.writeText(lines.join('\n'));
}

function pasteRangeFromClipboard(
  focusedRowIndex: number,
  focusedColIndex: number,
  rows: RowVM[],
  cols: ColumnSpec[],
): Promise<void> {
  return navigator.clipboard.readText().then((text) => {
    const grid = parseTSV(text);
    for (const [r, gridRow] of grid.entries()) {
      const rowIndex = focusedRowIndex + r;
      const row = rows[rowIndex];
      if (!row) {
        break;
      }
      for (const [c, cellText] of gridRow.entries()) {
        const colIndex = focusedColIndex + c;
        const col = cols[colIndex];
        if (!col) {
          break;
        }
        const cellVM = row.getCellVM(col);
        if (cellVM.isEditable) {
          cellVM.applyPastedText(cellText);
        }
      }
    }
  });
}

function getFocusedPosition(
  fsm: CellFSM,
  cols: ColumnSpec[],
  rows: RowVM[],
): { colIndex: number; rowIndex: number } | null {
  const focused = fsm.focusedCell;
  if (!focused) {
    return null;
  }
  const colIndex = cols.findIndex((c) => c.field === focused.field);
  const rowIndex = rows.findIndex((r) => r.rowId === focused.rowId);
  if (colIndex === -1 || rowIndex === -1) {
    return null;
  }
  return { colIndex, rowIndex };
}

function clearRange(
  range: SelectedRange,
  rows: RowVM[],
  cols: ColumnSpec[],
): void {
  for (let r = range.startRow; r <= range.endRow; r++) {
    for (let c = range.startCol; c <= range.endCol; c++) {
      const row = rows[r];
      const col = cols[c];
      if (row && col) {
        row.getCellVM(col).clearToDefault();
      }
    }
  }
}

interface TableWidgetProps {
  rows: RowVM[];
  columnsModel: ColumnsModel;
  cellFSM?: CellFSM;
  selection: SelectionModel;
  sortModel?: SortModel;
  filterModel?: FilterModel;
  onSearchForeignKey?: SearchForeignKeySearchFn;
  onDeleteSelected?: (ids: string[]) => void;
  onCopyPath?: (path: string) => void;
}

export const TableWidget = observer(
  ({
    rows,
    columnsModel,
    cellFSM,
    selection,
    sortModel,
    filterModel,
    onSearchForeignKey,
    onDeleteSelected,
    onCopyPath,
  }: TableWidgetProps) => {
    const showSelection = selection.isSelectionMode;
    const allRowIds = rows.map((r) => r.rowId);

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
          overflow="auto"
          height="100%"
          data-testid="table-widget"
          onKeyDown={handleKeyDown}
        >
          <Box minWidth="fit-content">
            <HeaderRow
              columnsModel={columnsModel}
              sortModel={sortModel}
              filterModel={filterModel}
              onCopyPath={onCopyPath}
            />
            {rows.length === 0 ? (
              <Box p={4}>
                <Text fontSize="sm" color="gray.500">
                  No rows to display.
                </Text>
              </Box>
            ) : (
              rows.map((row) => (
                <DataRow
                  key={row.rowId}
                  row={row}
                  columnsModel={columnsModel}
                  showSelection={showSelection}
                  onSearchForeignKey={onSearchForeignKey}
                />
              ))
            )}
          </Box>
          <SelectionToolbar
            selection={selection}
            allRowIds={allRowIds}
            onDelete={onDeleteSelected}
          />
        </Box>
      </CellContextActionsContext.Provider>
    );
  },
);
