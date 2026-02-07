import { makeAutoObservable } from 'mobx';
import type { SchemaNode, SchemaModel } from '@revisium/schema-toolkit';
import type { NodeFormula } from './NodeFormula';

export class NodeValidation {
  constructor(
    private readonly _node: SchemaNode,
    private readonly _schemaModel: SchemaModel,
    private readonly _formula: NodeFormula,
    private readonly _getTableIdError: () => string | null,
    private readonly _isRoot: boolean,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get schemaError(): string | undefined {
    const errors = this._schemaModel.validationErrors;
    const error = errors.find((e) => e.nodeId === this._node.id());
    return error?.message;
  }

  public get tableIdError(): string | null {
    if (this._isRoot) {
      return this._getTableIdError();
    }
    return null;
  }

  public get formulaError(): string | undefined {
    return this._formula.errorMessage;
  }

  public get hasError(): boolean {
    return (
      this.schemaError !== undefined ||
      this.tableIdError !== null ||
      this.formulaError !== undefined
    );
  }

  public get errorMessage(): string | undefined {
    return this.schemaError ?? this.tableIdError ?? this.formulaError;
  }
}
