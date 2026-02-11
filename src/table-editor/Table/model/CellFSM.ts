import { ObservableFSM } from '../../../lib/fsm/index.js';
import {
  cellPosition,
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

export class CellFSM {
  private readonly _fsm: ObservableFSM<CellState, CellEvent, CellFSMContext>;

  constructor() {
    this._fsm = new ObservableFSM(createConfig());
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

  get hasSelection(): boolean {
    return this.getSelectedRange() !== null;
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
    const range = this.getSelectedRange();
    if (!range) {
      return false;
    }
    const ctx = this._fsm.context;
    const colIndex = ctx.columns.indexOf(field);
    const rowIndex = ctx.rowIds.indexOf(rowId);
    if (colIndex === -1 || rowIndex === -1) {
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
    const range = this.getSelectedRange();
    if (!range) {
      return null;
    }
    const ctx = this._fsm.context;
    const colIndex = ctx.columns.indexOf(field);
    const rowIndex = ctx.rowIds.indexOf(rowId);
    if (colIndex === -1 || rowIndex === -1) {
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

  getSelectedRange(): SelectedRange | null {
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
    const anchorPos = cellPosition(ctx, ctx.anchorCell);
    const focusPos = cellPosition(ctx, ctx.focusedCell);
    if (!anchorPos || !focusPos) {
      return null;
    }
    return {
      startCol: Math.min(anchorPos.colIndex, focusPos.colIndex),
      endCol: Math.max(anchorPos.colIndex, focusPos.colIndex),
      startRow: Math.min(anchorPos.rowIndex, focusPos.rowIndex),
      endRow: Math.max(anchorPos.rowIndex, focusPos.rowIndex),
    };
  }

  setNavigationContext(columns: string[], rowIds: string[]): void {
    Object.assign(this._fsm.context, { columns, rowIds });
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
