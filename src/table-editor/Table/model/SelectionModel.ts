import { makeAutoObservable, observable } from 'mobx';

export class SelectionModel {
  private readonly _selected = observable.map<string, boolean>();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isSelectionMode(): boolean {
    return this._selected.size > 0;
  }

  get selectedCount(): number {
    return this._selected.size;
  }

  get selectedIds(): string[] {
    return Array.from(this._selected.keys());
  }

  isSelected(rowId: string): boolean {
    return this._selected.get(rowId) === true;
  }

  toggle(rowId: string): void {
    if (this._selected.has(rowId)) {
      this._selected.delete(rowId);
    } else {
      this._selected.set(rowId, true);
    }
  }

  selectAll(rowIds: string[]): void {
    for (const id of rowIds) {
      this._selected.set(id, true);
    }
  }

  deselectAll(): void {
    this._selected.clear();
  }

  exitSelectionMode(): void {
    this._selected.clear();
  }
}
