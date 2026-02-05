import { makeAutoObservable } from 'mobx';
import type { SchemaModel, SchemaNode } from '@revisium/schema-toolkit';
import type { TreeState } from '../state/TreeState';

export class CollapseManager {
  constructor(
    private readonly _treeState: TreeState,
    private readonly _getSchemaModel: () => SchemaModel,
  ) {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  public collapseAll(): void {
    const nodeIds = this.collectAllNodeIds();
    this._treeState.collapseAll(nodeIds, true);
  }

  public expandAll(): void {
    const nodeIds = this.collectAllNodeIds();
    this._treeState.expandAll(nodeIds);
  }

  public collapseIfComplex(threshold: number): void {
    const nodeCount = this._getSchemaModel().nodeCount;
    if (nodeCount >= threshold) {
      this.collapseAll();
    }
  }

  public collapseRefNodes(): void {
    const refNodeIds = this.collectRefNodeIds();
    for (const nodeId of refNodeIds) {
      this._treeState.setExpanded(nodeId, false);
    }
  }

  private collectRefNodeIds(): string[] {
    const ids: string[] = [];
    const collectIds = (node: SchemaNode) => {
      if (node.isNull()) {
        return;
      }
      if (node.isRef() && (node.isObject() || node.isArray())) {
        ids.push(node.id());
      }
      if (node.isObject()) {
        for (const child of node.properties()) {
          collectIds(child);
        }
      } else if (node.isArray()) {
        const items = node.items();
        if (!items.isNull()) {
          collectIds(items);
        }
      }
    };
    collectIds(this._getSchemaModel().root);
    return ids;
  }

  private collectAllNodeIds(): string[] {
    const ids: string[] = [];
    const collectIds = (node: SchemaNode) => {
      if (node.isNull()) {
        return;
      }
      ids.push(node.id());
      if (node.isObject()) {
        for (const child of node.properties()) {
          collectIds(child);
        }
      } else if (node.isArray()) {
        const items = node.items();
        if (!items.isNull()) {
          collectIds(items);
        }
      }
    };
    collectIds(this._getSchemaModel().root);
    return ids;
  }
}
