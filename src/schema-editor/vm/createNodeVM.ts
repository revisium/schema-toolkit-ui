import type { SchemaNode } from '../model';
import type { SchemaEditorVM } from './SchemaEditorVM';
import type { ObjectNodeVM as ObjectNodeVMType } from './ObjectNodeVM';
import type { ArrayNodeVM as ArrayNodeVMType } from './ArrayNodeVM';
import type { PrimitiveNodeVM as PrimitiveNodeVMType } from './PrimitiveNodeVM';
import type { RefNodeVM as RefNodeVMType } from './RefNodeVM';
import type { ForeignKeyNodeVM as ForeignKeyNodeVMType } from './ForeignKeyNodeVM';

export type NodeVM =
  | ObjectNodeVMType
  | ArrayNodeVMType
  | PrimitiveNodeVMType
  | RefNodeVMType
  | ForeignKeyNodeVMType;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NodeVMClass = new (...args: any[]) => NodeVM;

interface VMRegistry {
  ObjectNodeVM?: NodeVMClass;
  ArrayNodeVM?: NodeVMClass;
  PrimitiveNodeVM?: NodeVMClass;
  RefNodeVM?: NodeVMClass;
  ForeignKeyNodeVM?: NodeVMClass;
}

const registry: VMRegistry = {};

export function registerVMClass(
  name: keyof VMRegistry,
  VMClass: NodeVMClass,
): void {
  registry[name] = VMClass;
}

export function createNodeVM(
  node: SchemaNode,
  editor: SchemaEditorVM,
  parent: ObjectNodeVMType | null,
  isRoot: boolean = false,
): NodeVM {
  if (node.isObject()) {
    const VMClass = registry.ObjectNodeVM;
    if (!VMClass) {
      throw new Error(
        'ObjectNodeVM not registered. Import ObjectNodeVM before using createNodeVM.',
      );
    }
    return new VMClass(node, editor, parent, isRoot);
  }

  if (node.isArray()) {
    const VMClass = registry.ArrayNodeVM;
    if (!VMClass) {
      throw new Error(
        'ArrayNodeVM not registered. Import ArrayNodeVM before using createNodeVM.',
      );
    }
    return new VMClass(node, editor, parent, isRoot);
  }

  if (node.isRef()) {
    const VMClass = registry.RefNodeVM;
    if (!VMClass) {
      throw new Error(
        'RefNodeVM not registered. Import RefNodeVM before using createNodeVM.',
      );
    }
    return new VMClass(node, editor, parent as ObjectNodeVMType, isRoot);
  }

  if (node.foreignKey() !== undefined) {
    const VMClass = registry.ForeignKeyNodeVM;
    if (!VMClass) {
      throw new Error(
        'ForeignKeyNodeVM not registered. Import ForeignKeyNodeVM before using createNodeVM.',
      );
    }
    return new VMClass(node, editor, parent as ObjectNodeVMType, isRoot);
  }

  const VMClass = registry.PrimitiveNodeVM;
  if (!VMClass) {
    throw new Error(
      'PrimitiveNodeVM not registered. Import PrimitiveNodeVM before using createNodeVM.',
    );
  }
  return new VMClass(node, editor, parent as ObjectNodeVMType, isRoot);
}
