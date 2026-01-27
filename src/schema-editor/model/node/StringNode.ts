import { makeAutoObservable } from 'mobx';
import type { SchemaNode } from './SchemaNode';
import { NodeType } from './NodeType';
import type { NodeMetadata } from './NodeMetadata';
import { EMPTY_METADATA } from './NodeMetadata';
import { NULL_NODE } from './NullNode';
import type { Formula } from '../formula/Formula';

export type StringFormat = 'date-time' | 'date' | 'time' | 'email' | 'regex';

export type ContentMediaType =
  | 'text/plain'
  | 'text/markdown'
  | 'text/html'
  | 'application/json'
  | 'application/schema+json'
  | 'application/yaml';

export interface StringNodeOptions {
  defaultValue?: string;
  foreignKey?: string;
  format?: StringFormat;
  contentMediaType?: ContentMediaType;
  enumValues?: string[];
  formula?: Formula;
}

export class StringNode implements SchemaNode {
  private _name: string;
  private _metadata: NodeMetadata;
  private _defaultValue: string | undefined;
  private _foreignKey: string | undefined;
  private _format: StringFormat | undefined;
  private _contentMediaType: ContentMediaType | undefined;
  private _enumValues: string[] | undefined;
  private _formula: Formula | undefined;

  constructor(
    private readonly _id: string,
    name: string,
    options: StringNodeOptions = {},
    metadata: NodeMetadata = EMPTY_METADATA,
  ) {
    if (!_id) {
      throw new Error('StringNode requires nodeId');
    }
    this._name = name;
    this._metadata = metadata;
    this._defaultValue = options.defaultValue;
    this._foreignKey = options.foreignKey;
    this._format = options.format;
    this._contentMediaType = options.contentMediaType;
    this._enumValues = options.enumValues;
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
    return NodeType.String;
  }

  metadata(): NodeMetadata {
    return this._metadata;
  }

  defaultValue(): string | undefined {
    return this._defaultValue;
  }

  foreignKey(): string | undefined {
    return this._foreignKey;
  }

  format(): StringFormat | undefined {
    return this._format;
  }

  contentMediaType(): ContentMediaType | undefined {
    return this._contentMediaType;
  }

  enumValues(): string[] | undefined {
    return this._enumValues;
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
    throw new Error('StringNode has no ref');
  }

  setName(name: string): void {
    this._name = name;
  }

  setMetadata(meta: NodeMetadata): void {
    this._metadata = meta;
  }

  setDefaultValue(value: string | undefined): void {
    this._defaultValue = value;
  }

  setForeignKey(value: string | undefined): void {
    this._foreignKey = value;
  }

  setFormat(value: StringFormat | undefined): void {
    this._format = value;
  }

  setContentMediaType(value: ContentMediaType | undefined): void {
    this._contentMediaType = value;
  }

  setEnumValues(values: string[] | undefined): void {
    this._enumValues = values;
  }

  setFormula(formula: Formula | undefined): void {
    this._formula = formula;
  }

  addProperty(): void {
    // No-op for StringNode
  }

  removeProperty(): void {
    // No-op for StringNode
  }

  removePropertyById(): void {
    // No-op for StringNode
  }

  replaceProperty(): void {
    // No-op for StringNode
  }

  setItems(): void {
    // No-op for StringNode
  }
}
