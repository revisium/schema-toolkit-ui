export type DiagnosticSeverity = 'error' | 'warning' | 'info';

export interface Diagnostic {
  readonly severity: DiagnosticSeverity;
  readonly type: string;
  readonly message: string;
  readonly path: string;
  readonly params?: Record<string, unknown>;
}

export interface SchemaDefinition {
  readonly type?: string;
  readonly $ref?: string;
  readonly default?: unknown;
  readonly readOnly?: boolean;
  readonly required?: boolean;
  readonly format?: string;
  readonly properties?: Record<string, SchemaDefinition>;
  readonly items?: SchemaDefinition;
  readonly additionalProperties?: boolean;
  readonly foreignKey?: string;
  readonly 'x-formula'?: { version: number; expression: string };
  readonly minimum?: number;
  readonly maximum?: number;
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly enum?: readonly unknown[];
}

export enum ValueType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object',
  Array = 'array',
  Ref = 'ref',
}

export interface FormulaDefinition {
  readonly expression: string;
  readonly version?: number;
}

export interface FormulaWarning {
  readonly type:
    | 'nan'
    | 'infinity'
    | 'type-coercion'
    | 'division-by-zero'
    | 'null-reference'
    | 'runtime-error';
  readonly message: string;
  readonly expression: string;
  readonly computedValue: unknown;
}

export type ChangeType =
  | 'setValue'
  | 'addProperty'
  | 'removeProperty'
  | 'arrayPush'
  | 'arrayInsert'
  | 'arrayRemove'
  | 'arrayMove'
  | 'arrayReplace'
  | 'arrayClear';

import type { Path } from './Path';

export interface Change {
  readonly type: ChangeType;
  readonly path: Path;
  readonly value?: unknown;
  readonly oldValue?: unknown;
  readonly fromIndex?: number;
  readonly toIndex?: number;
  readonly index?: number;
}

export type JsonPatchOp =
  | 'add'
  | 'remove'
  | 'replace'
  | 'move'
  | 'copy'
  | 'test';

export interface JsonPatch {
  readonly op: JsonPatchOp;
  readonly path: string;
  readonly value?: unknown;
  readonly from?: string;
}
