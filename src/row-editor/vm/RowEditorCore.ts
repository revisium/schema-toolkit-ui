import { makeAutoObservable } from 'mobx';
import type { ValueTreeLike } from '@revisium/schema-toolkit';
import type { EditorContext } from './types';
import type { FlatItem } from './flattenNodes';
import { flattenNodes } from './flattenNodes';
import { RowTreeState } from './state/RowTreeState';
import type { RowNodeAccessor } from './accessor/RowNodeAccessor';
import { RowAccessorFactory } from './accessor/RowAccessorFactory';
import { RowAccessorCache } from './accessor/RowAccessorCache';

export interface RowEditorCoreOptions {
  collapseComplexity?: number;
}

export class RowEditorCore {
  readonly treeState = new RowTreeState();
  private readonly _cache: RowAccessorCache;
  private readonly _root: RowNodeAccessor;

  constructor(
    tree: ValueTreeLike,
    editorContext: EditorContext | null,
    options?: RowEditorCoreOptions,
  ) {
    const factory = new RowAccessorFactory(tree, this.treeState, editorContext);
    this._cache = new RowAccessorCache(factory);
    this._root = this._cache.getOrCreate(tree.root, null);

    if (options?.collapseComplexity) {
      this._collapseIfComplex(options.collapseComplexity);
    }

    makeAutoObservable(this, { treeState: false }, { autoBind: true });
  }

  get root(): RowNodeAccessor {
    return this._root;
  }

  get flattenedNodes(): readonly FlatItem[] {
    return flattenNodes(this._root);
  }

  dispose(): void {
    this._cache.clear();
    this.treeState.reset();
  }

  private _collapseIfComplex(threshold: number): void {
    const nodes = flattenNodes(this._root);
    if (nodes.length >= threshold) {
      const nodeIds = this._collectAllNodeIds(this._root);
      this.treeState.collapseAll(nodeIds);
      this.treeState.setExpanded(this._root.id, true);
    }
  }

  private _collectAllNodeIds(accessor: RowNodeAccessor): string[] {
    const ids: string[] = [accessor.id];
    for (const child of accessor.getChildAccessors()) {
      ids.push(...this._collectAllNodeIds(child));
    }
    return ids;
  }
}
