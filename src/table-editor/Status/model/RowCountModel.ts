import { makeAutoObservable } from 'mobx';

export class RowCountModel {
  private _totalCount = 0;
  private _baseTotalCount = 0;
  private _isFiltering = false;
  private _isRefetching = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get totalCount(): number {
    return this._totalCount;
  }

  get baseTotalCount(): number {
    return this._baseTotalCount;
  }

  get isFiltering(): boolean {
    return this._isFiltering;
  }

  get isRefetching(): boolean {
    return this._isRefetching;
  }

  get text(): string {
    if (this._isFiltering) {
      return `${this._totalCount} of ${this._baseTotalCount} ${this._baseTotalCount === 1 ? 'row' : 'rows'}`;
    }
    return `${this._totalCount} ${this._totalCount === 1 ? 'row' : 'rows'}`;
  }

  setTotalCount(count: number): void {
    this._totalCount = count;
  }

  setBaseTotalCount(count: number): void {
    this._baseTotalCount = count;
  }

  setIsFiltering(value: boolean): void {
    this._isFiltering = value;
  }

  setRefetching(value: boolean): void {
    this._isRefetching = value;
  }

  decrementBaseTotalCount(by: number = 1): void {
    this._baseTotalCount = Math.max(0, this._baseTotalCount - by);
    this._totalCount = Math.max(0, this._totalCount - by);
  }
}
