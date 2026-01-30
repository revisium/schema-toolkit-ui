import type { SchemaDefinition } from '../../core/types';
import type { SerializerRule } from '../types';

export class SchemaRefRule implements SerializerRule {
  constructor(private readonly refValue: string) {}

  matches(schema: SchemaDefinition): boolean {
    return schema.$ref === this.refValue;
  }
}
