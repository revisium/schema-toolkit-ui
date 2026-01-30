import { Path } from '../core/Path';
import type { ValueNode } from '../node/types';

export class TreeIndex {
  private readonly nodesById = new Map<string, ValueNode>();
  private readonly pathCache = new Map<string, Path>();

  constructor(private readonly root: ValueNode) {
    this.rebuild();
  }

  nodeById(id: string): ValueNode | undefined {
    const node = this.nodesById.get(id);
    if (node) {
      return node;
    }

    this.rebuild();
    return this.nodesById.get(id);
  }

  pathOf(node: ValueNode): Path {
    if (this.isInsideArray(node)) {
      return this.computePath(node);
    }

    const cached = this.pathCache.get(node.id);
    if (cached) {
      return cached;
    }

    const path = this.computePath(node);
    this.pathCache.set(node.id, path);
    return path;
  }

  private isInsideArray(node: ValueNode): boolean {
    let current: ValueNode | null = node.parent;
    while (current) {
      if (current.isArray()) {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  rebuild(): void {
    this.nodesById.clear();
    this.pathCache.clear();
    this.indexNode(this.root);
  }

  registerNode(node: ValueNode): void {
    this.indexNode(node);
  }

  invalidatePathsUnder(node: ValueNode): void {
    this.pathCache.delete(node.id);
    this.invalidateChildPaths(node);
  }

  private indexNode(node: ValueNode): void {
    this.nodesById.set(node.id, node);

    if (node.isObject()) {
      for (const child of node.children) {
        this.indexNode(child);
      }
    } else if (node.isArray()) {
      for (const item of node.value) {
        this.indexNode(item);
      }
    }
  }

  private computePath(node: ValueNode): Path {
    const segments: Array<
      { type: 'property'; name: string } | { type: 'index'; index: number }
    > = [];
    let current: ValueNode | null = node;

    while (current?.parent) {
      const parent: ValueNode = current.parent;

      if (parent.isObject()) {
        segments.unshift({ type: 'property', name: current.name });
      } else if (parent.isArray()) {
        const index = parent.value.indexOf(current);
        if (index >= 0) {
          segments.unshift({ type: 'index', index });
        }
      }

      current = parent;
    }

    return Path.fromSegments(segments);
  }

  private invalidateChildPaths(node: ValueNode): void {
    if (node.isObject()) {
      for (const child of node.children) {
        this.pathCache.delete(child.id);
        this.invalidateChildPaths(child);
      }
    } else if (node.isArray()) {
      for (const item of node.value) {
        this.pathCache.delete(item.id);
        this.invalidateChildPaths(item);
      }
    }
  }
}
