import { makeAutoObservable, runInAction } from 'mobx';
import type { SchemaNode, SchemaModel } from '@revisium/schema-toolkit';

export class NodeFormula {
  private _inputValue: string | null = null;
  private _inputError: string | null = null;

  constructor(
    private readonly _node: SchemaNode,
    private readonly _schemaModel: SchemaModel,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public get hasFormula(): boolean {
    return this._node.hasFormula();
  }

  public get rawExpression(): string {
    const formula = this._node.formula();
    return formula?.expression() ?? '';
  }

  public get formula(): string {
    if (!this.hasFormula) {
      return '';
    }
    const serialized = this._schemaModel.serializeFormula(this._node.id());
    if (serialized) {
      return serialized;
    }
    return this.rawExpression;
  }

  public get inputValue(): string | null {
    return this._inputValue;
  }

  public get inputError(): string | null {
    return this._inputError;
  }

  public get schemaError(): string | undefined {
    const errors = this._schemaModel.formulaErrors;
    const error = errors.find((e) => e.nodeId === this._node.id());
    return error?.message;
  }

  public get hasError(): boolean {
    return this._inputError !== null || this.schemaError !== undefined;
  }

  public get errorMessage(): string | undefined {
    return this._inputError ?? this.schemaError;
  }

  public setInputValue(value: string): void {
    this._inputValue = value;
    this._inputError = null;
  }

  public clearInput(): void {
    this._inputValue = null;
    this._inputError = null;
  }

  public applyFormula(): boolean {
    if (this._inputValue === null) {
      return true;
    }

    const trimmed = this._inputValue.trim();

    try {
      this._schemaModel.updateFormula(this._node.id(), trimmed || undefined);
      this.clearInput();
      return true;
    } catch (error) {
      runInAction(() => {
        this._inputError =
          error instanceof Error ? error.message : 'Invalid formula';
      });
      return false;
    }
  }
}
