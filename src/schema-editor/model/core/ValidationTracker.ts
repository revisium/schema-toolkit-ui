import { makeAutoObservable } from 'mobx';
import type {
  TableModel,
  SchemaValidationError,
  TreeFormulaValidationError,
} from '@revisium/schema-toolkit';
import type { AccessorCache } from './AccessorCache';

export class ValidationTracker {
  constructor(
    private readonly _tableModel: TableModel,
    private readonly _accessorCache: AccessorCache,
    private readonly _getTableIdError: () => string | null,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get validationErrors(): readonly SchemaValidationError[] {
    return this._tableModel.schema.validationErrors;
  }

  public get formulaErrors(): TreeFormulaValidationError[] {
    const schemaErrors = this._tableModel.schema.formulaErrors;
    const inputErrors = this.collectFormulaInputErrors();
    return [...schemaErrors, ...inputErrors];
  }

  public get tableIdError(): string | null {
    return this._getTableIdError();
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

  public collectFormulaInputErrors(): TreeFormulaValidationError[] {
    const errors: TreeFormulaValidationError[] = [];
    for (const [nodeId, accessor] of this._accessorCache.entries()) {
      const error = accessor.formula.inputError;
      if (error) {
        errors.push({
          nodeId,
          fieldPath: accessor.label.name || undefined,
          message: error,
        });
      }
    }
    return errors;
  }
}
