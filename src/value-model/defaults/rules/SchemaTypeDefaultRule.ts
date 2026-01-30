import type { SchemaDefinition } from '../../core/types';
import type { DefaultValueRule } from '../types';

export class SchemaTypeDefaultRule implements DefaultValueRule {
  constructor(private readonly typeValue: string) {}

  matches(schema: SchemaDefinition): boolean {
    return schema.type === this.typeValue;
  }
}
