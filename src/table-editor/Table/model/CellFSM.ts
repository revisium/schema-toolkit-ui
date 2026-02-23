import { computed, makeAutoObservable } from 'mobx';
import { ObservableFSM } from '../../../lib/fsm/index.js';
import {
  createConfig,
  type CellAddress,
  type CellEvent,
  type CellFSMContext,
  type CellState,
  type EditTrigger,
  type SelectedRange,
  type SelectionEdges,
} from './cellFSMConfig.js';

export type {
  CellAddress,
  CellState,
  EditTrigger,
  SelectedRange,
  SelectionEdges,
} from './cellFSMConfig.js';

const READONLY_TOAST_THROTTLE_MS = 2000;

function buildIndexMap(arr: string[]): Map<string, number> {
  const map = new Map<string, number>();
  arr.forEach((value, i) => {
    map.set(value, i);
  });
  return map;
}

function selectedRangeEquals(
  a: SelectedRange | null,
  b: SelectedRange | null,
): boolean {
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return (
    a.startCol === b.startCol &&
    a.endCol === b.endCol &&
    a.startRow === b.startRow &&
    a.endRow === b.endRow
  );
}

export class CellFSM {
  private readonly _fsm: ObservableFSM<CellState, CellEvent, CellFSMContext>;
  private _onReadonlyEditAttempt: (() => void) | null = null;
  private _lastReadonlyToastAt = 0;
  private _columnIndexMap: Map<string, number> = new Map();
  private _rowIndexMap: Map<string, number> = new Map();

  constructor() {
    this._fsm = new ObservableFSM(createConfig());
    makeAutoObservable(
      this,
      {
        selectedRange: computed({ equals: selectedRangeEquals }),
      },
      { autoBind: true },
    );
  }

  setOnReadonlyEditAttempt(cb: (() => void) | null): void {
    this._onReadonlyEditAttempt = cb;
  }

  notifyReadonlyEditAttempt(): void {
    const now = Date.now();
    if (now - this._lastReadonlyToastAt < READONLY_TOAST_THROTTLE_MS) {
      return;
    }
    this._lastReadonlyToastAt = now;
    this._onReadonlyEditAttempt?.();
  }

  get state(): CellState {
    return this._fsm.state;
  }

  get focusedCell(): CellAddress | null {
    return this._fsm.context.focusedCell;
  }

  get anchorCell(): CellAddress | null {
    return this._fsm.context.anchorCell;
  }

  get editTrigger(): EditTrigger | null {
    return this._fsm.context.editTrigger;
  }

  get columns(): string[] {
    return this._fsm.context.columns;
  }

  get rowIds(): string[] {
    return this._fsm.context.rowIds;
  }

  get navigationVersion(): number {
    return this._fsm.context.navigationVersion;
  }

  get columnIndexMap(): Map<string, number> {
    return this._columnIndexMap;
  }

  get rowIndexMap(): Map<string, number> {
    return this._rowIndexMap;
  }

  get hasSelection(): boolean {
    return this.selectedRange !== null;
  }

  isCellFocused(rowId: string, field: string): boolean {
    const cell = this._fsm.context.focusedCell;
    if (!cell) {
      return false;
    }
    return cell.rowId === rowId && cell.field === field;
  }

  isCellAnchor(rowId: string, field: string): boolean {
    const cell = this._fsm.context.anchorCell;
    if (!cell) {
      return false;
    }
    return cell.rowId === rowId && cell.field === field;
  }

  isCellEditing(rowId: string, field: string): boolean {
    return this._fsm.matches('editing') && this.isCellFocused(rowId, field);
  }

  isCellInSelection(rowId: string, field: string): boolean {
    const range = this.selectedRange;
    if (!range) {
      return false;
    }
    const colIndex = this._columnIndexMap.get(field);
    const rowIndex = this._rowIndexMap.get(rowId);
    if (colIndex === undefined || rowIndex === undefined) {
      return false;
    }
    return (
      colIndex >= range.startCol &&
      colIndex <= range.endCol &&
      rowIndex >= range.startRow &&
      rowIndex <= range.endRow
    );
  }

  getCellSelectionEdges(rowId: string, field: string): SelectionEdges | null {
    const range = this.selectedRange;
    if (!range) {
      return null;
    }
    const colIndex = this._columnIndexMap.get(field);
    const rowIndex = this._rowIndexMap.get(rowId);
    if (colIndex === undefined || rowIndex === undefined) {
      return null;
    }
    if (
      colIndex < range.startCol ||
      colIndex > range.endCol ||
      rowIndex < range.startRow ||
      rowIndex > range.endRow
    ) {
      return null;
    }
    return {
      top: rowIndex === range.startRow,
      bottom: rowIndex === range.endRow,
      left: colIndex === range.startCol,
      right: colIndex === range.endCol,
    };
  }

