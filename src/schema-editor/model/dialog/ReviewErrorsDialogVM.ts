import { makeAutoObservable } from 'mobx';
import type {
  TableModel,
  SchemaValidationError,
  TreeFormulaValidationError,
} from '@revisium/schema-toolkit';

export class ReviewErrorsDialogVM {
  constructor(
    private readonly _tableModel: TableModel,
    private readonly _getTableIdError: () => string | null,
    private readonly _getFormulaInputErrors: () => TreeFormulaValidationError[],
    private readonly _onRevert?: () => void,
    private readonly _onClose?: () => void,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get canRevert(): boolean {
    return this._onRevert !== undefined;
  }

  public revert(): void {
    this._onRevert?.();
    this._onClose?.();
  }

  public get tableId(): string {
    return this._tableModel.tableId;
  }

  public get tableIdError(): string | null {
    return this._getTableIdError();
  }

  public get validationErrors(): readonly SchemaValidationError[] {
    return this._tableModel.schema.validationErrors;
  }

  public get formulaErrors(): TreeFormulaValidationError[] {
    const schemaErrors = this._tableModel.schema.formulaErrors;
    const inputErrors = this._getFormulaInputErrors();
    return [...schemaErrors, ...inputErrors];
  }

  public get hasErrors(): boolean {
    return (
      this.validationErrors.length > 0 ||
      this.formulaErrors.length > 0 ||
      this.tableIdError !== null
    );
  }

  public get errorsCount(): number {
    let count = this.validationErrors.length + this.formulaErrors.length;
    if (this.tableIdError !== null) {
      count += 1;
    }
    return count;
  }
}
