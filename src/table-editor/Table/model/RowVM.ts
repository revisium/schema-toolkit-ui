import { makeAutoObservable } from 'mobx';
import type { RowModel } from '@revisium/schema-toolkit';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type { CellFSM } from './CellFSM.js';
import type { SelectionModel } from './SelectionModel.js';
import { CellVM, type CellCommitCallback } from './CellVM.js';

export class RowVM {
  private readonly _rowModel: RowModel;
  private readonly _rowId: string;
  private readonly _cellFSM: CellFSM;
  private readonly _selection: SelectionModel;
  private readonly _onCellCommit: CellCommitCallback | null;
  private readonly _cellCache = new Map<string, CellVM>();

  constructor(
    rowModel: RowModel,
    rowId: string,
    cellFSM: CellFSM,
    selection: SelectionModel,
    onCellCommit?: CellCommitCallback,
  ) {
    this._rowModel = rowModel;
    this._rowId = rowId;
    this._cellFSM = cellFSM;
    this._selection = selection;
    this._onCellCommit = onCellCommit ?? null;
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
      this._cellFSM,
      this._onCellCommit ?? undefined,
    );
    this._cellCache.set(column.field, cell);
    return cell;
  }

  dispose(): void {
    this._cellCache.clear();
  }
}
