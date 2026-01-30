import type {
  Diagnostic,
  FormulaDefinition,
  FormulaWarning,
  SchemaDefinition,
  ValueType,
} from '../core/types';
import type { NodeFactory } from './NodeFactory';

export interface ValueNode {
  readonly id: string;
  readonly type: ValueType;
  readonly schema: SchemaDefinition;

  parent: ValueNode | null;
  readonly name: string;

  readonly value: unknown;
  getPlainValue(): unknown;

  isObject(): this is ObjectValueNode;
  isArray(): this is ArrayValueNode;
  isPrimitive(): this is PrimitiveValueNode;

  readonly errors: readonly Diagnostic[];
  readonly warnings: readonly Diagnostic[];
  readonly isValid: boolean;
  readonly hasWarnings: boolean;
}

export interface DirtyTrackable {
  readonly isDirty: boolean;
  commit(): void;
  revert(): void;
}

export interface PrimitiveValueNode extends ValueNode, DirtyTrackable {
  value: string | number | boolean;
  readonly baseValue: string | number | boolean;
  readonly defaultValue: unknown;
  readonly formula: FormulaDefinition | undefined;
  readonly formulaWarning: FormulaWarning | null;
  readonly isReadOnly: boolean;

  setValue(value: unknown, options?: { internal?: boolean }): void;
  setFormulaWarning(warning: FormulaWarning | null): void;
}

export interface ObjectValueNode extends ValueNode, DirtyTrackable {
  readonly value: Record<string, ValueNode>;
  readonly children: readonly ValueNode[];

  child(name: string): ValueNode | undefined;
  addChild(node: ValueNode): void;
  removeChild(name: string): void;
  hasChild(name: string): boolean;
}

export interface ArrayValueNode extends ValueNode, DirtyTrackable {
  readonly value: readonly ValueNode[];
  readonly length: number;

  at(index: number): ValueNode | undefined;
  push(node: ValueNode): void;
  insertAt(index: number, node: ValueNode): void;
  removeAt(index: number): void;
  move(fromIndex: number, toIndex: number): void;
  replaceAt(index: number, node: ValueNode): void;
  clear(): void;

  setNodeFactory(factory: NodeFactory): void;
  pushValue(value?: unknown): void;
  insertValueAt(index: number, value?: unknown): void;
}

export interface ValueNodeOptions {
  readonly id?: string;
  readonly name: string;
  readonly schema: SchemaDefinition;
  readonly parent?: ValueNode | null;
}

export interface PrimitiveNodeOptions extends ValueNodeOptions {
  readonly value?: unknown;
}

export interface ObjectNodeOptions extends ValueNodeOptions {
  readonly children?: ValueNode[];
}

export interface ArrayNodeOptions extends ValueNodeOptions {
  readonly items?: ValueNode[];
}
