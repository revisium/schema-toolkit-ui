import { makeAutoObservable } from 'mobx';

export interface CellAddress {
  rowId: string;
  field: string;
}

export class InlineEditModel {
  private _focusedCell: CellAddress | null = null;
  private _isEditing = false;
  private _columns: string[] = [];
  private _rowIds: string[] = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get focusedCell(): CellAddress | null {
    return this._focusedCell;
  }

  get isEditing(): boolean {
    return this._isEditing;
  }

  setNavigationContext(columns: string[], rowIds: string[]): void {
    this._columns = columns;
    this._rowIds = rowIds;
  }

  focusCell(cell: CellAddress): void {
    this._focusedCell = cell;
    this._isEditing = false;
  }

  blur(): void {
    this._focusedCell = null;
    this._isEditing = false;
  }

  startEdit(): void {
    if (!this._focusedCell) {
      return;
    }
    this._isEditing = true;
  }

  commitEdit(): void {
    this._isEditing = false;
  }

  cancelEdit(): void {
    this._isEditing = false;
  }

  moveUp(): void {
    this._moveTo(0, -1);
  }

  moveDown(): void {
    this._moveTo(0, 1);
  }

  moveLeft(): void {
    this._moveTo(-1, 0);
  }

  moveRight(): void {
    this._moveTo(1, 0);
  }

  handleTab(shift: boolean): void {
    const delta = shift ? -1 : 1;
    const next = this._resolveTabTarget(delta);
    if (next) {
      this._focusedCell = next;
      this._isEditing = false;
    }
  }

  private _moveTo(colDelta: number, rowDelta: number): void {
    const position = this._currentPosition();
    if (!position) {
      return;
    }

    const next = this._cellAt(
      position.colIndex + colDelta,
      position.rowIndex + rowDelta,
    );
    if (next) {
      this._focusedCell = next;
      this._isEditing = false;
    }
  }

  private _resolveTabTarget(delta: number): CellAddress | null {
    const position = this._currentPosition();
    if (!position) {
      return null;
    }

    const nextCol = position.colIndex + delta;
    const sameRow = this._cellAt(nextCol, position.rowIndex);
    if (sameRow) {
      return sameRow;
    }

    const wrapCol = delta > 0 ? 0 : this._columns.length - 1;
    return this._cellAt(wrapCol, position.rowIndex + delta);
  }

  private _currentPosition(): {
    colIndex: number;
    rowIndex: number;
  } | null {
    if (!this._focusedCell) {
      return null;
    }

    const colIndex = this._columns.indexOf(this._focusedCell.field);
    const rowIndex = this._rowIds.indexOf(this._focusedCell.rowId);

    if (colIndex === -1 || rowIndex === -1) {
      return null;
    }

    return { colIndex, rowIndex };
  }

  private _cellAt(colIndex: number, rowIndex: number): CellAddress | null {
    const field = this._columns[colIndex];
    const rowId = this._rowIds[rowIndex];

    if (field === undefined || rowId === undefined) {
      return null;
    }

    return { rowId, field };
  }
}
