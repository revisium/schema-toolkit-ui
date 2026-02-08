import type { ValueNode } from '@revisium/schema-toolkit';
import type { NodeVM, EditorContext } from './types';
import { PrimitiveNodeVM } from './PrimitiveNodeVM';
import { ObjectNodeVM } from './ObjectNodeVM';
import { ArrayNodeVM } from './ArrayNodeVM';

export function createNodeVM(
  node: ValueNode,
  parent: NodeVM | null,
  editorContext: EditorContext | null = null,
): NodeVM {
  const ctx = editorContext ?? parent?.editorContext ?? null;

  if (node.isPrimitive()) {
    return new PrimitiveNodeVM(node, parent, ctx);
  }

  if (node.isObject()) {
    return new ObjectNodeVM(node, parent, ctx);
  }

  if (node.isArray()) {
    return new ArrayNodeVM(node, parent, ctx);
  }

  throw new Error(`Unknown node type: ${node.type}`);
}
