import { makeAutoObservable } from 'mobx';
import type { RowModel } from '@revisium/schema-toolkit';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type { InlineEditModel } from './InlineEditModel.js';
import type { SelectionModel } from './SelectionModel.js';
import { CellVM } from './CellVM.js';

export class RowVM {
  private readonly _rowModel: RowModel;
  private readonly _rowId: string;
  private readonly _inlineEdit: InlineEditModel;
  private readonly _selection: SelectionModel;
  private readonly _cellCache = new Map<string, CellVM>();

  constructor(
    rowModel: RowModel,
    rowId: string,
    inlineEdit: InlineEditModel,
    selection: SelectionModel,
  ) {
    this._rowModel = rowModel;
    this._rowId = rowId;
    this._inlineEdit = inlineEdit;
    this._selection = selection;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get rowId(): string {
    return this._rowId;
  }

  get rowModel(): RowModel {
    return this._rowModel;
  }

  get isSelected(): boolean {
    return this._selection.isSelected(this._rowId);
  }

  toggleSelection(): void {
    this._selection.toggle(this._rowId);
  }

  getCellVM(column: ColumnSpec): CellVM {
    const cached = this._cellCache.get(column.field);
    if (cached) {
      return cached;
    }
    const cell = new CellVM(
      this._rowModel,
      column,
      this._rowId,
      this._inlineEdit,
    );
    this._cellCache.set(column.field, cell);
    return cell;
  }

  dispose(): void {
    this._cellCache.clear();
  }
}
