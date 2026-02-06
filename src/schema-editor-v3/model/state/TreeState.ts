import { makeAutoObservable, observable } from 'mobx';

export class TreeState {
  private readonly _expandedNodes = observable.map<string, boolean>();
  private readonly _focusedNodes = observable.map<string, boolean>();
  private readonly _menuOpenNodes = observable.map<string, boolean>();
  private readonly _settingsOpenNodes = observable.map<string, boolean>();
  private readonly _dropNodes = observable.map<string, boolean>();
  private readonly _disabledDropNodes = observable.map<string, boolean>();
  private readonly _draggedOverNodes = observable.map<string, boolean>();

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public isExpanded(nodeId: string): boolean {
    return this._expandedNodes.get(nodeId) ?? true;
  }

  public setExpanded(nodeId: string, value: boolean): void {
    this._expandedNodes.set(nodeId, value);
  }

  public toggleExpanded(nodeId: string): void {
    this._expandedNodes.set(nodeId, !this.isExpanded(nodeId));
  }

  public isFocused(nodeId: string): boolean {
    return this._focusedNodes.get(nodeId) ?? false;
  }

  public setFocused(nodeId: string, value: boolean): void {
    this._focusedNodes.set(nodeId, value);
  }

  public isMenuOpen(nodeId: string): boolean {
    return this._menuOpenNodes.get(nodeId) ?? false;
  }

  public setMenuOpen(nodeId: string, value: boolean): void {
    this._menuOpenNodes.set(nodeId, value);
  }

  public isSettingsOpen(nodeId: string): boolean {
    return this._settingsOpenNodes.get(nodeId) ?? false;
  }

  public setSettingsOpen(nodeId: string, value: boolean): void {
    this._settingsOpenNodes.set(nodeId, value);
  }

  public isDrop(nodeId: string): boolean {
    return this._dropNodes.get(nodeId) ?? false;
  }

  public setDrop(nodeId: string, value: boolean): void {
    this._dropNodes.set(nodeId, value);
  }

  public isDisabledDrop(nodeId: string): boolean {
    return this._disabledDropNodes.get(nodeId) ?? false;
  }

  public setDisabledDrop(nodeId: string, value: boolean): void {
    this._disabledDropNodes.set(nodeId, value);
  }

  public isDraggedOver(nodeId: string): boolean {
    return this._draggedOverNodes.get(nodeId) ?? false;
  }

  public setDraggedOver(nodeId: string, value: boolean): void {
    this._draggedOverNodes.set(nodeId, value);
  }

  public clearNode(nodeId: string): void {
    this._expandedNodes.delete(nodeId);
    this._focusedNodes.delete(nodeId);
    this._menuOpenNodes.delete(nodeId);
    this._settingsOpenNodes.delete(nodeId);
    this._dropNodes.delete(nodeId);
    this._disabledDropNodes.delete(nodeId);
    this._draggedOverNodes.delete(nodeId);
  }

  public collapseAll(nodeIds: string[], keepRootExpanded: boolean): void {
    for (const nodeId of nodeIds) {
      this._expandedNodes.set(nodeId, false);
    }
    if (keepRootExpanded) {
      const firstNodeId = nodeIds[0];
      if (firstNodeId !== undefined) {
        this._expandedNodes.set(firstNodeId, true);
      }
    }
  }

  public expandAll(nodeIds: string[]): void {
    for (const nodeId of nodeIds) {
      this._expandedNodes.set(nodeId, true);
    }
  }

  public reset(): void {
    this._expandedNodes.clear();
    this._focusedNodes.clear();
    this._menuOpenNodes.clear();
    this._settingsOpenNodes.clear();
    this._dropNodes.clear();
    this._disabledDropNodes.clear();
    this._draggedOverNodes.clear();
  }
}
