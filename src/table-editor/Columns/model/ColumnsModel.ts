import { makeAutoObservable, observable } from 'mobx';
import type { ColumnSpec, ViewColumn } from './types.js';
import { selectDefaultColumns } from './selectDefaultColumns.js';

export class ColumnsModel {
  private _allColumns: ColumnSpec[] = [];
  private _visibleFields: string[] = [];
  private readonly _columnWidths = observable.map<string, number>();
  private _onChange: (() => void) | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get visibleColumns(): ColumnSpec[] {
    const lookup = this._columnLookup;
    const result: ColumnSpec[] = [];
    for (const field of this._visibleFields) {
      const col = lookup.get(field);
      if (col) {
        result.push(col);
      }
    }
    return result;
  }

  get hiddenColumns(): ColumnSpec[] {
    const visible = this._visibleFieldSet;
    return this._allColumns.filter((col) => !visible.has(col.field));
  }

  get availableFieldsToAdd(): ColumnSpec[] {
    const visible = this._visibleFieldSet;
    return this._allColumns.filter(
      (col) => !visible.has(col.field) && !col.isSystem,
    );
  }

  get availableSystemFieldsToAdd(): ColumnSpec[] {
    const visible = this._visibleFieldSet;
    return this._allColumns.filter(
      (col) => !visible.has(col.field) && col.isSystem,
    );
  }

  get hasHiddenColumns(): boolean {
    return this._visibleFields.length < this._allColumns.length;
  }

  get canRemoveColumn(): boolean {
    return this._visibleFields.length > 1;
  }

  get sortableFields(): ColumnSpec[] {
    return this._allColumns.filter((col) => !col.isDeprecated);
  }

  get filterableFields(): ColumnSpec[] {
    return this._allColumns.filter((col) => !col.isDeprecated);
  }

  private get _visibleFieldSet(): Set<string> {
    return new Set(this._visibleFields);
  }

  private get _columnLookup(): Map<string, ColumnSpec> {
    return new Map(this._allColumns.map((col) => [col.field, col]));
  }

  init(columns: ColumnSpec[]): void {
    this._allColumns = columns;
    const defaults = selectDefaultColumns(columns);
    this._visibleFields = defaults.map((col) => col.field);
    this._columnWidths.clear();
  }

  showColumn(field: string): void {
    if (!this._visibleFields.includes(field)) {
      this._visibleFields.push(field);
      this._notifyChange();
    }
  }

  hideColumn(field: string): void {
    if (this._visibleFields.length <= 1) {
      return;
    }
    const index = this._visibleFields.indexOf(field);
    if (index !== -1) {
      this._visibleFields.splice(index, 1);
      this._notifyChange();
    }
  }

  hideAll(): void {
    if (this._visibleFields.length <= 1) {
      return;
    }
    this._visibleFields = this._visibleFields.slice(0, 1);
    this._notifyChange();
  }

  addAll(): void {
    this._visibleFields = this._allColumns.map((col) => col.field);
    this._notifyChange();
  }

  getColumnIndex(field: string): number {
    return this._visibleFields.indexOf(field);
  }

  canMoveLeft(field: string): boolean {
    return this.getColumnIndex(field) > 0;
  }

  canMoveRight(field: string): boolean {
    const index = this.getColumnIndex(field);
    return index >= 0 && index < this._visibleFields.length - 1;
  }

  canMoveToStart(field: string): boolean {
    return this.canMoveLeft(field);
  }

  canMoveToEnd(field: string): boolean {
    return this.canMoveRight(field);
  }

  moveColumnLeft(field: string): void {
    const index = this.getColumnIndex(field);
    if (index > 0) {
      this._visibleFields.splice(index, 1);
      this._visibleFields.splice(index - 1, 0, field);
      this._notifyChange();
    }
  }

  moveColumnRight(field: string): void {
    const index = this.getColumnIndex(field);
    if (index >= 0 && index < this._visibleFields.length - 1) {
      this._visibleFields.splice(index, 1);
      this._visibleFields.splice(index + 1, 0, field);
      this._notifyChange();
    }
  }

  moveColumnToStart(field: string): void {
    const index = this.getColumnIndex(field);
    if (index > 0) {
      this._visibleFields.splice(index, 1);
      this._visibleFields.unshift(field);
      this._notifyChange();
    }
  }

  moveColumnToEnd(field: string): void {
    const index = this.getColumnIndex(field);
    if (index >= 0 && index < this._visibleFields.length - 1) {
      this._visibleFields.splice(index, 1);
      this._visibleFields.push(field);
      this._notifyChange();
    }
  }

  insertColumnBefore(targetField: string, newField: string): void {
    if (this._visibleFields.includes(newField)) {
      return;
    }
    const targetIndex = this._visibleFields.indexOf(targetField);
    if (targetIndex === -1) {
      return;
    }
    this._visibleFields.splice(targetIndex, 0, newField);
    this._notifyChange();
  }

  insertColumnAfter(targetField: string, newField: string): void {
    if (this._visibleFields.includes(newField)) {
      return;
    }
    const targetIndex = this._visibleFields.indexOf(targetField);
    if (targetIndex === -1) {
      return;
    }
    this._visibleFields.splice(targetIndex + 1, 0, newField);
    this._notifyChange();
  }

  reorderColumns(fields: string[]): void {
    this._visibleFields = fields;
    this._notifyChange();
  }

  setColumnWidth(field: string, width: number): void {
    this._columnWidths.set(field, width);
    this._notifyChange();
  }

  getColumnWidth(field: string): number | undefined {
    return this._columnWidths.get(field);
  }

  resetToDefaults(): void {
    const defaults = selectDefaultColumns(this._allColumns);
    this._visibleFields = defaults.map((col) => col.field);
    this._columnWidths.clear();
    this._notifyChange();
  }

  serializeToViewColumns(): ViewColumn[] {
    return this._visibleFields.map((field) => {
      const viewField = this._toViewField(field);
      const width = this._columnWidths.get(field);
      const result: ViewColumn = { field: viewField };
      if (width !== undefined) {
        result.width = width;
      }
      return result;
    });
  }

  applyViewColumns(viewColumns: ViewColumn[]): void {
    const lookup = this._columnLookup;
    const fields: string[] = [];
    this._columnWidths.clear();

    for (const vc of viewColumns) {
      const field = this._fromViewField(vc.field);
      if (lookup.has(field)) {
        fields.push(field);
        if (vc.width !== undefined) {
          this._columnWidths.set(field, vc.width);
        }
      }
    }

    this._visibleFields = fields;
  }

  setOnChange(cb: (() => void) | null): void {
    this._onChange = cb;
  }

  dispose(): void {
    this._onChange = null;
  }

  private _toViewField(field: string): string {
    const col = this._columnLookup.get(field);
    if (col?.isSystem) {
      return field;
    }
    return `data.${field}`;
  }

  private _fromViewField(viewField: string): string {
    if (viewField.startsWith('data.')) {
      return viewField.slice(5);
    }
    return viewField;
  }

  private _notifyChange(): void {
    if (this._onChange) {
      this._onChange();
    }
  }
}
