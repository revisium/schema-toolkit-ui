import type { ArrayNodeVM, NodeVM } from './types';

export type FlatItem =
  | { readonly type: 'node'; readonly node: NodeVM }
  | {
      readonly type: 'add-button';
      readonly array: ArrayNodeVM;
      readonly guides: boolean[];
    };

function traverse(node: NodeVM, result: FlatItem[]): void {
  result.push({ type: 'node', node });

  if (node.showChildren) {
    for (const child of node.childNodes) {
      traverse(child, result);
    }
  }

  if (node.isArray() && node.showAddButton) {
    result.push({
      type: 'add-button',
      array: node,
      guides: [...node.guides, false],
    });
  }
}

export function flattenNodes(root: NodeVM): readonly FlatItem[] {
  const result: FlatItem[] = [];

  if (root.isObject()) {
    for (const child of root.children) {
      traverse(child, result);
    }
  } else {
    traverse(root, result);
  }

  return result;
}
