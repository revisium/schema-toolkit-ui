import type { SchemaModel, SchemaNode } from '@revisium/schema-toolkit';
import type { TreeState } from '../state/TreeState';

export class TreeNavigator {
  constructor(
    private readonly _getSchemaModel: () => SchemaModel,
    private readonly _treeState: TreeState,
  ) {}

  public visibleNodeIds(): string[] {
    const root = this._getSchemaModel().root;
    if (root.isNull()) {
      return [];
    }
    const ids: string[] = [];
    this.collectVisibleNodes(root, ids, true);
    return ids;
  }

  public findParentId(nodeId: string): string | null {
    const root = this._getSchemaModel().root;
    if (root.isNull()) {
      return null;
    }
    return this.findParentInTree(root, nodeId);
  }

  public isRootId(nodeId: string): boolean {
    return this._getSchemaModel().root.id() === nodeId;
  }

  public getNode(nodeId: string): SchemaNode {
    return this._getSchemaModel().nodeById(nodeId);
  }

  public nodeHasChildren(node: SchemaNode): boolean {
    if (node.isObject()) {
      return node.properties().length > 0;
    }
    if (node.isArray()) {
      return !node.items().isNull();
    }
    return false;
  }

  public getFirstChildId(node: SchemaNode): string | null {
    if (node.isObject()) {
      const first = node.properties()[0];
      if (first) {
        return first.id();
      }
    } else if (node.isArray()) {
      const items = node.items();
      if (!items.isNull()) {
        return items.id();
      }
    }
    return null;
  }

  private collectVisibleNodes(
    node: SchemaNode,
    ids: string[],
    isRoot: boolean,
  ): void {
    if (node.isNull()) {
      return;
    }

    ids.push(node.id());

    if (!isRoot && !this._treeState.isExpanded(node.id())) {
      return;
    }

    if (node.isObject()) {
      for (const child of node.properties()) {
        this.collectVisibleNodes(child, ids, false);
      }
    } else if (node.isArray()) {
      const items = node.items();
      if (!items.isNull()) {
        this.collectVisibleNodes(items, ids, false);
      }
    }
  }

  private findParentInTree(node: SchemaNode, targetId: string): string | null {
    if (node.isNull()) {
      return null;
    }

    if (node.isObject()) {
      for (const child of node.properties()) {
        if (child.id() === targetId) {
          return node.id();
        }
        const found = this.findParentInTree(child, targetId);
        if (found) {
          return found;
        }
      }
    } else if (node.isArray()) {
      const items = node.items();
      if (!items.isNull()) {
        if (items.id() === targetId) {
          return node.id();
        }
        return this.findParentInTree(items, targetId);
      }
    }

    return null;
  }
}
