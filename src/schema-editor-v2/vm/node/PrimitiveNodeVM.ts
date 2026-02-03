import { makeObservable, observable, computed, action, override } from 'mobx';
import type { SchemaNode } from '@revisium/schema-toolkit';
import { BaseNodeVM } from './BaseNodeVM';
import { registerVMClass } from '../createNodeVM';
import type { SchemaEditorVM } from '../SchemaEditorVM';
import type { ObjectNodeVM } from './ObjectNodeVM';

type PrimitiveValue = string | number | boolean | undefined;

export class PrimitiveNodeVM extends BaseNodeVM {
  public formulaInputValue: string | null = null;
  public formulaErrorValue: string | null = null;

  constructor(
    node: SchemaNode,
    editor: SchemaEditorVM,
    private readonly _parent: ObjectNodeVM | null,
    isRoot: boolean = false,
    isReadonly: boolean = false,
  ) {
    super(node, editor, isRoot, isReadonly);

    makeObservable(this, {
      formulaInputValue: observable,
      formulaErrorValue: observable,
      hasFormula: override,
      formula: override,
      defaultValue: override,
      defaultValueAsString: override,
      formulaError: computed,
      formulaDependents: override,
      canDelete: override,
      deleteBlockedReason: override,
      setFormula: override,
      setDefault: override,
      removeSelf: action.bound,
      changeType: action.bound,
    });
  }

  public get hasFormula(): boolean {
    return this._node.hasFormula();
  }

  public get formula(): string {
    if (this.formulaInputValue !== null) {
      return this.formulaInputValue;
    }
    return this._editor.schemaModel.serializeFormula(this.nodeId);
  }

  public get defaultValue(): PrimitiveValue {
    return this._node.defaultValue() as PrimitiveValue;
  }

  public get defaultValueAsString(): string {
    const value = this.defaultValue;
    if (value === undefined) {
      return '';
    }
    return String(value);
  }

  public get formulaError(): string | null {
    if (this.formulaErrorValue) {
      return this.formulaErrorValue;
    }
    const errors = this._editor.schemaModel.formulaErrors;
    const error = errors.find((e) => e.nodeId === this.nodeId);
    return error?.message ?? null;
  }

  public override get hasError(): boolean {
    return this.validationError !== null || this.formulaError !== null;
  }

  public override get errorMessage(): string | null {
    return this.validationError ?? this.formulaError ?? null;
  }

  public get formulaDependents(): readonly string[] {
    return this._editor.schemaModel.getFormulaDependents(this.nodeId);
  }

  public get canDelete(): boolean {
    return this._parent !== null && this.formulaDependents.length === 0;
  }

  public get deleteBlockedReason(): string | null {
    const dependents = this.formulaDependents;
    if (dependents.length === 0) {
      return null;
    }
    return `Used by formulas: ${dependents.join(', ')}`;
  }

  public setFormula(expression: string): void {
    this.formulaInputValue = expression || null;
    try {
      this._editor.schemaModel.updateFormula(
        this.nodeId,
        expression || undefined,
      );
      this.formulaErrorValue = null;
    } catch (error) {
      this.formulaErrorValue =
        error instanceof Error ? error.message : 'Invalid formula';
    }
  }

  public setDefault(valueStr: string): void {
    const value = this.parseDefaultValue(valueStr);
    this._editor.schemaModel.updateDefaultValue(this.nodeId, value);
  }

  private parseDefaultValue(valueStr: string): PrimitiveValue {
    const nodeType = this._node.nodeType();
    if (nodeType === 'number') {
      return valueStr ? Number(valueStr) : 0;
    }
    if (nodeType === 'boolean') {
      return valueStr === 'true';
    }
    return valueStr;
  }

  public removeSelf(): void {
    if (this._parent) {
      this._parent.removeProperty(this);
    }
  }

  public changeType(typeId: string): void {
    if (this._isRoot) {
      this._editor.changeRootType(typeId);
    } else if (this._parent) {
      this._parent.replaceProperty(this, typeId);
    }
  }
}

registerVMClass('PrimitiveNodeVM', PrimitiveNodeVM);
