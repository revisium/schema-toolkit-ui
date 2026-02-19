import type { FilterRootNode, NestedGroupNode } from '../filterSchema.js';
import { FilterConditionVM } from './FilterConditionVM.js';

export class FilterGroupVM {
  private readonly _isRoot: boolean;

  constructor(
    private readonly _node: FilterRootNode | NestedGroupNode,
    isRoot = false,
  ) {
    this._isRoot = isRoot;
  }

  get id(): string {
    return this._node.child('id').value;
  }

  get logic(): 'and' | 'or' {
    return this._node.child('logic').value as 'and' | 'or';
  }

  get conditions(): FilterConditionVM[] {
    const conditionsNode = this._node.child('conditions');
    const result: FilterConditionVM[] = [];
    for (let i = 0; i < conditionsNode.length; i++) {
      const item = conditionsNode.at(i);
      if (item) {
        result.push(new FilterConditionVM(item));
      }
    }
    return result;
  }

  get groups(): FilterGroupVM[] {
    if (!this._isRoot) {
      return [];
    }
    const rootNode = this._node as FilterRootNode;
    const groupsNode = rootNode.child('groups');
    const result: FilterGroupVM[] = [];
    for (let i = 0; i < groupsNode.length; i++) {
      const item = groupsNode.at(i);
      if (item) {
        result.push(new FilterGroupVM(item));
      }
    }
    return result;
  }
}
