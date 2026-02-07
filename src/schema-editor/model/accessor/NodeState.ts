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
    if (value) {
      this._treeState.setActiveNodeId(this._nodeId);
    }
    this._treeState.setFocused(this._nodeId, value);
  }

  public get isMenuOpen(): boolean {
    return this._treeState.isMenuOpen(this._nodeId);
  }

  public setMenuOpen(value: boolean): void {
    if (value) {
      this._treeState.setActiveNodeId(this._nodeId);
    }
    this._treeState.setMenuOpen(this._nodeId, value);
  }

  public get isSettingsOpen(): boolean {
    return this._treeState.isSettingsOpen(this._nodeId);
  }

  public setSettingsOpen(value: boolean): void {
    if (value) {
      this._treeState.setActiveNodeId(this._nodeId);
    }
    this._treeState.setSettingsOpen(this._nodeId, value);
  }

  public get isDrop(): boolean {
    return this._treeState.isDrop(this._nodeId);
  }

  public setDrop(value: boolean): void {
    this._treeState.setDrop(this._nodeId, value);
  }

  public get isDisabledDrop(): boolean {
    return this._treeState.isDisabledDrop(this._nodeId);
  }

  public setDisabledDrop(value: boolean): void {
    this._treeState.setDisabledDrop(this._nodeId, value);
  }

  public get isDraggedOver(): boolean {
    return this._treeState.isDraggedOver(this._nodeId);
  }

  public setDraggedOver(value: boolean): void {
    this._treeState.setDraggedOver(this._nodeId, value);
  }

  public get isActive(): boolean {
    return this._treeState.isActive(this._nodeId);
  }

  public activate(): void {
    this._treeState.setActiveNodeId(this._nodeId);
  }

  public get focusRequestCount(): number {
    return this._treeState.getFocusRequestCount(this._nodeId);
  }

  public requestFocus(): void {
    this._treeState.requestFocus(this._nodeId);
  }
}
