import type { SchemaNode } from '../../node/SchemaNode';
import type { SchemaTree } from '../../tree/SchemaTree';
import type { Path } from '../../path/Path';
import { EMPTY_PATH } from '../../path/Paths';

export class NodePathIndex {
  private readonly nodeIdToPath = new Map<string, Path>();
  private readonly oldToNewNodeId = new Map<string, string>();
  private readonly newToOldNodeId = new Map<string, string>();
  private readonly replacedPaths = new Set<Path>();
  private tree: SchemaTree;

  constructor(tree: SchemaTree) {
    this.tree = tree;
    this.rebuild();
  }

  public rebuild(): void {
    this.nodeIdToPath.clear();
    this.oldToNewNodeId.clear();
    this.newToOldNodeId.clear();
    this.replacedPaths.clear();
    this.collectNodePaths(this.tree.root(), EMPTY_PATH);
  }

  public rebuildFrom(tree: SchemaTree): void {
    this.tree = tree;
    this.rebuild();
  }

  public getPath(nodeId: string): Path | undefined {
    return this.nodeIdToPath.get(nodeId);
  }

  public hasNode(nodeId: string): boolean {
    return this.nodeIdToPath.has(nodeId);
  }

  public nodeIds(): IterableIterator<string> {
    return this.nodeIdToPath.keys();
  }

  public trackReplacement(oldNodeId: string, newNodeId: string): void {
    const basePath = this.nodeIdToPath.get(oldNodeId);
    if (basePath !== undefined) {
      this.removeChildPaths(basePath);
      this.nodeIdToPath.delete(oldNodeId);
      this.nodeIdToPath.set(newNodeId, basePath);
      this.replacedPaths.add(basePath);
    }
    this.oldToNewNodeId.set(oldNodeId, newNodeId);
    this.newToOldNodeId.set(newNodeId, oldNodeId);
  }

  public getOriginalNodeId(newNodeId: string): string | undefined {
    return this.newToOldNodeId.get(newNodeId);
  }

  public isChildOfReplacedPath(path: Path): boolean {
    for (const replacedPath of this.replacedPaths) {
      if (path.isChildOf(replacedPath)) {
        return true;
      }
    }
    return false;
  }

  private removeChildPaths(parentPath: Path): void {
    for (const [nodeId, path] of this.nodeIdToPath) {
      if (path.isChildOf(parentPath)) {
        this.nodeIdToPath.delete(nodeId);
      }
    }
  }

  private collectNodePaths(node: SchemaNode, path: Path): void {
    if (node.isNull()) {
      return;
    }

    if (!path.isEmpty()) {
      this.nodeIdToPath.set(node.id(), path);
    }

    if (node.isObject()) {
      for (const child of node.properties()) {
        this.collectNodePaths(child, path.child(child.name()));
      }
    }

    if (node.isArray()) {
      const items = node.items();
      if (!items.isNull()) {
        this.collectNodePaths(items, path.childItems());
      }
    }
  }
}
