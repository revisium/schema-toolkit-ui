import { makeAutoObservable } from 'mobx';
import type { RowTreeState } from '../state/RowTreeState';

export class RowNodeState {
  constructor(
    private readonly _nodeId: string,
    private readonly _treeState: RowTreeState,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isExpanded(): boolean {
    return this._treeState.isExpanded(this._nodeId);
  }

  setExpanded(value: boolean): void {
    this._treeState.setExpanded(this._nodeId, value);
  }

  toggleExpanded(): void {
    this._treeState.toggleExpanded(this._nodeId);
  }

  get isFocused(): boolean {
    return this._treeState.isFocused(this._nodeId);
  }

  setFocused(value: boolean): void {
    this._treeState.setFocused(this._nodeId, value);
  }
}
