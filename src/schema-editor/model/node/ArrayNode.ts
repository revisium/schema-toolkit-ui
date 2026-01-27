import { makeAutoObservable } from 'mobx';
import type { SchemaNode } from './SchemaNode';
import { NodeType } from './NodeType';
import type { NodeMetadata } from './NodeMetadata';
import { EMPTY_METADATA } from './NodeMetadata';
import { NULL_NODE } from './NullNode';

export class ArrayNode implements SchemaNode {
  private _name: string;
  private _items: SchemaNode;
  private _metadata: NodeMetadata;

  constructor(
    private readonly _id: string,
    name: string,
    items: SchemaNode,
    metadata: NodeMetadata = EMPTY_METADATA,
  ) {
    if (!_id) {
      throw new Error('ArrayNode requires nodeId');
    }
    this._name = name;
    this._items = items;
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
    return NodeType.Array;
  }

  metadata(): NodeMetadata {
    return this._metadata;
  }

  property(): SchemaNode {
    return NULL_NODE;
  }

  items(): SchemaNode {
    return this._items;
  }

  properties(): readonly SchemaNode[] {
    return [this._items];
  }

  isObject(): boolean {
    return false;
  }

  isArray(): boolean {
    return true;
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
    throw new Error('ArrayNode has no ref');
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

  addProperty(): void {
    // No-op for ArrayNode
  }

  removeProperty(): void {
    // No-op for ArrayNode
  }

  removePropertyById(): void {
    // No-op for ArrayNode
  }

  replaceProperty(): void {
    // No-op for ArrayNode
  }

  setItems(node: SchemaNode): void {
    this._items = node;
  }

  setFormula(): void {
    // No-op for ArrayNode
  }

  setDefaultValue(): void {
    // No-op for ArrayNode
  }
}
