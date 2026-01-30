import type { SchemaDefinition } from '../../core/types';
import type { SerializerRule } from '../types';

export class SchemaFormatRule implements SerializerRule {
  constructor(private readonly formatValue: string) {}

  matches(schema: SchemaDefinition): boolean {
    return schema.format === this.formatValue;
  }
}
