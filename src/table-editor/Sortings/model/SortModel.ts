import { makeAutoObservable } from 'mobx';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type { SortEntry, ViewSort } from './types.js';

export class SortModel {
  private _sorts: SortEntry[] = [];
  private _availableFields: ColumnSpec[] = [];
  private _isOpen = false;
  private _onChange: (() => void) | null = null;
  private _appliedSnapshot: string | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get sorts(): SortEntry[] {
    return this._sorts;
  }

  get hasSorts(): boolean {
    return this._sorts.length > 0;
  }

  get sortCount(): number {
    return this._sorts.length;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  get hasPendingChanges(): boolean {
    return JSON.stringify(this._sorts) !== this._appliedSnapshot;
  }

  get hasAppliedSorts(): boolean {
    if (this._appliedSnapshot === null) {
      return false;
    }
    const applied = JSON.parse(this._appliedSnapshot) as SortEntry[];
    return applied.length > 0;
  }

  get appliedSortCount(): number {
    if (this._appliedSnapshot === null) {
      return 0;
    }
    const applied = JSON.parse(this._appliedSnapshot) as SortEntry[];
    return applied.length;
  }

  setOpen(value: boolean): void {
    this._isOpen = value;
  }

  get availableFields(): ColumnSpec[] {
    const used = new Set(this._sorts.map((s) => s.field));
    return this._availableFields.filter((col) => !used.has(col.field));
  }

  private get _fieldLookup(): Map<string, ColumnSpec> {
    return new Map(this._availableFields.map((col) => [col.field, col]));
  }

  init(availableFields: ColumnSpec[]): void {
    this._availableFields = availableFields;
    this._sorts = [];
    this._appliedSnapshot = JSON.stringify(this._sorts);
  }

  apply(): void {
    this._appliedSnapshot = JSON.stringify(this._sorts);
    this._notifyChange();
  }

  addSort(field: string, direction: 'asc' | 'desc' = 'asc'): void {
    if (this._sorts.some((s) => s.field === field)) {
      return;
    }
    this._sorts.push({ field, direction });
  }

  replaceField(oldField: string, newField: string): void {
    if (oldField === newField) {
      return;
    }
    const entry = this._sorts.find((s) => s.field === oldField);
    if (!entry) {
      return;
    }
    this._sorts = this._sorts.filter((s) => s.field !== newField);
    entry.field = newField;
  }

  getSortDirection(field: string): 'asc' | 'desc' | null {
    const sort = this._sorts.find((s) => s.field === field);
    return sort ? sort.direction : null;
  }

  getSortIndex(field: string): number | null {
    const index = this._sorts.findIndex((s) => s.field === field);
    return index >= 0 ? index + 1 : null;
  }

  isSorted(field: string): boolean {
    return this._sorts.some((s) => s.field === field);
  }

  setSingleSort(field: string, direction: 'asc' | 'desc'): void {
    const existing = this._sorts.find((s) => s.field === field);
    if (existing) {
      existing.direction = direction;
    } else {
      this._sorts.push({ field, direction });
    }
    this.apply();
  }

  setDirection(field: string, direction: 'asc' | 'desc'): void {
    const sort = this._sorts.find((s) => s.field === field);
    if (sort) {
      sort.direction = direction;
    }
  }

  removeSort(field: string): void {
    this._sorts = this._sorts.filter((s) => s.field !== field);
  }

  toggleDirection(field: string): void {
    const sort = this._sorts.find((s) => s.field === field);
    if (sort) {
      sort.direction = sort.direction === 'asc' ? 'desc' : 'asc';
    }
  }

  reorderSorts(fields: string[]): void {
    const lookup = new Map(this._sorts.map((s) => [s.field, s]));
    const reordered: SortEntry[] = [];
    for (const field of fields) {
      const entry = lookup.get(field);
      if (entry) {
        reordered.push(entry);
      }
    }
    this._sorts = reordered;
  }

  clearAll(): void {
    this._sorts = [];
    this._appliedSnapshot = JSON.stringify(this._sorts);
    this._notifyChange();
  }

  serializeToViewSorts(): ViewSort[] {
    const lookup = this._fieldLookup;
    return this._sorts.map((sort) => {
      const col = lookup.get(sort.field);
      const viewField = col?.isSystem ? sort.field : `data.${sort.field}`;
      return { field: viewField, direction: sort.direction };
    });
  }

  applyViewSorts(viewSorts: ViewSort[]): void {
    const lookup = this._fieldLookup;
    const sorts: SortEntry[] = [];

    for (const vs of viewSorts) {
      const field = vs.field.startsWith('data.') ? vs.field.slice(5) : vs.field;
      const direction = vs.direction === 'desc' ? 'desc' : 'asc';
      if (lookup.has(field)) {
        sorts.push({ field, direction });
      }
    }

    this._sorts = sorts;
    this._appliedSnapshot = JSON.stringify(this._sorts);
    this._notifyChange();
  }

  setOnChange(cb: (() => void) | null): void {
    this._onChange = cb;
  }

  dispose(): void {
    this._onChange = null;
    this._sorts = [];
  }

  private _notifyChange(): void {
    if (this._onChange) {
      this._onChange();
    }
  }
}
