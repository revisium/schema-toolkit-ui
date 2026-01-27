import { makeAutoObservable } from 'mobx';
import type { SchemaNode } from './SchemaNode';
import { NodeType } from './NodeType';
import type { NodeMetadata } from './NodeMetadata';
import { EMPTY_METADATA } from './NodeMetadata';
import { NULL_NODE } from './NullNode';
import type { Formula } from '../formula/Formula';

export interface BooleanNodeOptions {
  defaultValue?: boolean;
  formula?: Formula;
}

export class BooleanNode implements SchemaNode {
  private _name: string;
  private _metadata: NodeMetadata;
  private _defaultValue: boolean | undefined;
  private _formula: Formula | undefined;

  constructor(
    private readonly _id: string,
    name: string,
    options: BooleanNodeOptions = {},
    metadata: NodeMetadata = EMPTY_METADATA,
  ) {
    if (!_id) {
      throw new Error('BooleanNode requires nodeId');
    }
    this._name = name;
    this._metadata = metadata;
    this._defaultValue = options.defaultValue;
    this._formula = options.formula;

    makeAutoObservable(this, {}, { autoBind: true });
  }

  id(): string {
    return this._id;
  }

  name(): string {
    return this._name;
  }

  nodeType(): NodeType {
    return NodeType.Boolean;
  }

  metadata(): NodeMetadata {
    return this._metadata;
  }

  defaultValue(): boolean | undefined {
    return this._defaultValue;
  }

  formula(): Formula | undefined {
    return this._formula;
  }

  hasFormula(): boolean {
    return this._formula !== undefined;
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
    return true;
  }

  isRef(): boolean {
    return false;
  }

  isNull(): boolean {
    return false;
  }

  ref(): string {
    throw new Error('BooleanNode has no ref');
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

  setDefaultValue(value: boolean | undefined): void {
    this._defaultValue = value;
  }

  setFormula(formula: Formula | undefined): void {
    this._formula = formula;
  }

  addProperty(): void {
    // No-op for BooleanNode
  }

  removeProperty(): void {
    // No-op for BooleanNode
  }

  removePropertyById(): void {
    // No-op for BooleanNode
  }

  replaceProperty(): void {
    // No-op for BooleanNode
  }

  setItems(): void {
    // No-op for BooleanNode
  }
}
