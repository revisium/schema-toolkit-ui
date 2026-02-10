import { makeAutoObservable } from 'mobx';
import { Debounce } from '../../../lib/Debounce.js';

export class SearchModel {
  private _query = '';
  private _debouncedQuery = '';
  private readonly _debounce: Debounce;
  private readonly _onSearch: (query: string) => void;

  constructor(onSearch: (query: string) => void, delay: number = 300) {
    this._onSearch = onSearch;
    this._debounce = new Debounce(delay);
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get query(): string {
    return this._query;
  }

  get debouncedQuery(): string {
    return this._debouncedQuery;
  }

  get hasActiveSearch(): boolean {
    return this._debouncedQuery.length > 0;
  }

  setQuery(value: string): void {
    this._query = value;
    this._debounce.schedule(() => {
      this._debouncedQuery = value;
      this._onSearch(value);
    });
  }

  clear(): void {
    this._query = '';
    this._debouncedQuery = '';
    this._debounce.dispose();
    this._onSearch('');
  }

  dispose(): void {
    this._debounce.dispose();
  }
}
