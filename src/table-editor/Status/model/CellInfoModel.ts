import { makeAutoObservable } from 'mobx';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import type { CellFSM } from '../../Table/model/CellFSM.js';

export class CellInfoModel {
  private readonly _cellFSM: CellFSM;
  private readonly _columnsModel: ColumnsModel;

  constructor(cellFSM: CellFSM, columnsModel: ColumnsModel) {
    this._cellFSM = cellFSM;
    this._columnsModel = columnsModel;
    makeAutoObservable(this, {}, { autoBind: true });
  }

  private get _focusedColumn(): ColumnSpec | null {
    const focused = this._cellFSM.focusedCell;
    if (!focused) {
      return null;
    }
    return (
      this._columnsModel.allColumns.find((c) => c.field === focused.field) ??
      null
    );
  }

  get isVisible(): boolean {
    return this._focusedColumn !== null && !this._cellFSM.hasSelection;
  }

  get fieldLabel(): string {
    return this._focusedColumn?.label ?? '';
  }

  get formulaExpression(): string | undefined {
    return this._focusedColumn?.formulaExpression;
  }

  get foreignKeyTableId(): string | undefined {
    return this._focusedColumn?.foreignKeyTableId;
  }
}