  get selectedRange(): SelectedRange | null {
    const ctx = this._fsm.context;
    if (!ctx.anchorCell || !ctx.focusedCell) {
      return null;
    }
    if (
      ctx.anchorCell.rowId === ctx.focusedCell.rowId &&
      ctx.anchorCell.field === ctx.focusedCell.field
    ) {
      return null;
    }
    const anchorCol = this._columnIndexMap.get(ctx.anchorCell.field);
    const anchorRow = this._rowIndexMap.get(ctx.anchorCell.rowId);
    const focusCol = this._columnIndexMap.get(ctx.focusedCell.field);
    const focusRow = this._rowIndexMap.get(ctx.focusedCell.rowId);
    if (
      anchorCol === undefined ||
      anchorRow === undefined ||
      focusCol === undefined ||
      focusRow === undefined
    ) {
      return null;
    }
    return {
      startCol: Math.min(anchorCol, focusCol),
      endCol: Math.max(anchorCol, focusCol),
      startRow: Math.min(anchorRow, focusRow),
      endRow: Math.max(anchorRow, focusRow),
    };
  }

  getSelectedRange(): SelectedRange | null {
    return this.selectedRange;
  }

  setNavigationContext(columns: string[], rowIds: string[]): void {
    Object.assign(this._fsm.context, { columns, rowIds });
    this._columnIndexMap = buildIndexMap(columns);
    this._rowIndexMap = buildIndexMap(rowIds);
  }

  updateNavigationContext(columns: string[], rowIds: string[]): void {
    const ctx = this._fsm.context;
    const focused = ctx.focusedCell;

    ctx.columns = columns;
    ctx.rowIds = rowIds;
    ctx.navigationVersion++;
    this._columnIndexMap = buildIndexMap(columns);
    this._rowIndexMap = buildIndexMap(rowIds);

    if (!focused) {
      return;
    }

    const stillValid =
      this._columnIndexMap.has(focused.field) &&
      this._rowIndexMap.has(focused.rowId);

    if (stillValid) {
      ctx.anchorCell = null;
    } else {
      this.blur();
    }
  }

  focusCell(cell: CellAddress): void {
    this._fsm.context._pendingCell = cell;
    this._fsm.dispatch('FOCUS');
  }

  blur(): void {
    this._fsm.dispatch('BLUR');
  }

  doubleClick(clickOffset?: number): void {
    this._fsm.context._pendingTrigger = { type: 'doubleClick', clickOffset };
    this._fsm.dispatch('DOUBLE_CLICK');
  }

  enterEdit(): void {
    this._fsm.dispatch('ENTER');
  }

  typeChar(char: string): void {
    this._fsm.context._pendingTrigger = { type: 'char', char };
    this._fsm.dispatch('TYPE_CHAR');
  }

  commit(): void {
    this._fsm.dispatch('COMMIT');
  }

  commitAndMoveDown(): void {
    this._fsm.dispatch('COMMIT_MOVE_DOWN');
  }

  cancel(): void {
    this._fsm.dispatch('CANCEL');
  }

  moveUp(): void {
    this._fsm.dispatch('MOVE_UP');
  }

  moveDown(): void {
    this._fsm.dispatch('MOVE_DOWN');
  }

  moveLeft(): void {
    this._fsm.dispatch('MOVE_LEFT');
  }

  moveRight(): void {
    this._fsm.dispatch('MOVE_RIGHT');
  }

  handleTab(shift: boolean): void {
    this._fsm.context._pendingShift = shift;
    this._fsm.dispatch('TAB');
  }

  selectTo(cell: CellAddress): void {
    this._fsm.context._pendingCell = cell;
    this._fsm.dispatch('SELECT_TO');
  }

  shiftMoveUp(): void {
    this._fsm.dispatch('SHIFT_MOVE_UP');
  }

  shiftMoveDown(): void {
    this._fsm.dispatch('SHIFT_MOVE_DOWN');
  }

  shiftMoveLeft(): void {
    this._fsm.dispatch('SHIFT_MOVE_LEFT');
  }

  shiftMoveRight(): void {
    this._fsm.dispatch('SHIFT_MOVE_RIGHT');
  }

  dragStart(cell: CellAddress): void {
    this._fsm.context._pendingCell = cell;
    this._fsm.dispatch('DRAG_START');
  }

  dragExtend(cell: CellAddress): void {
    this._fsm.context._pendingCell = cell;
    this._fsm.dispatch('DRAG_EXTEND');
  }

  dispose(): void {
    this._fsm.dispose();
  }
}
