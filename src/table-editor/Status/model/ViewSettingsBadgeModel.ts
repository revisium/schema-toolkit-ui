import { makeAutoObservable } from 'mobx';

export class ViewSettingsBadgeModel {
  private _snapshot: string | null = null;
  private _currentSnapshot: string | null = null;
  private _canSave = false;
  private _isPopoverOpen = false;
  private _onSave: (() => Promise<void>) | null = null;
  private _onRevert: (() => void) | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get hasChanges(): boolean {
    return this._snapshot !== this._currentSnapshot;
  }

  get isVisible(): boolean {
    return this.hasChanges;
  }

  get canSave(): boolean {
    return this._canSave;
  }

  get isPopoverOpen(): boolean {
    return this._isPopoverOpen;
  }

  saveSnapshot(state: unknown): void {
    const json = JSON.stringify(state);
    this._snapshot = json;
    this._currentSnapshot = json;
  }

  checkForChanges(state: unknown): void {
    this._currentSnapshot = JSON.stringify(state);
  }

  async save(): Promise<void> {
    if (this._onSave) {
      await this._onSave();
    }
  }

  revert(): void {
    if (this._onRevert) {
      this._onRevert();
    }
    this._currentSnapshot = this._snapshot;
  }

  setCanSave(value: boolean): void {
    this._canSave = value;
  }

  setPopoverOpen(value: boolean): void {
    this._isPopoverOpen = value;
  }

  setOnSave(cb: (() => Promise<void>) | null): void {
    this._onSave = cb;
  }

  setOnRevert(cb: (() => void) | null): void {
    this._onRevert = cb;
  }

  dispose(): void {
    this._onSave = null;
    this._onRevert = null;
  }
}
