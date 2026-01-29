import { makeObservable, observable, computed, action, override } from 'mobx';
import {
  parseDefaultValue,
  FormulaSerializer,
  type SchemaNode,
  type FormulaDependent,
} from '../model';
import { BaseNodeVM } from './BaseNodeVM';
import { registerVMClass } from './createNodeVM';
import type { SchemaEditorVM } from './SchemaEditorVM';
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
  ) {
    super(node, editor, isRoot);

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
    const formula = this._node.formula();
    if (!formula) {
      return '';
    }
    return new FormulaSerializer(
      this._editor.engine.tree,
      this.nodeId,
      formula,
    ).serialize();
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
    const errors = this._editor.engine.validateFormulas();
    const error = errors.find((e) => e.nodeId === this.nodeId);
    return error?.message ?? null;
  }

  public override get hasError(): boolean {
    return this.validationError !== null || this.formulaError !== null;
  }

  public override get errorMessage(): string | null {
    return this.validationError ?? this.formulaError ?? null;
  }

  public get formulaDependents(): FormulaDependent[] {
    return this._editor.engine.getFormulaDependents(this.nodeId);
  }

  public get canDelete(): boolean {
    return this._parent !== null && this.formulaDependents.length === 0;
  }

  public get deleteBlockedReason(): string | null {
    const dependents = this.formulaDependents;
    if (dependents.length === 0) {
      return null;
    }
    const fieldNames = dependents.map((d) => d.fieldName).join(', ');
    return `Used by formulas: ${fieldNames}`;
  }

  public setFormula(expression: string): void {
    this.formulaInputValue = expression || null;
    const result = this._editor.engine.updateFormula(
      this.nodeId,
      expression || undefined,
    );
    if (result.success) {
      this.formulaErrorValue = null;
    } else if (result.error) {
      this.formulaErrorValue = result.error;
    }
  }

  public setDefault(valueStr: string): void {
    const value = parseDefaultValue(valueStr, this._node.nodeType());
    this._editor.engine.updateDefaultValue(this.nodeId, value);
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
