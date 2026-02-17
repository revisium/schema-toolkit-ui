import type { ColumnSpec } from '../../Columns/model/types.js';
import type { CellFSM, SelectedRange } from './CellFSM.js';
import type { RowVM } from './RowVM.js';
import { parseTSV } from './parseTSV.js';

function quoteTSVCell(value: string): string {
  if (value.includes('\t') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function copyRangeToClipboard(
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
        cells.push(quoteTSVCell(row.getCellVM(col).displayValue));
      }
    }
    lines.push(cells.join('\t'));
  }
  try {
    return navigator.clipboard.writeText(lines.join('\n'));
  } catch {
    return Promise.resolve();
  }
}

export async function pasteRangeFromClipboard(
  focusedRowIndex: number,
  focusedColIndex: number,
  rows: RowVM[],
  cols: ColumnSpec[],
): Promise<void> {
  let text: string;
  try {
    text = await navigator.clipboard.readText();
  } catch {
    return;
  }
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
}

export function getFocusedPosition(
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

export function clearRange(
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
