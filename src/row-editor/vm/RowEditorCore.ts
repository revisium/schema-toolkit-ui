import { makeAutoObservable } from 'mobx';
import type { ValueTreeLike } from '@revisium/schema-toolkit';
import type { EditorContext } from './types';
import type { FlatItem } from './flattenNodes';
import { flattenNodes } from './flattenNodes';
import { RowTreeState } from './state/RowTreeState';
import type { RowNodeAccessor } from './accessor/RowNodeAccessor';
import { RowAccessorFactory } from './accessor/RowAccessorFactory';
import { RowAccessorCache } from './accessor/RowAccessorCache';

export class RowEditorCore {
  readonly treeState = new RowTreeState();
  private readonly _cache: RowAccessorCache;
  private readonly _root: RowNodeAccessor;

  constructor(tree: ValueTreeLike, editorContext: EditorContext | null) {
    const factory = new RowAccessorFactory(tree, this.treeState, editorContext);
    this._cache = new RowAccessorCache(factory);
    this._root = this._cache.getOrCreate(tree.root, null);
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
}
