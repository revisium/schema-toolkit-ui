import type { SchemaDefinition } from '../core/types';
import type { ValueNode } from '../node/types';

export interface Serializer {
  serialize(node: ValueNode): unknown;
}

export type SerializerFactoryFn = (schema: SchemaDefinition) => Serializer;

export interface SerializerRule {
  matches(schema: SchemaDefinition): boolean;
}
