import { makeAutoObservable } from 'mobx';
import type { RowModel } from '@revisium/schema-toolkit';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type { InlineEditModel } from './InlineEditModel.js';

export class CellVM {
  private readonly _rowModel: RowModel;
  private readonly _column: ColumnSpec;
  private readonly _rowId: string;
  private readonly _inlineEdit: InlineEditModel;

  constructor(
    rowModel: RowModel,
    column: ColumnSpec,
    rowId: string,
    inlineEdit: InlineEditModel,
  ) {
    this._rowModel = rowModel;
    this._column = column;
    this._rowId = rowId;
    this._inlineEdit = inlineEdit;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get field(): string {
    return this._column.field;
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
    const cell = this._inlineEdit.focusedCell;
    if (!cell) {
      return false;
    }
    return cell.rowId === this._rowId && cell.field === this._column.field;
  }

  get isEditing(): boolean {
    return this.isFocused && this._inlineEdit.isEditing;
  }

  focus(): void {
    this._inlineEdit.focusCell({
      rowId: this._rowId,
      field: this._column.field,
    });
  }

  startEdit(): void {
    if (!this.isEditable) {
      return;
    }
    this.focus();
    this._inlineEdit.startEdit();
  }

  commitEdit(newValue: unknown): void {
    const node = this._getNode();
    if (node?.isPrimitive()) {
      node.setValue(newValue);
    }
    this._inlineEdit.commitEdit();
  }

  cancelEdit(): void {
    this._inlineEdit.cancelEdit();
  }

  blur(): void {
    this._inlineEdit.blur();
  }

  private _getNode() {
    return this._rowModel.get(this._column.field);
  }
}
