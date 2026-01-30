import type { SchemaDefinition } from '../../core/types';
import type { ChangeHandlerRule } from '../types';

export class SchemaTypeRule implements ChangeHandlerRule {
  constructor(private readonly typeValue: string) {}

  matches(schema: SchemaDefinition): boolean {
    return schema.type === this.typeValue;
  }
}
