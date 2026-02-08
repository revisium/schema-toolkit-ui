import { makeAutoObservable, observable } from 'mobx';

export class RowTreeState {
  private readonly _expanded = observable.map<string, boolean>();
  private readonly _focused = observable.map<string, boolean>();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  isExpanded(nodeId: string): boolean {
    return this._expanded.get(nodeId) ?? true;
  }

  setExpanded(nodeId: string, value: boolean): void {
    this._expanded.set(nodeId, value);
  }

  toggleExpanded(nodeId: string): void {
    this._expanded.set(nodeId, !this.isExpanded(nodeId));
  }

  isFocused(nodeId: string): boolean {
    return this._focused.get(nodeId) ?? false;
  }

  setFocused(nodeId: string, value: boolean): void {
    this._focused.set(nodeId, value);
  }

  expandAll(nodeIds: string[]): void {
    for (const nodeId of nodeIds) {
      this._expanded.set(nodeId, true);
    }
  }

  collapseAll(nodeIds: string[]): void {
    for (const nodeId of nodeIds) {
      this._expanded.set(nodeId, false);
    }
  }

  reset(): void {
    this._expanded.clear();
    this._focused.clear();
  }
}
