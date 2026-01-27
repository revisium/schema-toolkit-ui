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

  child(): SchemaNode {
    return this;
  }

  items(): SchemaNode {
    return this;
  }

  children(): readonly SchemaNode[] {
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

  addChild(): void {
    throw new Error('Cannot modify null node');
  }

  removeChild(): void {
    throw new Error('Cannot modify null node');
  }

  removeChildById(): void {
    throw new Error('Cannot modify null node');
  }

  replaceChild(): void {
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
}

export const NULL_NODE: SchemaNode = new NullNodeImpl();
