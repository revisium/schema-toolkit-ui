import type { Diagnostic, SchemaDefinition } from '../core/types';
import { ValueType } from '../core/types';
import { BasePrimitiveValueNode } from './BasePrimitiveValueNode';

export class NumberValueNode extends BasePrimitiveValueNode<number> {
  readonly type = ValueType.Number;

  constructor(
    id: string | undefined,
    name: string,
    schema: SchemaDefinition,
    value?: number,
  ) {
    super(id, name, schema, value, 0);
    this.initObservable();
  }

  get defaultValue(): number {
    return (this.schema.default as number) ?? 0;
  }

  protected coerceValue(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    return Number(value) || 0;
  }

  protected override computeErrors(): readonly Diagnostic[] {
    const errors: Diagnostic[] = [];

    const minimum = this.schema.minimum;
    if (minimum !== undefined && this._value < minimum) {
      errors.push({
        severity: 'error',
        type: 'min',
        message: `Value must be at least ${minimum}`,
        path: this.name,
        params: { min: minimum, actual: this._value },
      });
    }

    const maximum = this.schema.maximum;
    if (maximum !== undefined && this._value > maximum) {
      errors.push({
        severity: 'error',
        type: 'max',
        message: `Value must be at most ${maximum}`,
        path: this.name,
        params: { max: maximum, actual: this._value },
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
