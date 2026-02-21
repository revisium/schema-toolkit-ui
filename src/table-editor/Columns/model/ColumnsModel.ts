import { makeAutoObservable, observable } from 'mobx';
import type { ColumnSpec, PinSide, ViewColumn } from './types.js';
import { selectDefaultColumns } from './selectDefaultColumns.js';

const DEFAULT_COLUMN_WIDTH = 150;

export class ColumnsModel {
  private _allColumns: ColumnSpec[] = [];
  private _visibleFields: string[] = [];
  private readonly _columnWidths = observable.map<string, number>();
  private readonly _pinnedColumns = observable.map<string, PinSide>();
  private _onChange: (() => void) | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  // --- Computed Getters ---

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

  get pinnedLeftCount(): number {
    let count = 0;
    for (const side of this._pinnedColumns.values()) {
      if (side === 'left') {
        count++;
      }
    }
    return count;
  }

  get pinnedRightCount(): number {
    let count = 0;
    for (const side of this._pinnedColumns.values()) {
      if (side === 'right') {
        count++;
      }
    }
    return count;
  }

  // --- Lifecycle ---

  init(columns: ColumnSpec[]): void {
    this._allColumns = columns;
    const defaults = selectDefaultColumns(columns);
    this._visibleFields = defaults.map((col) => col.field);
    this._columnWidths.clear();
    this._pinnedColumns.clear();
  }

  // --- Visibility ---

  showColumn(field: string): void {
    if (!this._visibleFields.includes(field)) {
      const rightBounds = this._getZoneBounds('right');
      this._visibleFields.splice(rightBounds.start, 0, field);
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
      this._pinnedColumns.delete(field);
      this._notifyChange();
    }
  }

  hideAll(): void {
    if (this._visibleFields.length <= 1) {
      return;
    }
    this._visibleFields = this._visibleFields.slice(0, 1);
    this._pinnedColumns.clear();
    this._notifyChange();
  }

  addAll(): void {
    this._visibleFields = this._allColumns.map((col) => col.field);
    this._notifyChange();
  }

  // --- Query ---

  getColumnIndex(field: string): number {
    return this._visibleFields.indexOf(field);
  }

  canMoveLeft(field: string): boolean {
    const index = this.getColumnIndex(field);
    if (index <= 0) {
      return false;
    }
    const zone = this._getZone(field);
    const bounds = this._getZoneBounds(zone);
    return index > bounds.start;
  }

  canMoveRight(field: string): boolean {
    const index = this.getColumnIndex(field);
    if (index < 0 || index >= this._visibleFields.length - 1) {
      return false;
    }
    const zone = this._getZone(field);
    const bounds = this._getZoneBounds(zone);
    return index < bounds.end - 1;
  }

  canMoveToStart(field: string): boolean {
    return this.canMoveLeft(field);
  }

  canMoveToEnd(field: string): boolean {
    return this.canMoveRight(field);
  }

  // --- Movement ---

  moveColumnLeft(field: string): void {
    if (!this.canMoveLeft(field)) {
      return;
    }
    const index = this.getColumnIndex(field);
    this._visibleFields.splice(index, 1);
    this._visibleFields.splice(index - 1, 0, field);
    this._notifyChange();
  }

  moveColumnRight(field: string): void {
    if (!this.canMoveRight(field)) {
      return;
    }
    const index = this.getColumnIndex(field);
    this._visibleFields.splice(index, 1);
    this._visibleFields.splice(index + 1, 0, field);
    this._notifyChange();
  }

  moveColumnToStart(field: string): void {
    if (!this.canMoveLeft(field)) {
      return;
    }
    const index = this.getColumnIndex(field);
    const zone = this._getZone(field);
    const bounds = this._getZoneBounds(zone);
    this._visibleFields.splice(index, 1);
    this._visibleFields.splice(bounds.start, 0, field);
    this._notifyChange();
  }

  moveColumnToEnd(field: string): void {
    if (!this.canMoveRight(field)) {
      return;
    }
    const index = this.getColumnIndex(field);
    const zone = this._getZone(field);
    const bounds = this._getZoneBounds(zone);
    this._visibleFields.splice(index, 1);
    this._visibleFields.splice(bounds.end - 1, 0, field);
    this._notifyChange();
  }

  // --- Insertion ---

