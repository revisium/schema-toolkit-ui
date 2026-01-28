import type { SchemaNode } from './SchemaNode';
import type { NodeType } from './NodeType';
import type { NodeMetadata } from './NodeMetadata';
import { EMPTY_METADATA } from './NodeMetadata';

class NullNodeImpl implements SchemaNode {
  id(): string {
    return '';
  }

  name(): string {
    throw new Error('Null node has no name');
  }

  nodeType(): NodeType {
    throw new Error('Null node has no type');
  }

  metadata(): NodeMetadata {
    return EMPTY_METADATA;
  }

  property(): SchemaNode {
    return this;
  }

  items(): SchemaNode {
    return this;
  }

  properties(): readonly SchemaNode[] {
    return [];
  }

  isObject(): boolean {
    return false;
  }

  isArray(): boolean {
    return false;
  }

  isPrimitive(): boolean {
    return false;
  }

  isRef(): boolean {
    return false;
  }

  isNull(): boolean {
    return true;
  }

  ref(): string {
    throw new Error('Null node has no ref');
  }

  formula(): undefined {
    return undefined;
  }

  hasFormula(): boolean {
    return false;
  }

  defaultValue(): undefined {
    return undefined;
  }

  foreignKey(): undefined {
    return undefined;
  }

  setName(): void {
    throw new Error('Cannot modify null node');
  }

  setMetadata(): void {
    throw new Error('Cannot modify null node');
  }

  addProperty(): void {
    throw new Error('Cannot modify null node');
  }

  removeProperty(): void {
    throw new Error('Cannot modify null node');
  }

  removePropertyById(): void {
    throw new Error('Cannot modify null node');
  }

  replaceProperty(): void {
    throw new Error('Cannot modify null node');
  }

  setItems(): void {
    throw new Error('Cannot modify null node');
  }

  setFormula(): void {
    throw new Error('Cannot modify null node');
  }

  setDefaultValue(): void {
    throw new Error('Cannot modify null node');
  }

  clone(): SchemaNode {
    return this;
  }
}

export const NULL_NODE: SchemaNode = new NullNodeImpl();
