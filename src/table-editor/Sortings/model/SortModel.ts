import { makeAutoObservable } from 'mobx';
import { createRowModel, obj, arr, str } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../lib/initReactivity.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type { SortEntry, ViewSort } from './types.js';

const SORT_SCHEMA = arr(
  obj({
    field: str(),
    direction: str(),
  }),
);

type SortRowModel = ReturnType<typeof createRowModel<typeof SORT_SCHEMA>>;
type SortRootNode = SortRowModel['root'];
type SortItemValue = ReturnType<SortRootNode['getPlainValue']>[number];

export class SortModel {
  private readonly _row: SortRowModel;
  private _availableFields: ColumnSpec[] = [];
  private _isOpen = false;
  private _onChange: (() => void) | null = null;

  constructor() {
    ensureReactivityProvider();
    this._row = createRowModel({
      rowId: 'sort',
      schema: SORT_SCHEMA,
      data: [],
    });
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private get _rootNode(): SortRootNode {
    return this._row.root;
  }

  get sorts(): SortEntry[] {
    return this._row.getPlainValue() as SortEntry[];
  }

  get hasSorts(): boolean {
    return this._rootNode.length > 0;
  }

  get sortCount(): number {
    return this._rootNode.length;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  get hasPendingChanges(): boolean {
    return this._row.isDirty;
  }

  setOpen(value: boolean): void {
    this._isOpen = value;
  }

  get availableFields(): ColumnSpec[] {
    const used = new Set(this.sorts.map((s) => s.field));
    return this._availableFields.filter((col) => !used.has(col.field));
  }

  private get _fieldLookup(): Map<string, ColumnSpec> {
    return new Map(this._availableFields.map((col) => [col.field, col]));
  }

  private _findIndex(field: string): number {
    return this._rootNode.findIndex(
      (node) => node.child('field').value === field,
    );
  }

  private _setItemChild(
    index: number,
    childName: 'field' | 'direction',
    value: string,
  ): void {
    const itemNode = this._rootNode.at(index);
    if (itemNode) {
      itemNode.child(childName).setValue(value);
    }
  }

  init(availableFields: ColumnSpec[]): void {
    this._availableFields = availableFields;
    this._row.reset([]);
  }

  apply(): void {
    this._row.commit();
    this._notifyChange();
  }

  addSort(field: string, direction: 'asc' | 'desc' = 'asc'): void {
    if (this._findIndex(field) >= 0) {
      return;
    }
    this._rootNode.pushValue({ field, direction });
  }

  replaceField(oldField: string, newField: string): void {
    if (oldField === newField) {
      return;
    }
    const oldIndex = this._findIndex(oldField);
    if (oldIndex < 0) {
      return;
    }
    const dupIndex = this._findIndex(newField);
    if (dupIndex >= 0) {
      this._rootNode.removeAt(dupIndex);
      const adjustedIndex = dupIndex < oldIndex ? oldIndex - 1 : oldIndex;
      this._setItemChild(adjustedIndex, 'field', newField);
    } else {
      this._setItemChild(oldIndex, 'field', newField);
    }
  }

  getSortDirection(field: string): 'asc' | 'desc' | null {
    const sort = this.sorts.find((s) => s.field === field);
    return sort ? sort.direction : null;
  }

  getSortIndex(field: string): number | null {
    const index = this._findIndex(field);
    return index >= 0 ? index + 1 : null;
  }

  isSorted(field: string): boolean {
    return this._findIndex(field) >= 0;
  }

  setSingleSort(field: string, direction: 'asc' | 'desc'): void {
    const index = this._findIndex(field);
    if (index >= 0) {
      this._setItemChild(index, 'direction', direction);
    } else {
      this._rootNode.pushValue({ field, direction });
    }
    this.apply();
  }

  setDirection(field: string, direction: 'asc' | 'desc'): void {
    const index = this._findIndex(field);
    if (index >= 0) {
      this._setItemChild(index, 'direction', direction);
    }
  }

  removeSort(field: string): void {
    const index = this._findIndex(field);
    if (index >= 0) {
      this._rootNode.removeAt(index);
    }
  }

  toggleDirection(field: string): void {
    const index = this._findIndex(field);
    if (index >= 0) {
      const current = this.sorts[index]?.direction;
      this._setItemChild(
        index,
        'direction',
        current === 'asc' ? 'desc' : 'asc',
      );
    }
  }

  reorderSorts(fields: string[]): void {
    const plainSorts = this._rootNode.getPlainValue();
    const lookup = new Map(plainSorts.map((s) => [s.field, s]));
    const reordered: SortItemValue[] = [];
    for (const field of fields) {
      const entry = lookup.get(field);
      if (entry) {
        reordered.push(entry);
      }
    }
    this._rootNode.setValue(reordered);
  }

  clearAll(): void {
    this._rootNode.clear();
    this._row.commit();
    this._notifyChange();
  }

  serializeToViewSorts(): ViewSort[] {
    const lookup = this._fieldLookup;
    return this.sorts.map((sort) => {
      const col = lookup.get(sort.field);
      const viewField = col?.isSystem ? sort.field : `data.${sort.field}`;
      return { field: viewField, direction: sort.direction };
    });
  }

  applyViewSorts(viewSorts: ViewSort[]): void {
    const lookup = this._fieldLookup;
    const sorts: SortItemValue[] = [];

    for (const vs of viewSorts) {
      const field = vs.field.startsWith('data.') ? vs.field.slice(5) : vs.field;
      const direction = vs.direction === 'desc' ? 'desc' : 'asc';
      if (lookup.has(field)) {
        sorts.push({ field, direction });
      }
    }

    this._rootNode.setValue(sorts);
    this._row.commit();
    this._notifyChange();
  }

  setOnChange(cb: (() => void) | null): void {
    this._onChange = cb;
  }

  dispose(): void {
    this._onChange = null;
    this._row.dispose();
  }

  private _notifyChange(): void {
    if (this._onChange) {
      this._onChange();
    }
  }
}
