import { makeAutoObservable, reaction, runInAction } from 'mobx';
import { Debounce } from '../../lib/Debounce';

export interface SearchForeignKeySearchFn {
  (
    tableId: string,
    search: string,
  ): Promise<{ ids: string[]; hasMore: boolean }>;
}

type SearchState = 'loading' | 'empty' | 'list' | 'notFound' | 'error';

export class SearchForeignKeyVM {
  private _search = '';
  private _state: SearchState = 'loading';
  private _ids: string[] = [];
  private _hasMore = false;
  private _disposeReaction: (() => void) | null = null;
  private readonly _debounce = new Debounce(300);

  constructor(
    private readonly _tableId: string,
    private readonly _onSearch: SearchForeignKeySearchFn | null,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get search(): string {
    return this._search;
  }

  get state(): SearchState {
    return this._state;
  }

  get ids(): string[] {
    return this._ids;
  }

  get hasMore(): boolean {
    return this._hasMore;
  }

  get showInput(): boolean {
    return this._state === 'list' || this._state === 'notFound';
  }

  get showFooter(): boolean {
    return (
      this._state === 'list' ||
      this._state === 'notFound' ||
      this._state === 'error' ||
      this._state === 'empty'
    );
  }

  get showLoading(): boolean {
    return this._state === 'loading';
  }

  get showNotFound(): boolean {
    return this._state === 'notFound';
  }

  get showError(): boolean {
    return this._state === 'error';
  }

  get showEmpty(): boolean {
    return this._state === 'empty';
  }

  get showList(): boolean {
    return this._state === 'list';
  }

  get tableId(): string {
    return this._tableId;
  }

  init(): void {
    void this._performSearch();
    this._disposeReaction = reaction(
      () => this._search,
      () => this._debouncedSearch(),
    );
  }

  setSearch(value: string): void {
    this._search = value;
  }

  dispose(): void {
    this._disposeReaction?.();
    this._disposeReaction = null;
    this._debounce.dispose();
  }

  private _debouncedSearch(): void {
    this._state = 'loading';
    this._debounce.schedule(() => {
      void this._performSearch();
    });
  }

  private _resolveState(ids: string[], search: string): SearchState {
    if (ids.length === 0 && !search) {
      return 'empty';
    }
    if (ids.length === 0) {
      return 'notFound';
    }
    return 'list';
  }

  private async _performSearch(): Promise<void> {
    if (!this._onSearch) {
      this._state = 'error';
      return;
    }

    try {
      this._state = 'loading';
      const result = await this._onSearch(this._tableId, this._search);
      runInAction(() => {
        this._ids = result.ids;
        this._hasMore = result.hasMore;
        this._state = this._resolveState(result.ids, this._search);
      });
    } catch {
      runInAction(() => {
        this._state = 'error';
      });
    }
  }
}
