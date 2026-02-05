import { makeAutoObservable } from 'mobx';
import type { TreeState } from '../state/TreeState';

export class NodeState {
  constructor(
    private readonly _nodeId: string,
    private readonly _treeState: TreeState,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get isExpanded(): boolean {
    return this._treeState.isExpanded(this._nodeId);
  }

  public toggleExpanded(): void {
    this._treeState.toggleExpanded(this._nodeId);
  }

  public get isFocused(): boolean {
    return this._treeState.isFocused(this._nodeId);
  }

  public setFocused(value: boolean): void {
    this._treeState.setFocused(this._nodeId, value);
  }

  public get isMenuOpen(): boolean {
    return this._treeState.isMenuOpen(this._nodeId);
  }

  public setMenuOpen(value: boolean): void {
    this._treeState.setMenuOpen(this._nodeId, value);
  }

  public get isSettingsOpen(): boolean {
    return this._treeState.isSettingsOpen(this._nodeId);
  }

  public setSettingsOpen(value: boolean): void {
    this._treeState.setSettingsOpen(this._nodeId, value);
  }
}
