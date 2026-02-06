import type { SchemaNode } from '@revisium/schema-toolkit';

export function traverseTree(
  root: SchemaNode,
  visitor: (node: SchemaNode) => void,
): void {
  if (root.isNull()) {
    return;
  }
  visitor(root);
  if (root.isObject()) {
    for (const child of root.properties()) {
      traverseTree(child, visitor);
    }
  } else if (root.isArray()) {
    const items = root.items();
    if (!items.isNull()) {
      traverseTree(items, visitor);
    }
  }
}
