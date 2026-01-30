import type { Diagnostic, SchemaDefinition, ValueType } from '../core/types';
import type {
  ArrayValueNode,
  ObjectValueNode,
  PrimitiveValueNode,
  ValueNode,
} from './types';

let nodeIdCounter = 0;

export function generateNodeId(): string {
  return `node-${++nodeIdCounter}`;
}

export function resetNodeIdCounter(): void {
  nodeIdCounter = 0;
}

export abstract class BaseValueNode implements ValueNode {
  readonly id: string;
  abstract readonly type: ValueType;
  readonly schema: SchemaDefinition;

  private _parent: ValueNode | null = null;
  private readonly _name: string;

  constructor(id: string | undefined, name: string, schema: SchemaDefinition) {
    this.id = id ?? generateNodeId();
    this._name = name;
    this.schema = schema;
  }

  get parent(): ValueNode | null {
    return this._parent;
  }

  set parent(value: ValueNode | null) {
    this._parent = value;
  }

  get name(): string {
    return this._name;
  }

  abstract get value(): unknown;
  abstract getPlainValue(): unknown;

  isObject(): this is ObjectValueNode {
    return false;
  }

  isArray(): this is ArrayValueNode {
    return false;
  }

  isPrimitive(): this is PrimitiveValueNode {
    return false;
  }

  get errors(): readonly Diagnostic[] {
    return [];
  }

  get warnings(): readonly Diagnostic[] {
    return [];
  }

  get isValid(): boolean {
    return this.errors.length === 0;
  }

  get hasWarnings(): boolean {
    return this.warnings.length > 0;
  }
}
