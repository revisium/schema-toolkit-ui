import { makeAutoObservable } from 'mobx';
import type { SchemaModel } from '@revisium/schema-toolkit';
import type { TreeState } from '../state/TreeState';
import { traverseTree } from '../utils';

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
    traverseTree(this._getSchemaModel().root, (node) => {
      if (node.isRef() && (node.isObject() || node.isArray())) {
        ids.push(node.id());
      }
    });
    return ids;
  }

  private collectAllNodeIds(): string[] {
    const ids: string[] = [];
    traverseTree(this._getSchemaModel().root, (node) => {
      ids.push(node.id());
    });
    return ids;
  }
}
