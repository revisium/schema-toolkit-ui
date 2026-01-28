import type { SchemaNode } from '../node/SchemaNode';
import type { Path } from '../path';
import { EMPTY_PATH } from '../path';
import { NULL_NODE } from '../node/NullNode';

export class TreeNodeIndex {
  private readonly nodeIndex = new Map<string, SchemaNode>();
  private readonly pathIndex = new Map<string, Path>();

  public rebuild(rootNode: SchemaNode): void {
    this.nodeIndex.clear();
    this.pathIndex.clear();
    this.collectNodes(rootNode, EMPTY_PATH);
  }

  public getNode(id: string): SchemaNode {
    return this.nodeIndex.get(id) ?? NULL_NODE;
  }

  public getPath(id: string): Path {
    return this.pathIndex.get(id) ?? EMPTY_PATH;
  }

  public countNodes(): number {
    return this.nodeIndex.size;
  }

  public nodeIds(): IterableIterator<string> {
    return this.nodeIndex.keys();
  }

  private collectNodes(node: SchemaNode, path: Path): void {
    if (node.isNull()) {
      return;
    }

    this.nodeIndex.set(node.id(), node);
    this.pathIndex.set(node.id(), path);

    if (node.isObject()) {
      for (const child of node.properties()) {
        this.collectNodes(child, path.child(child.name()));
      }
    } else if (node.isArray()) {
      const items = node.items();
      if (!items.isNull()) {
        this.collectNodes(items, path.childItems());
      }
    }
  }
}
