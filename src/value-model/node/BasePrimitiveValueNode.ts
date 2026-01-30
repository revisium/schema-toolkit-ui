import { makeObservable, observable, computed, action } from 'mobx';
import type {
  Diagnostic,
  FormulaDefinition,
  FormulaWarning,
  SchemaDefinition,
} from '../core/types';
import { BaseValueNode } from './BaseValueNode';
import type { PrimitiveValueNode } from './types';

export abstract class BasePrimitiveValueNode<
  T extends string | number | boolean,
>
  extends BaseValueNode
  implements PrimitiveValueNode
{
  protected _value: T;
  protected _baseValue: T;
  protected _formulaWarning: FormulaWarning | null = null;

  constructor(
    id: string | undefined,
    name: string,
    schema: SchemaDefinition,
    value: T | undefined,
    defaultValue: T,
  ) {
    super(id, name, schema);
    const initialValue = value ?? (schema.default as T) ?? defaultValue;
    this._value = initialValue;
    this._baseValue = initialValue;
  }

  protected initObservable(): void {
    makeObservable<
      BasePrimitiveValueNode<T>,
      '_value' | '_baseValue' | '_formulaWarning'
    >(this, {
      _value: observable,
      _baseValue: observable,
      _formulaWarning: observable,
      value: computed,
      baseValue: computed,
      isDirty: computed,
      errors: computed,
      warnings: computed,
      setValue: action,
      setFormulaWarning: action,
      commit: action,
      revert: action,
    });
  }

  get value(): T {
    return this._value;
  }

  set value(newValue: T) {
    this._value = newValue;
  }

  get baseValue(): T {
    return this._baseValue;
  }

  get isDirty(): boolean {
    return this._value !== this._baseValue;
  }

  abstract get defaultValue(): T;

  get formula(): FormulaDefinition | undefined {
    const xFormula = this.schema['x-formula'];
    if (xFormula) {
      return { expression: xFormula.expression, version: xFormula.version };
    }
    return undefined;
  }

  get formulaWarning(): FormulaWarning | null {
    return this._formulaWarning;
  }

  get isReadOnly(): boolean {
    return this.schema.readOnly === true || this.formula !== undefined;
  }

  getPlainValue(): T {
    return this._value;
  }

  setValue(value: unknown, options?: { internal?: boolean }): void {
    if (this.isReadOnly && !options?.internal) {
      throw new Error(`Cannot set value on read-only field: ${this.name}`);
    }
    this._value = this.coerceValue(value);
  }

  protected abstract coerceValue(value: unknown): T;

  setFormulaWarning(warning: FormulaWarning | null): void {
    this._formulaWarning = warning;
  }

  commit(): void {
    this._baseValue = this._value;
  }

  revert(): void {
    this._value = this._baseValue;
  }

  override isPrimitive(): this is PrimitiveValueNode {
    return true;
  }

  override get errors(): readonly Diagnostic[] {
    return this.computeErrors();
  }

  protected computeErrors(): readonly Diagnostic[] {
    return [];
  }

  override get warnings(): readonly Diagnostic[] {
    if (!this._formulaWarning) {
      return [];
    }

    return [
      {
        severity: 'warning',
        type: this._formulaWarning.type,
        message: this._formulaWarning.message,
        path: this.name,
        params: {
          expression: this._formulaWarning.expression,
          computedValue: this._formulaWarning.computedValue,
        },
      },
    ];
  }
}
