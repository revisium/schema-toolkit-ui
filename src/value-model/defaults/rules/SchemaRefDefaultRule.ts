import type { SchemaDefinition } from '../../core/types';
import type { DefaultValueRule } from '../types';

export class SchemaRefDefaultRule implements DefaultValueRule {
  constructor(private readonly refValue: string) {}

  matches(schema: SchemaDefinition): boolean {
    return schema.$ref === this.refValue;
  }
}
