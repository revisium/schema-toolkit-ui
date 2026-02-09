import type { ValueNode, ValueTreeLike } from '@revisium/schema-toolkit';
import type { EditorContext } from '../types';
import type { RowTreeState } from '../state/RowTreeState';
import { RowNodeAccessor } from './RowNodeAccessor';
import { RowNodeState } from './RowNodeState';
import { RowNodeMenu } from './RowNodeMenu';
import { RowNodeLayout } from './RowNodeLayout';
import type { ChildResolver } from './ChildResolver';

export class RowAccessorFactory {
  constructor(
    private readonly _tree: ValueTreeLike,
    private readonly _treeState: RowTreeState,
    private readonly _editorContext: EditorContext | null,
  ) {}

  create(
    node: ValueNode,
    parent: RowNodeAccessor | null,
    childResolver: ChildResolver,
  ): RowNodeAccessor {
    const state = new RowNodeState(node.id, this._treeState);

    const accessor: RowNodeAccessor = new RowNodeAccessor(
      node,
      parent,
      state,
      this._tree,
      this._editorContext,
      childResolver,
    );

    const layout = new RowNodeLayout(accessor);
    const menu = new RowNodeMenu(accessor);
    accessor.setLayout(layout);
    accessor.setMenu(menu);

    return accessor;
  }
}
