import { makeAutoObservable, runInAction } from 'mobx';
import { createTableModel } from '@revisium/schema-toolkit';
import { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { ViewColumn } from '../../Columns/model/types.js';
import { FilterModel } from '../../Filters/model/FilterModel.js';
import { SearchModel } from '../../Search/model/SearchModel.js';
import { SortModel } from '../../Sortings/model/SortModel.js';
import { CellInfoModel } from '../../Status/model/CellInfoModel.js';
import { RowCountModel } from '../../Status/model/RowCountModel.js';
import { ViewSettingsBadgeModel } from '../../Status/model/ViewSettingsBadgeModel.js';
import { CellFSM } from '../../Table/model/CellFSM.js';
import { RowVM } from '../../Table/model/RowVM.js';
import { SelectionModel } from '../../Table/model/SelectionModel.js';
import type { SearchForeignKeySearchFn } from '../../../search-foreign-key/vm/SearchForeignKeyVM.js';
import type {
  ITableDataSource,
  RowDataItem,
  TableQuery,
} from './ITableDataSource.js';
import { SchemaContext, stripDataFieldPrefix } from './SchemaContext.js';

export interface ViewState {
  columns: ViewColumn[];
  filters: string | null;
  sorts: Array<{ field: string; direction: string }>;
  search: string;
}

export interface TableEditorBreadcrumb {
  label: string;
  dataTestId?: string;
}

export interface UploadFileParams {
  rowId: string;
  fileId: string;
  file: File;
}

export interface TableEditorCallbacks {
  onBreadcrumbClick?: (segment: TableEditorBreadcrumb, index: number) => void;
  onCreateRow?: () => void;
  onOpenRow?: (rowId: string) => void;
  onPickRow?: (rowId: string) => void;
  onDuplicateRow?: (rowId: string) => void;
  onSearchForeignKey?: SearchForeignKeySearchFn;
  onCopyPath?: (path: string) => void;
  onUploadFile?: (
    params: UploadFileParams,
  ) => Promise<Record<string, unknown> | null>;
  onOpenFile?: (url: string) => void;
  onReadonlyEditAttempt?: () => void;
}

export interface TableEditorOptions {
  tableId: string;
  pageSize?: number;
  readonly?: boolean;
  breadcrumbs?: TableEditorBreadcrumb[];
  callbacks?: TableEditorCallbacks;
}

const DEFAULT_PAGE_SIZE = 50;

export class TableEditorCore {
  public readonly columns: ColumnsModel;
  public readonly filters: FilterModel;
  public readonly sorts: SortModel;
  public readonly search: SearchModel;
  public readonly viewBadge: ViewSettingsBadgeModel;
  public readonly cellFSM: CellFSM;
  public readonly selection: SelectionModel;
  public readonly rowCount: RowCountModel;
  public readonly cellInfo: CellInfoModel;

  private readonly _dataSource: ITableDataSource;
  private readonly _pageSize: number;
  private readonly _breadcrumbs: TableEditorBreadcrumb[];
  private readonly _callbacks: TableEditorCallbacks;

  private readonly _tableId: string;
  private readonly _schemaContext = new SchemaContext();
  private _readonly = false;
  private _rows: RowVM[] = [];
  private _isBootstrapping = true;
  private _isLoadingMore = false;
  private _hasNextPage = false;
  private _endCursor: string | null = null;
  private _savedViewState: ViewState | null = null;

  constructor(dataSource: ITableDataSource, options: TableEditorOptions) {
    this._dataSource = dataSource;
    this._tableId = options.tableId;
    this._pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
    this._readonly = options.readonly ?? false;
    this._breadcrumbs = options.breadcrumbs ?? [];
    this._callbacks = options.callbacks ?? {};

    this.columns = new ColumnsModel();
    this.filters = new FilterModel();
    this.sorts = new SortModel();
    this.search = new SearchModel((query) => this._handleSearch(query));
    this.viewBadge = new ViewSettingsBadgeModel();
    this.cellFSM = new CellFSM();
    this.selection = new SelectionModel();
    this.rowCount = new RowCountModel();
    this.cellInfo = new CellInfoModel(this.cellFSM, this.columns);

    this.columns.setOnChange(() => this._handleColumnsChange());
    this.filters.setOnChange(() => this._handleFilterChange());
    this.filters.setOnApply((_where) => this._handleFilterApply());
    this.sorts.setOnChange(() => this._handleSortChange());
    this.sorts.setOnApply((_sorts) => this._handleSortApply());
    this.viewBadge.setOnSave(() => this._handleViewSave());
    this.viewBadge.setOnRevert(() => this._handleViewRevert());
    this.cellFSM.setOnReadonlyEditAttempt(
      this._callbacks.onReadonlyEditAttempt ?? null,
    );

    makeAutoObservable(this, {}, { autoBind: true });

    queueMicrotask(() => void this._bootstrap());
  }

  get rows(): RowVM[] {
    return this._rows;
  }

  get isBootstrapping(): boolean {
    return this._isBootstrapping;
  }

  get isLoadingMore(): boolean {
    return this._isLoadingMore;
  }

  get readonly(): boolean {
    return this._readonly;
  }

  get tableId(): string {
    return this._tableId;
  }

  get breadcrumbs(): TableEditorBreadcrumb[] {
    return this._breadcrumbs;
  }

  get callbacks(): TableEditorCallbacks {
    return this._callbacks;
  }

  getViewState(): ViewState {
    return {
      columns: this.columns.serializeToViewColumns(),
      filters: null,
      sorts: this.sorts.serializeToViewSorts(),
      search: '',
    };
  }

  applyViewState(state: ViewState): void {
    this.columns.applyViewColumns(state.columns);
    this.sorts.applyViewSorts(state.sorts);
  }

  async loadMore(): Promise<void> {
    if (!this._hasNextPage || this._isLoadingMore) {
      return;
    }
    this._isLoadingMore = true;
    try {
      const query = this._buildQuery(this._endCursor);
      const result = await this._dataSource.fetchRows(query);
      runInAction(() => {
        this._appendRowVMs(result.rows);
        this._endCursor = result.endCursor;
        this._hasNextPage = result.hasNextPage;
        this._isLoadingMore = false;
      });
    } catch {
      runInAction(() => {
        this._isLoadingMore = false;
      });
    }
  }

  async deleteRows(rowIds: string[]): Promise<void> {
    const result = await this._dataSource.deleteRows(rowIds);
    if (result.ok) {
      runInAction(() => {
        const idSet = new Set(rowIds);
        this._rows = this._rows.filter((r) => !idSet.has(r.rowId));
        this.rowCount.decrementBaseTotalCount(rowIds.length);
        this.selection.exitSelectionMode();
        this._updateNavigationContext();
      });
    }
  }

  dispose(): void {
    this.columns.dispose();
    this.filters.dispose();
    this.sorts.dispose();
    this.search.dispose();
    this.viewBadge.dispose();
    this.selection.exitSelectionMode();
    this.cellFSM.blur();
    for (const row of this._rows) {
      row.dispose();
    }
  }

  private async _bootstrap(): Promise<void> {
    try {
      const meta = await this._dataSource.fetchMetadata();
      runInAction(() => {
        this._schemaContext.init(meta.dataSchema, meta.refSchemas);
        this._readonly = this._readonly || meta.readonly;
        this.viewBadge.setCanSave(!this._readonly);
      });

      this.columns.init(this._schemaContext.allColumns);
      this.sorts.init(this._schemaContext.sortableFields);
      this.filters.init(this._schemaContext.filterableFields);

      if (meta.viewState) {
        this.applyViewState(meta.viewState);
      }
      this._saveViewSnapshot();

      await this._loadRows();

      runInAction(() => {
        this._isBootstrapping = false;
      });
    } catch {
      runInAction(() => {
        this._isBootstrapping = false;
      });
    }
  }

  private _buildQuery(after: string | null = null): TableQuery {
    return {
      where: this.filters.hasActiveFilters
        ? this.filters.buildCurrentWhereClause()
        : null,
      orderBy: this.sorts.serializeToViewSorts().map((s) => ({
        field: stripDataFieldPrefix(s.field),
        direction: s.direction,
      })),
      search: this.search.debouncedQuery,
      first: this._pageSize,
      after,
    };
  }

  private async _loadRows(): Promise<void> {
    const query = this._buildQuery();
    const result = await this._dataSource.fetchRows(query);
    runInAction(() => {
      this._replaceRowVMs(result.rows);
      this._endCursor = result.endCursor;
      this._hasNextPage = result.hasNextPage;
      this.rowCount.setTotalCount(result.totalCount);
      this.rowCount.setBaseTotalCount(result.totalCount);
      this.rowCount.setIsFiltering(
        this.filters.hasActiveFilters || this.search.hasActiveSearch,
      );
      this._updateNavigationContext();
    });
  }

  private async _reloadRows(): Promise<void> {
    if (this._isBootstrapping) {
      return;
    }
    this.selection.exitSelectionMode();
    this.cellFSM.blur();
    await this._loadRows();
  }

  private _replaceRowVMs(rawRows: RowDataItem[]): void {
    for (const row of this._rows) {
      row.dispose();
    }
    this._rows = this._createRowVMs(rawRows);
  }

  private _appendRowVMs(rawRows: RowDataItem[]): void {
    const newVMs = this._createRowVMs(rawRows);
    this._rows = [...this._rows, ...newVMs];
    this._updateNavigationContext();
  }

  private _createRowVMs(rawRows: RowDataItem[]): RowVM[] {
    const wrappedSchema = this._schemaContext.wrappedDataSchema;
    if (!wrappedSchema) {
      return [];
    }
    const tableModel = createTableModel({
      tableId: this._tableId,
      schema: wrappedSchema,
      rows: rawRows.map((r) => ({ rowId: r.rowId, data: { data: r.data } })),
      refSchemas: this._schemaContext.fullRefSchemas,
    });
    const systemValuesMap = new Map<string, Record<string, unknown>>();
    for (const raw of rawRows) {
      systemValuesMap.set(raw.rowId, this._buildSystemValues(raw));
    }
    return tableModel.rows.map(
      (rowModel) =>
        new RowVM(
          rowModel,
          rowModel.rowId,
          this.cellFSM,
          this.selection,
          (rowId, field, value, previousValue) =>
            this._commitCell(rowId, field, value, previousValue),
          systemValuesMap.get(rowModel.rowId),
          this._readonly,
        ),
    );
  }

  private _buildSystemValues(rawRow: RowDataItem): Record<string, unknown> {
    return {
      ...rawRow.systemFields,
      id: rawRow.rowId,
    };
  }

  private _toPatchField(field: string): string {
    return stripDataFieldPrefix(field);
  }

  private async _commitCell(
    rowId: string,
    field: string,
    value: unknown,
    previousValue?: unknown,
  ): Promise<void> {
    const patchField = this._toPatchField(field);
    const results = await this._dataSource.patchCells([
      { rowId, field: patchField, value },
    ]);
    const result = results[0];
    if (result && !result.ok) {
      runInAction(() => {
        const row = this._rows.find((r) => r.rowId === rowId);
        if (row && previousValue !== undefined) {
          const node = row.rowModel.get(field);
          if (node?.isPrimitive()) {
            node.setValue(previousValue);
          } else if (node?.isObject()) {
            node.setValue(previousValue as Record<string, unknown>, {
              internal: true,
            });
          }
        }
      });
    }
  }

  private _updateNavigationContext(): void {
    this.cellFSM.setNavigationContext(
      this.columns.visibleColumns.map((c) => c.field),
      this._rows.map((r) => r.rowId),
    );
  }

  private _handleColumnsChange(): void {
    this.cellFSM.updateNavigationContext(
      this.columns.visibleColumns.map((c) => c.field),
      this.cellFSM.rowIds,
    );
    this._checkViewChanges();
  }

  private _handleFilterChange(): void {
    // filters are ephemeral — not persisted in view settings
  }

  private _handleFilterApply(): void {
    void this._reloadRows();
  }

  private _handleSortChange(): void {
    this._checkViewChanges();
  }

  private _handleSortApply(): void {
    void this._reloadRows();
    this._checkViewChanges();
  }

  private _handleSearch(_query: string): void {
    void this._reloadRows();
  }

  private async _handleViewSave(): Promise<void> {
    try {
      const viewState = this.getViewState();
      const result = await this._dataSource.saveView(viewState);
      if (result.ok) {
        this._saveViewSnapshot();
      }
    } catch {
      // network/data-source error — badge stays visible
    }
  }

  private _handleViewRevert(): void {
    if (this._savedViewState) {
      this.applyViewState(this._savedViewState);
      void this._reloadRows();
    }
  }

  private _saveViewSnapshot(): void {
    const viewState = this.getViewState();
    this._savedViewState = viewState;
    this.viewBadge.saveSnapshot(viewState);
  }

  private _checkViewChanges(): void {
    this.viewBadge.checkForChanges(this.getViewState());
  }
}
