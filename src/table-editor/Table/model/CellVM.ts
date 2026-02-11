import { makeAutoObservable } from 'mobx';
import type { RowModel } from '@revisium/schema-toolkit';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type { CellFSM, EditTrigger, SelectionEdges } from './CellFSM.js';

export class CellVM {
  private readonly _rowModel: RowModel;
  private readonly _column: ColumnSpec;
  private readonly _rowId: string;
  private readonly _cellFSM: CellFSM;

  constructor(
    rowModel: RowModel,
    column: ColumnSpec,
    rowId: string,
    cellFSM: CellFSM,
  ) {
    this._rowModel = rowModel;
    this._column = column;
    this._rowId = rowId;
    this._cellFSM = cellFSM;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get field(): string {
    return this._column.field;
  }

  get jsonPath(): string {
    return `${this._rowId}/${this._column.field}`;
  }

  get column(): ColumnSpec {
    return this._column;
  }

  get rowId(): string {
    return this._rowId;
  }

  get value(): unknown {
    const node = this._getNode();
    if (!node) {
      return undefined;
    }
    return node.getPlainValue();
  }

  get displayValue(): string {
    const val = this.value;
    if (val === null || val === undefined) {
      return '';
    }
    if (typeof val === 'boolean') {
      return String(val);
    }
    if (typeof val === 'number') {
      return String(val);
    }
    if (typeof val === 'string') {
      return val;
    }
    if (Array.isArray(val)) {
      return `[${val.length}]`;
    }
    if (typeof val === 'object') {
      return '{...}';
    }
    return '';
  }

  get isReadOnly(): boolean {
    const node = this._getNode();
    if (!node) {
      return true;
    }
    if (node.isPrimitive()) {
      return node.isReadOnly;
    }
    return true;
  }

  get foreignKeyTableId(): string | undefined {
    return this._column.foreignKeyTableId;
  }

  get isEditable(): boolean {
    if (this.isReadOnly) {
      return false;
    }
    const node = this._getNode();
    if (!node) {
      return false;
    }
    return node.isPrimitive();
  }

  get isFocused(): boolean {
    return this._cellFSM.isCellFocused(this._rowId, this._column.field);
  }

  get isEditing(): boolean {
    return this._cellFSM.isCellEditing(this._rowId, this._column.field);
  }

  get isAnchor(): boolean {
    return this._cellFSM.isCellAnchor(this._rowId, this._column.field);
  }

  get isInSelection(): boolean {
    return this._cellFSM.isCellInSelection(this._rowId, this._column.field);
  }

  get selectionEdges(): SelectionEdges | null {
    return this._cellFSM.getCellSelectionEdges(this._rowId, this._column.field);
  }

  get hasRangeSelection(): boolean {
    return this._cellFSM.hasSelection;
  }

  get editTrigger(): EditTrigger | null {
    if (!this.isEditing) {
      return null;
    }
    return this._cellFSM.editTrigger;
  }

  focus(): void {
    this._cellFSM.focusCell({
      rowId: this._rowId,
      field: this._column.field,
    });
  }

  startEdit(): void {
    if (!this.isEditable) {
      return;
    }
    this.focus();
    this._cellFSM.enterEdit();
  }

  startEditWithChar(char: string): void {
    if (!this.isEditable) {
      return;
    }
    this.focus();
    this._cellFSM.typeChar(char);
  }

  startEditWithDoubleClick(clickOffset?: number): void {
    if (!this.isEditable) {
      return;
    }
    this.focus();
    this._cellFSM.doubleClick(clickOffset);
  }

  commitEdit(newValue: unknown): void {
    const node = this._getNode();
    if (node?.isPrimitive()) {
      node.setValue(newValue);
    }
    this._cellFSM.commit();
  }

  commitEditAndMoveDown(newValue?: unknown): void {
    if (newValue !== undefined) {
      const node = this._getNode();
      if (node?.isPrimitive()) {
        node.setValue(newValue);
      }
    }
    this._cellFSM.commitAndMoveDown();
  }

  cancelEdit(): void {
    this._cellFSM.cancel();
  }

  clearToDefault(): void {
    const node = this._getNode();
    if (!node || !node.isPrimitive() || node.isReadOnly) {
      return;
    }
    node.setValue(node.defaultValue);
  }

  async copyToClipboard(): Promise<void> {
    await navigator.clipboard.writeText(this.displayValue);
  }

  async pasteFromClipboard(): Promise<void> {
    if (!this.isEditable) {
      return;
    }
    const text = await navigator.clipboard.readText();
    this.applyPastedText(text);
  }

  applyPastedText(text: string): void {
    const node = this._getNode();
    if (!node?.isPrimitive()) {
      return;
    }
    const nodeType = typeof node.getPlainValue();
    if (nodeType === 'string') {
      this._applyPastedString(node, text);
    } else if (nodeType === 'number') {
      this._applyPastedNumber(node, text);
    } else if (nodeType === 'boolean') {
      this._applyPastedBoolean(node, text);
    }
  }

  private _applyPastedString(
    node: ReturnType<RowModel['get']> & { setValue(v: unknown): void },
    text: string,
  ): void {
    let trimmed = text;
    while (trimmed.endsWith('\n')) {
      trimmed = trimmed.slice(0, -1);
    }
    if (trimmed !== this.displayValue) {
      node.setValue(trimmed);
    }
  }

  private _applyPastedNumber(
    node: ReturnType<RowModel['get']> & { setValue(v: unknown): void },
    text: string,
  ): void {
    const parsed = Number(text);
    if (!Number.isNaN(parsed) && String(parsed) !== this.displayValue) {
      node.setValue(parsed);
    }
  }

  private _applyPastedBoolean(
    node: ReturnType<RowModel['get']> & { setValue(v: unknown): void },
    text: string,
  ): void {
    const lower = text.trim().toLowerCase();
    if (lower === 'true' || lower === 'false') {
      const value = lower === 'true';
      if (String(value) !== this.displayValue) {
        node.setValue(value);
      }
    }
  }

  blur(): void {
    this._cellFSM.blur();
  }

  moveUp(): void {
    this._cellFSM.moveUp();
  }

  moveDown(): void {
    this._cellFSM.moveDown();
  }

  moveLeft(): void {
    this._cellFSM.moveLeft();
  }

  moveRight(): void {
    this._cellFSM.moveRight();
  }

  handleTab(shift: boolean): void {
    this._cellFSM.handleTab(shift);
  }

  selectTo(): void {
    this._cellFSM.selectTo({ rowId: this._rowId, field: this._column.field });
  }

  shiftMoveUp(): void {
    this._cellFSM.shiftMoveUp();
  }

  shiftMoveDown(): void {
    this._cellFSM.shiftMoveDown();
  }

  shiftMoveLeft(): void {
    this._cellFSM.shiftMoveLeft();
  }

  shiftMoveRight(): void {
    this._cellFSM.shiftMoveRight();
  }

  dragStart(): void {
    this._cellFSM.dragStart({ rowId: this._rowId, field: this._column.field });
  }

  dragExtend(): void {
    this._cellFSM.dragExtend({ rowId: this._rowId, field: this._column.field });
  }

  private _getNode() {
    return this._rowModel.get(this._column.field);
  }
}
