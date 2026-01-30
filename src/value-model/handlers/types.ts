import type { SchemaDefinition } from '../core/types';
import type { ValueNode } from '../node/types';

export interface ChangeHandlerContext {
  readonly node: ValueNode;

  readonly path: string;

  readonly previousValue: unknown;

  readonly newValue: unknown;
}

export type ChangeHandlerFn = (context: ChangeHandlerContext) => void;

export type ChangeHandlerFactoryFn = (
  schema: SchemaDefinition,
) => ChangeHandlerFn;

export interface ChangeHandlerRule {
  matches(schema: SchemaDefinition): boolean;
}
