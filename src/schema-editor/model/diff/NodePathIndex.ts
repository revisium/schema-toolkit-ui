import type { SchemaNode } from '../node/SchemaNode';
import type { SchemaTree } from '../tree/SchemaTree';
import type { SchemaNavigator } from './SchemaNavigator';

export class NodePathIndex {
  private readonly nodeIdToPath = new Map<string, string>();
  private readonly nodeIdReplacements = new Map<string, string>();

  constructor(
    private readonly tree: SchemaTree,
    private readonly navigator: SchemaNavigator,
  ) {
    this.rebuild();
  }

  public rebuild(): void {
    this.nodeIdToPath.clear();
    this.nodeIdReplacements.clear();
    this.replacedPaths.clear();
    this.collectNodePaths(this.tree.root(), '');
  }

  public getPath(nodeId: string): string | undefined {
    return this.nodeIdToPath.get(nodeId);
  }

  public hasNode(nodeId: string): boolean {
    return this.nodeIdToPath.has(nodeId);
  }

  public entries(): IterableIterator<[string, string]> {
    return this.nodeIdToPath.entries();
  }

  private readonly replacedPaths = new Set<string>();

  public trackReplacement(oldNodeId: string, newNodeId: string): void {
    const basePath = this.nodeIdToPath.get(oldNodeId);
    if (basePath !== undefined) {
      this.removeChildPaths(basePath);
      this.nodeIdToPath.delete(oldNodeId);
      this.nodeIdToPath.set(newNodeId, basePath);
      this.replacedPaths.add(basePath);
    }
    this.nodeIdReplacements.set(oldNodeId, newNodeId);
  }

  public isChildOfReplacedPath(path: string): boolean {
    for (const replacedPath of this.replacedPaths) {
      if (path.startsWith(replacedPath + '/')) {
        return true;
      }
    }
    return false;
  }

  private removeChildPaths(parentPath: string): void {
    const prefix = parentPath + '/';
    for (const [nodeId, path] of this.nodeIdToPath) {
      if (path.startsWith(prefix)) {
        this.nodeIdToPath.delete(nodeId);
      }
    }
  }

  public buildCurrentIndex(): Map<string, string> {
    const currentIndex = new Map<string, string>();
    this.collectNodePaths(this.tree.root(), '', currentIndex);
    return currentIndex;
  }

  private collectNodePaths(
    node: SchemaNode,
    path: string,
    map: Map<string, string> = this.nodeIdToPath,
  ): void {
    if (node.isNull()) {
      return;
    }

    if (path) {
      map.set(node.id(), path);
    }

    if (node.isObject()) {
      for (const child of node.properties()) {
        const childPath = this.navigator.buildChildPath(path, child.name());
        this.collectNodePaths(child, childPath, map);
      }
    }

    if (node.isArray()) {
      const items = node.items();
      if (!items.isNull()) {
        this.collectNodePaths(items, `${path}/items`, map);
      }
    }
  }
}
