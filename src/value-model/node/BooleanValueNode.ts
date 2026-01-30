import type { SchemaDefinition } from '../core/types';
import { ValueType } from '../core/types';
import { BasePrimitiveValueNode } from './BasePrimitiveValueNode';

export class BooleanValueNode extends BasePrimitiveValueNode<boolean> {
  readonly type = ValueType.Boolean;

  constructor(
    id: string | undefined,
    name: string,
    schema: SchemaDefinition,
    value?: boolean,
  ) {
    super(id, name, schema, value, false);
    this.initObservable();
  }

  get defaultValue(): boolean {
    return (this.schema.default as boolean) ?? false;
  }

  protected coerceValue(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    return Boolean(value);
  }
}
