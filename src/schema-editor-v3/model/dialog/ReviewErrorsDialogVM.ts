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
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
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