  insertColumnBefore(targetField: string, newField: string): void {
    if (this._visibleFields.includes(newField)) {
      return;
    }
    const targetIndex = this._visibleFields.indexOf(targetField);
    if (targetIndex === -1) {
      return;
    }
    const targetPin = this._pinnedColumns.get(targetField);
    const shouldPin =
      targetPin !== undefined &&
      this._hasNeighborPin(targetIndex, 'before', targetPin);
    this._visibleFields.splice(targetIndex, 0, newField);
    if (shouldPin) {
      this._pinnedColumns.set(newField, targetPin);
    }
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
    const targetPin = this._pinnedColumns.get(targetField);
    const shouldPin =
      targetPin !== undefined &&
      this._hasNeighborPin(targetIndex, 'after', targetPin);
    this._visibleFields.splice(targetIndex + 1, 0, newField);
    if (shouldPin) {
      this._pinnedColumns.set(newField, targetPin);
    }
    this._notifyChange();
  }

  reorderColumns(fields: string[]): void {
    this._visibleFields = fields;
    this._notifyChange();
  }

  // --- Width ---

  setColumnWidth(field: string, width: number): void {
    this._columnWidths.set(field, width);
    this._notifyChange();
  }

  getColumnWidth(field: string): number | undefined {
    return this._columnWidths.get(field);
  }

  resolveColumnWidth(field: string): number {
    return this._columnWidths.get(field) ?? DEFAULT_COLUMN_WIDTH;
  }

  // --- Pinning ---

  getPinState(field: string): PinSide | undefined {
    return this._pinnedColumns.get(field);
  }

  isPinned(field: string): boolean {
    return this._pinnedColumns.has(field);
  }

  canPinLeft(field: string): boolean {
    const index = this.getColumnIndex(field);
    if (index < 0) {
      return false;
    }
    return this._pinnedColumns.get(field) !== 'left';
  }

  canPinRight(field: string): boolean {
    const index = this.getColumnIndex(field);
    if (index < 0) {
      return false;
    }
    return this._pinnedColumns.get(field) !== 'right';
  }

  canUnpin(field: string): boolean {
    return this._pinnedColumns.has(field);
  }

  pinLeft(field: string): void {
    const index = this.getColumnIndex(field);
    if (index < 0) {
      return;
    }
    this._pinnedColumns.set(field, 'left');
    this._visibleFields.splice(index, 1);
    const insertAt = this._pinnedLeftInsertIndex();
    this._visibleFields.splice(insertAt, 0, field);
    this._notifyChange();
  }

  pinRight(field: string): void {
    const index = this.getColumnIndex(field);
    if (index < 0) {
      return;
    }
    this._pinnedColumns.set(field, 'right');
    this._visibleFields.splice(index, 1);
    const insertAt = this._pinnedRightInsertIndex();
    this._visibleFields.splice(insertAt, 0, field);
    this._notifyChange();
  }

  unpin(field: string): void {
    if (!this._pinnedColumns.has(field)) {
      return;
    }
    const wasLeft = this._pinnedColumns.get(field) === 'left';
    this._pinnedColumns.delete(field);
    const index = this.getColumnIndex(field);
    if (index < 0) {
      return;
    }
    this._visibleFields.splice(index, 1);
    if (wasLeft) {
      const middleBounds = this._getZoneBounds('middle');
      this._visibleFields.splice(middleBounds.start, 0, field);
    } else {
      const middleBounds = this._getZoneBounds('middle');
      this._visibleFields.splice(middleBounds.end, 0, field);
    }
    this._notifyChange();
  }

  getColumnStickyLeft(
    field: string,
    selectionWidth: number,
  ): number | undefined {
    if (this._pinnedColumns.get(field) !== 'left') {
      return undefined;
    }
    let offset = selectionWidth;
    for (const f of this._visibleFields) {
      if (f === field) {
        break;
      }
      if (this._pinnedColumns.get(f) === 'left') {
        offset += this.resolveColumnWidth(f);
      }
    }
    return offset;
  }

  getColumnStickyRight(field: string): number | undefined {
    if (this._pinnedColumns.get(field) !== 'right') {
      return undefined;
    }
    let offset = 0;
    let found = false;
    for (const f of this._visibleFields) {
      if (f === field) {
        found = true;
        continue;
      }
      if (found && this._pinnedColumns.get(f) === 'right') {
        offset += this.resolveColumnWidth(f);
      }
    }
    return offset;
  }

