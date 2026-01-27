import { makeAutoObservable } from 'mobx';
import type { SchemaNode } from './SchemaNode';
import { NodeType } from './NodeType';
import type { NodeMetadata } from './NodeMetadata';
import { EMPTY_METADATA } from './NodeMetadata';
import { NULL_NODE } from './NullNode';

export class ObjectNode implements SchemaNode {
  private _name: string;
  private _children: SchemaNode[];
  private _metadata: NodeMetadata;

  constructor(
    private readonly _id: string,
    name: string,
    children: SchemaNode[] = [],
    metadata: NodeMetadata = EMPTY_METADATA,
  ) {
    if (!_id) {
      throw new Error('ObjectNode requires nodeId');
    }
    this._name = name;
    this._children = children;
    this._metadata = metadata;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  id(): string {
    return this._id;
  }

  name(): string {
    return this._name;
  }

  nodeType(): NodeType {
    return NodeType.Object;
  }

  metadata(): NodeMetadata {
    return this._metadata;
  }

  child(name: string): SchemaNode {
    for (const prop of this._children) {
      if (prop.name() === name) {
        return prop;
      }
    }
    return NULL_NODE;
  }

  items(): SchemaNode {
    return NULL_NODE;
  }

  children(): readonly SchemaNode[] {
    return this._children;
  }

  isObject(): boolean {
    return true;
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
    return false;
  }

  ref(): string {
    throw new Error('ObjectNode has no ref');
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

  setName(name: string): void {
    this._name = name;
  }

  setMetadata(meta: NodeMetadata): void {
    this._metadata = meta;
  }

  addChild(node: SchemaNode): void {
    this._children.push(node);
  }

  removeChild(name: string): void {
    const index = this._children.findIndex((c) => c.name() === name);
    if (index >= 0) {
      this._children.splice(index, 1);
    }
  }

  removeChildById(id: string): void {
    const index = this._children.findIndex((c) => c.id() === id);
    if (index >= 0) {
      this._children.splice(index, 1);
    }
  }

  replaceChild(name: string, node: SchemaNode): void {
    const index = this._children.findIndex((c) => c.name() === name);
    if (index >= 0) {
      this._children[index] = node;
    }
  }

  setItems(): void {
    // No-op for ObjectNode
  }

  setFormula(): void {
    // No-op for ObjectNode
  }

  setDefaultValue(): void {
    // No-op for ObjectNode
  }

  setChildren(children: SchemaNode[]): void {
    this._children = children;
  }
}
