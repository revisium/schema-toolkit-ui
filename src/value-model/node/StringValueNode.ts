import type { Diagnostic, SchemaDefinition } from '../core/types';
import { ValueType } from '../core/types';
import { BasePrimitiveValueNode } from './BasePrimitiveValueNode';

export class StringValueNode extends BasePrimitiveValueNode<string> {
  readonly type = ValueType.String;

  constructor(
    id: string | undefined,
    name: string,
    schema: SchemaDefinition,
    value?: string,
  ) {
    super(id, name, schema, value, '');
    this.initObservable();
  }

  get defaultValue(): string {
    return (this.schema.default as string) ?? '';
  }

  protected coerceValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return '';
    }
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(value);
  }

  protected override computeErrors(): readonly Diagnostic[] {
    const errors: Diagnostic[] = [];

    if (this.schema.required && this._value === '') {
      errors.push({
        severity: 'error',
        type: 'required',
        message: 'Field is required',
        path: this.name,
      });
    }

    const foreignKey = this.schema.foreignKey;
    if (foreignKey && this._value === '') {
      errors.push({
        severity: 'error',
        type: 'foreignKey',
        message: `Reference to ${foreignKey} is required`,
        path: this.name,
        params: { table: foreignKey },
      });
    }

    const minLength = this.schema.minLength;
    if (
      minLength !== undefined &&
      this._value.length > 0 &&
      this._value.length < minLength
    ) {
      errors.push({
        severity: 'error',
        type: 'minLength',
        message: `Minimum length is ${minLength}`,
        path: this.name,
        params: { min: minLength, actual: this._value.length },
      });
    }

    const maxLength = this.schema.maxLength;
    if (maxLength !== undefined && this._value.length > maxLength) {
      errors.push({
        severity: 'error',
        type: 'maxLength',
        message: `Maximum length is ${maxLength}`,
        path: this.name,
        params: { max: maxLength, actual: this._value.length },
      });
    }

    const pattern = this.schema.pattern;
    if (
      pattern &&
      this._value.length > 0 &&
      !new RegExp(pattern).test(this._value)
    ) {
      errors.push({
        severity: 'error',
        type: 'pattern',
        message: 'Value does not match pattern',
        path: this.name,
        params: { pattern },
      });
    }

    const enumValues = this.schema.enum;
    if (
      enumValues &&
      enumValues.length > 0 &&
      !enumValues.includes(this._value)
    ) {
      errors.push({
        severity: 'error',
        type: 'enum',
        message: 'Value is not in allowed list',
        path: this.name,
        params: { allowed: enumValues, actual: this._value },
      });
    }

    return errors;
  }
}
