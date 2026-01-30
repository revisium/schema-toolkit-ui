import type { SchemaDefinition } from '../core/types';

export type DefaultValueGeneratorFn = (schema: SchemaDefinition) => unknown;

export interface DefaultValueRule {
  matches(schema: SchemaDefinition): boolean;
}
