import { makeAutoObservable } from 'mobx';
import type { RowModel } from '@revisium/schema-toolkit';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { FilterFieldType } from '../../shared/field-types.js';
import type { CellFSM, EditTrigger, SelectionEdges } from './CellFSM.js';

export type CellCommitCallback = (
  rowId: string,
  field: string,
  value: unknown,
  previousValue?: unknown,
) => void;

export class CellVM {
  private readonly _rowModel: RowModel;
  private readonly _column: ColumnSpec;
  private readonly _rowId: string;
  private readonly _cellFSM: CellFSM;
  private readonly _onCommit: CellCommitCallback | null;
  private readonly _systemValues: Record<string, unknown> | null;

  constructor(
    rowModel: RowModel,
    column: ColumnSpec,
    rowId: string,
    cellFSM: CellFSM,
    onCommit?: CellCommitCallback,
    systemValues?: Record<string, unknown>,
  ) {
    this._rowModel = rowModel;
    this._column = column;
    this._rowId = rowId;
    this._cellFSM = cellFSM;
    this._onCommit = onCommit ?? null;
    this._systemValues = systemValues ?? null;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // --- Data Getters ---

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
    if (this._systemValues) {
      return this._systemValues[this._column.field];
    }
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
      const obj = val as Record<string, unknown>;
      if (typeof obj.fileName === 'string' && obj.fileName) {
        return obj.fileName;
      }
      return '{...}';
    }
    return '';
  }

  get isReadOnly(): boolean {
    if (this._systemValues) {
      return true;
    }
    if (this._column.fieldType === FilterFieldType.File) {
      const fileNameNode = this._getFileNameNode();
      if (!fileNameNode || !fileNameNode.isPrimitive()) {
        return true;
      }
      return fileNameNode.isReadOnly;
    }
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

  get fileData(): {
    status: string;
    fileId: string;
    url: string;
    fileName: string;
    mimeType: string;
    width: number;
    height: number;
  } | null {
    if (this._column.fieldType !== FilterFieldType.File) {
      return null;
    }
    const val = this.value;
    if (!val || typeof val !== 'object' || Array.isArray(val)) {
      return null;
    }
    const obj = val as Record<string, unknown>;
    return {
      status: (obj.status as string) ?? '',
      fileId: (obj.fileId as string) ?? '',
      url: (obj.url as string) ?? '',
      fileName: (obj.fileName as string) ?? '',
      mimeType: (obj.mimeType as string) ?? '',
      width: (obj.width as number) ?? 0,
      height: (obj.height as number) ?? 0,
    };
  }

  get isEditable(): boolean {
    if (this._systemValues) {
      return false;
    }
    if (this.isReadOnly) {
      return false;
    }
    if (this._column.fieldType === FilterFieldType.File) {
      return this._getFileNameNode() !== undefined;
    }
    const node = this._getNode();
    if (!node) {
      return false;
    }
    return node.isPrimitive();
  }

  // --- FSM State ---

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

  get navigationVersion(): number {
    return this._cellFSM.navigationVersion;
  }

  get editTrigger(): EditTrigger | null {
    if (!this.isEditing) {
      return null;
    }
    return this._cellFSM.editTrigger;
  }

  // --- Edit Lifecycle ---

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
    if (this._column.fieldType === FilterFieldType.File) {
      this._commitFileNameEdit(newValue as string);
      this._cellFSM.commit();
      return;
    }
    const node = this._getNode();
    const previousValue = node?.getPlainValue();
    if (node?.isPrimitive()) {
      node.setValue(newValue);
    }
    this._cellFSM.commit();
    this._onCommit?.(this._rowId, this._column.field, newValue, previousValue);
  }

  commitEditAndMoveDown(newValue?: unknown): void {
    if (
      this._column.fieldType === FilterFieldType.File &&
      newValue !== undefined
    ) {
      this._commitFileNameEdit(newValue as string);
      this._cellFSM.commitAndMoveDown();
      return;
    }
    let previousValue: unknown;
    if (newValue !== undefined) {
      const node = this._getNode();
      previousValue = node?.getPlainValue();
      if (node?.isPrimitive()) {
        node.setValue(newValue);
      }
    }
    this._cellFSM.commitAndMoveDown();
    if (newValue !== undefined) {
      this._onCommit?.(
        this._rowId,
        this._column.field,
        newValue,
        previousValue,
      );
    }
  }

  cancelEdit(): void {
    this._cellFSM.cancel();
  }

  commitFileUpload(result: Record<string, unknown>): void {
    const node = this._getNode();
    if (!node || !node.isObject()) {
      return;
    }
    const previousValue = node.getPlainValue();
    node.setValue(result, { internal: true });
    this._onCommit?.(this._rowId, this._column.field, result, previousValue);
  }

  // --- Cell Operations ---

  clearToDefault(): void {
    const node = this._getNode();
    if (!node || !node.isPrimitive() || node.isReadOnly) {
      return;
    }
    const previousValue = node.getPlainValue();
    const defaultValue = node.defaultValue;
    node.setValue(defaultValue);
    this._onCommit?.(
      this._rowId,
      this._column.field,
      defaultValue,
      previousValue,
    );
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.displayValue);
    } catch {
      /* clipboard unavailable or permission denied */
    }
  }

  async pasteFromClipboard(): Promise<void> {
    if (!this.isEditable) {
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      this.applyPastedText(text);
    } catch {
      /* clipboard unavailable or permission denied */
    }
  }

  applyPastedText(text: string): void {
    const node = this._getNode();
    if (!node?.isPrimitive()) {
      return;
    }
    const previousValue = node.getPlainValue();
    const nodeType = typeof previousValue;
    if (nodeType === 'string') {
      this._applyPastedString(node, text);
    } else if (nodeType === 'number') {
      this._applyPastedNumber(node, text);
    } else if (nodeType === 'boolean') {
      this._applyPastedBoolean(node, text);
    }
    const newValue = node.getPlainValue();
    if (newValue !== previousValue) {
      this._onCommit?.(
        this._rowId,
        this._column.field,
        newValue,
        previousValue,
      );
    }
  }

  // --- Navigation ---

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

  // --- Selection ---

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

  // --- Drag ---

  dragStart(): void {
    this._cellFSM.dragStart({ rowId: this._rowId, field: this._column.field });
  }

  dragExtend(): void {
    this._cellFSM.dragExtend({ rowId: this._rowId, field: this._column.field });
  }

  // --- Private ---

  private _getNode() {
    return this._rowModel.get(this._column.field);
  }

  private _getFileNameNode() {
    return this._rowModel.get(`${this._column.field}.fileName`);
  }

  private _commitFileNameEdit(newFileName: string): void {
    const fileNameNode = this._getFileNameNode();
    if (!fileNameNode || !fileNameNode.isPrimitive()) {
      return;
    }
    const objectNode = this._getNode();
    if (!objectNode) {
      return;
    }
    const previousValue = objectNode.getPlainValue();
    fileNameNode.setValue(newFileName);
    const newValue = objectNode.getPlainValue();
    this._onCommit?.(this._rowId, this._column.field, newValue, previousValue);
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
}
