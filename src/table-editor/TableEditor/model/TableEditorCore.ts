import { makeAutoObservable } from 'mobx';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import { FilterModel } from '../../Filters/model/FilterModel.js';
import { buildWhereClause } from '../../Filters/model/filterBuilder.js';
import { SearchModel } from '../../Search/model/SearchModel.js';
import { SortModel } from '../../Sortings/model/SortModel.js';
import { ViewSettingsBadgeModel } from '../../Status/model/ViewSettingsBadgeModel.js';
import { CellFSM } from '../../Table/model/CellFSM.js';
import { SelectionModel } from '../../Table/model/SelectionModel.js';

export interface TableEditorCallbacks {
  onFilter?: (where: Record<string, unknown> | null) => void;
  onSort?: (sorts: Array<{ field: string; direction: string }>) => void;
  onSearch?: (query: string) => void;
  onColumnsChange?: () => void;
}

export interface ViewState {
  columns: Array<{ field: string; width?: number }>;
  filters: string | null;
  sorts: Array<{ field: string; direction: string }>;
  search: string;
}

export class TableEditorCore {
  public readonly columns: ColumnsModel;
  public readonly filters: FilterModel;
  public readonly sorts: SortModel;
  public readonly search: SearchModel;
  public readonly viewBadge: ViewSettingsBadgeModel;
  public readonly cellFSM: CellFSM;
  public readonly selection: SelectionModel;

  private readonly _callbacks: TableEditorCallbacks;

  constructor(callbacks: TableEditorCallbacks = {}) {
    this._callbacks = callbacks;
    this.columns = new ColumnsModel();
    this.filters = new FilterModel();
    this.sorts = new SortModel();
    this.search = new SearchModel((query) => this._handleSearch(query));
    this.viewBadge = new ViewSettingsBadgeModel();
    this.cellFSM = new CellFSM();
    this.selection = new SelectionModel();

    this.columns.setOnChange(() => this._handleColumnsChange());
    this.filters.setOnChange(() => this._handleFilterChange());
    this.sorts.setOnChange(() => this._handleSortChange());

    makeAutoObservable(this, {}, { autoBind: true });
  }

  init(allColumns: ColumnSpec[]): void {
    this.columns.init(allColumns);
    this.sorts.init(this.columns.sortableFields);
    this.filters.init(this.columns.filterableFields);
    this._saveViewSnapshot();
  }

  applyFilter(): void {
    this.filters.apply();
    const where = buildWhereClause(this.filters.rootGroup);
    this._callbacks.onFilter?.(where);
    this._checkViewChanges();
  }

  getViewState(): ViewState {
    return {
      columns: this.columns.serializeToViewColumns(),
      filters: this.filters.hasActiveFilters
        ? JSON.stringify(this.filters.rootGroup)
        : null,
      sorts: this.sorts.serializeToViewSorts(),
      search: this.search.debouncedQuery,
    };
  }

  applyViewState(state: ViewState): void {
    this.columns.applyViewColumns(state.columns);
    this.sorts.applyViewSorts(state.sorts);
    if (state.filters) {
      this.filters.applySnapshot(state.filters);
    } else {
      this.filters.clearAll();
    }
    this.search.setQuery(state.search);
    this._saveViewSnapshot();
  }

  dispose(): void {
    this.columns.dispose();
    this.filters.dispose();
    this.sorts.dispose();
    this.search.dispose();
    this.viewBadge.dispose();
    this.selection.exitSelectionMode();
    this.cellFSM.blur();
  }

  private _handleColumnsChange(): void {
    this._callbacks.onColumnsChange?.();
    this._checkViewChanges();
  }

  private _handleFilterChange(): void {
    this._checkViewChanges();
  }

  private _handleSortChange(): void {
    const viewSorts = this.sorts.serializeToViewSorts();
    this._callbacks.onSort?.(viewSorts);
    this._checkViewChanges();
  }

  private _handleSearch(query: string): void {
    this._callbacks.onSearch?.(query);
    this._checkViewChanges();
  }

  private _saveViewSnapshot(): void {
    this.viewBadge.saveSnapshot(this.getViewState());
  }

  private _checkViewChanges(): void {
    this.viewBadge.checkForChanges(this.getViewState());
  }
}
