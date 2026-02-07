import { makeAutoObservable } from 'mobx';

export type ViewMode = 'Tree' | 'Json' | 'RefBy';

export class ViewState {
  private _viewMode: ViewMode = 'Tree';
  private _loading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get viewMode(): ViewMode {
    return this._viewMode;
  }

  public setViewMode(mode: ViewMode): void {
    this._viewMode = mode;
  }

  public get loading(): boolean {
    return this._loading;
  }

  public setLoading(value: boolean): void {
    this._loading = value;
  }
}
