import type { NodeType } from './NodeType';
import type { NodeMetadata } from './NodeMetadata';
import type { Formula } from '../formula';

export interface SchemaNode {
  id(): string;
  name(): string;
  nodeType(): NodeType;
  metadata(): NodeMetadata;

  property(name: string): SchemaNode;
  items(): SchemaNode;
  properties(): readonly SchemaNode[];

  isObject(): boolean;
  isArray(): boolean;
  isPrimitive(): boolean;
  isRef(): boolean;
  isNull(): boolean;

  ref(): string;

  formula(): Formula | undefined;
  hasFormula(): boolean;
  defaultValue(): unknown;
  foreignKey(): string | undefined;
  contentMediaType?(): string | undefined;

  setName(name: string): void;
  setMetadata(meta: NodeMetadata): void;
  setFormula(formula: Formula | undefined): void;
  setDefaultValue(value: unknown): void;

  addProperty(node: SchemaNode): void;
  removeProperty(name: string): void;
  removePropertyById(id: string): void;
  replaceProperty(name: string, node: SchemaNode): void;
  setItems(node: SchemaNode): void;

  clone(): SchemaNode;
}