  isStickyLeftBoundary(field: string): boolean {
    if (this._pinnedColumns.get(field) !== 'left') {
      return false;
    }
    const index = this.getColumnIndex(field);
    const nextField = this._visibleFields[index + 1];
    if (!nextField) {
      return true;
    }
    return this._pinnedColumns.get(nextField) !== 'left';
  }

  isStickyRightBoundary(field: string): boolean {
    if (this._pinnedColumns.get(field) !== 'right') {
      return false;
    }
    const index = this.getColumnIndex(field);
    if (index <= 0) {
      return true;
    }
    const prevField = this._visibleFields[index - 1];
    if (!prevField) {
      return true;
    }
    return this._pinnedColumns.get(prevField) !== 'right';
  }

  // --- Reset ---

  resetToDefaults(): void {
    const defaults = selectDefaultColumns(this._allColumns);
    this._visibleFields = defaults.map((col) => col.field);
    this._columnWidths.clear();
    this._pinnedColumns.clear();
    this._notifyChange();
  }

  // --- Serialization ---

  serializeToViewColumns(): ViewColumn[] {
    return this._visibleFields.map((field) => {
      const viewField = this._toViewField(field);
      const width = this._columnWidths.get(field);
      const pinned = this._pinnedColumns.get(field);
      const result: ViewColumn = { field: viewField };
      if (width !== undefined) {
        result.width = width;
      }
      if (pinned !== undefined) {
        result.pinned = pinned;
      }
      return result;
    });
  }

  applyViewColumns(viewColumns: ViewColumn[]): void {
    const lookup = this._columnLookup;
    const fields: string[] = [];
    this._columnWidths.clear();
    this._pinnedColumns.clear();

    for (const vc of viewColumns) {
      const field = this._fromViewField(vc.field);
      if (lookup.has(field)) {
        fields.push(field);
        if (vc.width !== undefined) {
          this._columnWidths.set(field, vc.width);
        }
        if (vc.pinned !== undefined) {
          this._pinnedColumns.set(field, vc.pinned);
        }
      }
    }

    this._visibleFields = fields;
  }

  // --- Events ---

  setOnChange(cb: (() => void) | null): void {
    this._onChange = cb;
  }

  dispose(): void {
    this._onChange = null;
  }

  // --- Private ---

  private get _visibleFieldSet(): Set<string> {
    return new Set(this._visibleFields);
  }

  private get _columnLookup(): Map<string, ColumnSpec> {
    return new Map(this._allColumns.map((col) => [col.field, col]));
  }

  private _getZone(field: string): 'left' | 'middle' | 'right' {
    const pin = this._pinnedColumns.get(field);
    if (pin === 'left') {
      return 'left';
    }
    if (pin === 'right') {
      return 'right';
    }
    return 'middle';
  }

  private _getZoneBounds(zone: 'left' | 'middle' | 'right'): {
    start: number;
    end: number;
  } {
    let leftEnd = 0;
    for (let i = 0; i < this._visibleFields.length; i++) {
      const f = this._visibleFields[i];
      if (f && this._pinnedColumns.get(f) === 'left') {
        leftEnd = i + 1;
      } else {
        break;
      }
    }

    let rightStart = this._visibleFields.length;
    for (let i = this._visibleFields.length - 1; i >= 0; i--) {
      const f = this._visibleFields[i];
      if (f && this._pinnedColumns.get(f) === 'right') {
        rightStart = i;
      } else {
        break;
      }
    }

    switch (zone) {
      case 'left':
        return { start: 0, end: leftEnd };
      case 'right':
        return { start: rightStart, end: this._visibleFields.length };
      case 'middle':
        return { start: leftEnd, end: rightStart };
    }
  }

  private _pinnedLeftInsertIndex(): number {
    const bounds = this._getZoneBounds('left');
    return bounds.end;
  }

  private _pinnedRightInsertIndex(): number {
    const bounds = this._getZoneBounds('right');
    return bounds.start;
  }

  private _hasNeighborPin(
    targetIndex: number,
    direction: 'before' | 'after',
    pin: PinSide,
  ): boolean {
    const neighborIndex =
      direction === 'after' ? targetIndex + 1 : targetIndex - 1;
    const neighbor = this._visibleFields[neighborIndex];
    if (!neighbor) {
      return false;
    }
    return this._pinnedColumns.get(neighbor) === pin;
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
