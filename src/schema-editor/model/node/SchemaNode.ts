import type { NodeType } from './NodeType';
import type { NodeMetadata } from './NodeMetadata';
import type { Formula } from '../formula/Formula';

export interface SchemaNode {
  id(): string;
  name(): string;
  nodeType(): NodeType;
  metadata(): NodeMetadata;

  child(name: string): SchemaNode;
  items(): SchemaNode;
  children(): readonly SchemaNode[];

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

  setName(name: string): void;
  setMetadata(meta: NodeMetadata): void;
  setFormula(formula: Formula | undefined): void;
  setDefaultValue(value: unknown): void;

  addChild(node: SchemaNode): void;
  removeChild(name: string): void;
  removeChildById(id: string): void;
  replaceChild(name: string, node: SchemaNode): void;
  setItems(node: SchemaNode): void;
}
