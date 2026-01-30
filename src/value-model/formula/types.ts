import type {
  PrimitiveValueNode,
  ObjectValueNode,
  ArrayValueNode,
} from '../node/types';

export interface FormulaArrayLevel {
  readonly array: ArrayValueNode;
  readonly index: number;
}

export interface FormulaField {
  readonly node: PrimitiveValueNode;
  readonly expression: string;
  readonly parent: ObjectValueNode | null;
  readonly dependencyNodes: readonly PrimitiveValueNode[];
  readonly arrayLevels: readonly FormulaArrayLevel[];
}

export type DependencyMap = Map<PrimitiveValueNode, Set<FormulaField>>;

export interface FormulaEngineOptions {
  onError?: (node: PrimitiveValueNode, error: Error) => void;
  onWarning?: (node: PrimitiveValueNode, type: string, message: string) => void;
}
