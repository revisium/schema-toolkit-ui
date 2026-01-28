import { makeAutoObservable } from 'mobx';
import type { SchemaNode } from './SchemaNode';
import { NodeType } from './NodeType';
import type { NodeMetadata } from './NodeMetadata';
import { EMPTY_METADATA } from './NodeMetadata';
import { NULL_NODE } from './NullNode';

export class RefNode implements SchemaNode {
  private _name: string;
  private _ref: string;
  private _metadata: NodeMetadata;

  constructor(
    private readonly _id: string,
    name: string,
    ref: string,
    metadata: NodeMetadata = EMPTY_METADATA,
  ) {
    if (!_id) {
      throw new Error('RefNode requires nodeId');
    }
    if (!ref) {
      throw new Error('RefNode requires ref');
    }
    this._name = name;
    this._ref = ref;
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
    return NodeType.Ref;
  }

  metadata(): NodeMetadata {
    return this._metadata;
  }

  ref(): string {
    return this._ref;
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

  property(): SchemaNode {
    return NULL_NODE;
  }

  items(): SchemaNode {
    return NULL_NODE;
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
    return true;
  }

  isNull(): boolean {
    return false;
  }

  setName(name: string): void {
    this._name = name;
  }

  setMetadata(meta: NodeMetadata): void {
    this._metadata = meta;
  }

  setRef(ref: string): void {
    this._ref = ref;
  }

  addProperty(): void {
    // No-op for RefNode
  }

  removeProperty(): void {
    // No-op for RefNode
  }

  removePropertyById(): void {
    // No-op for RefNode
  }

  replaceProperty(): void {
    // No-op for RefNode
  }

  setItems(): void {
    // No-op for RefNode
  }

  setFormula(): void {
    // No-op for RefNode
  }

  setDefaultValue(): void {
    // No-op for RefNode
  }

  clone(): RefNode {
    return new RefNode(this._id, this._name, this._ref, { ...this._metadata });
  }
}
