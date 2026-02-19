import type { createRowModel } from '@revisium/schema-toolkit';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import type { FILTER_SCHEMA } from '../filterSchema.js';
import { FilterConditionVM } from '../vm/FilterConditionVM.js';
import { FilterOperator, getDefaultOperator } from '../utils/operators.js';
import { SearchLanguage, SearchType } from '../utils/searchTypes.js';

type FilterRowModel = ReturnType<typeof createRowModel<typeof FILTER_SCHEMA>>;

export class FilterTreeOps {
  constructor(
    private readonly _row: FilterRowModel,
    private readonly _getAvailableFields: () => ColumnSpec[],
  ) {}

  addCondition(groupId?: string): void {
    const firstField = this._getAvailableFields()[0];
    if (!firstField) {
      return;
    }

    if (groupId) {
      const groupsNode = this._row.root.child('groups');
      const groupIndex = groupsNode.findIndex(
        (g) => g.child('id').value === groupId,
      );
      if (groupIndex < 0) {
        return;
      }
      const groupNode = groupsNode.at(groupIndex);
      if (!groupNode) {
        return;
      }
      groupNode
        .child('conditions')
        .pushValue(this._newConditionData(firstField));
    } else {
      this._row.root
        .child('conditions')
        .pushValue(this._newConditionData(firstField));
    }
  }

  addConditionForField(field: string): void {
    const col = this._getAvailableFields().find((c) => c.field === field);
    if (!col) {
      return;
    }

    const conditionData = this._newConditionData(col);
    this._row.root.child('conditions').pushValue(conditionData);
  }

  updateCondition(
    id: string,
    updates: Partial<
      Pick<
        FilterConditionVM,
        'field' | 'operator' | 'value' | 'searchLanguage' | 'searchType'
      >
    >,
  ): void {
    const condNode = this._findConditionNode(id);
    if (!condNode) {
      return;
    }

    if (
      updates.field !== undefined &&
      updates.field !== condNode.child('field').value
    ) {
      this._applyFieldUpdate(condNode, updates.field);
    } else if (
      updates.operator !== undefined &&
      updates.operator !== condNode.child('operator').value
    ) {
      this._applyOperatorUpdate(condNode, updates.operator);
    } else if (updates.value !== undefined) {
      condNode.child('value').setValue(updates.value);
    } else if (updates.searchLanguage !== undefined) {
      condNode.child('searchLanguage').setValue(updates.searchLanguage);
    } else if (updates.searchType !== undefined) {
      condNode.child('searchType').setValue(updates.searchType);
    }
  }

  removeCondition(id: string): void {
    const result = this._findConditionLocation(id);
    if (result) {
      result.conditionsNode.removeAt(result.index);
    }
  }

  addGroup(): void {
    const groupData = {
      id: this._generateGroupId(),
      logic: 'and',
      conditions: [],
    };
    this._row.root.child('groups').pushValue(groupData);
  }

  removeGroup(id: string): void {
    const groupsNode = this._row.root.child('groups');
    const idx = groupsNode.findIndex((g) => g.child('id').value === id);
    if (idx >= 0) {
      groupsNode.removeAt(idx);
    }
  }

  setGroupLogic(id: string, logic: 'and' | 'or'): void {
    if (this._row.root.child('id').value === id) {
      this._row.root.child('logic').setValue(logic);
      return;
    }
    const groupsNode = this._row.root.child('groups');
    const idx = groupsNode.findIndex((g) => g.child('id').value === id);
    if (idx >= 0) {
      groupsNode.at(idx)?.child('logic').setValue(logic);
    }
  }

  countConditions(): number {
    let count = this._row.root.child('conditions').length;
    const groups = this._row.root.child('groups');
    for (let i = 0; i < groups.length; i++) {
      const group = groups.at(i);
      if (group) {
        count += group.child('conditions').length;
      }
    }
    return count;
  }

  isEmpty(): boolean {
    const conditionsNode = this._row.root.child('conditions');
    const groupsNode = this._row.root.child('groups');
    return conditionsNode.length === 0 && groupsNode.length === 0;
  }

  removeEmptyGroups(): void {
    const groupsNode = this._row.root.child('groups');
    for (let i = groupsNode.length - 1; i >= 0; i--) {
      const group = groupsNode.at(i);
      if (group?.child('conditions').length === 0) {
        groupsNode.removeAt(i);
      }
    }
  }

  private _applyFieldUpdate(
    condNode: NonNullable<ReturnType<FilterTreeOps['_findConditionNode']>>,
    field: string,
  ): void {
    const col = this._getAvailableFields().find((c) => c.field === field);
    if (!col) {
      return;
    }
    const oldFieldType = condNode.child('fieldType').value;
    condNode.child('field').setValue(col.field);
    condNode.child('fieldType').setValue(col.fieldType);
    if (col.fieldType !== oldFieldType) {
      condNode.child('operator').setValue(getDefaultOperator(col.fieldType));
      condNode.child('value').setValue('');
      condNode.child('searchLanguage').setValue('');
      condNode.child('searchType').setValue('');
    }
  }

  private _applyOperatorUpdate(
    condNode: NonNullable<ReturnType<FilterTreeOps['_findConditionNode']>>,
    operator: FilterOperator,
  ): void {
    condNode.child('operator').setValue(operator);
    condNode.child('value').setValue('');
    if (operator === FilterOperator.Search) {
      condNode.child('searchLanguage').setValue(SearchLanguage.Simple);
      condNode.child('searchType').setValue(SearchType.Plain);
    } else {
      condNode.child('searchLanguage').setValue('');
      condNode.child('searchType').setValue('');
    }
  }

  private _newConditionData(col: ColumnSpec) {
    return {
      id: this._generateConditionId(),
      field: col.field,
      fieldType: col.fieldType,
      operator: getDefaultOperator(col.fieldType),
      value: '',
      searchLanguage: '',
      searchType: '',
    };
  }

  private _generateConditionId(): string {
    const node = this._row.root.child('nextConditionId');
    const current = node.value;
    node.setValue(current + 1);
    return `c-${current}`;
  }

  private _generateGroupId(): string {
    const node = this._row.root.child('nextGroupId');
    const current = node.value;
    node.setValue(current + 1);
    return `g-${current}`;
  }

  _findConditionNode(id: string) {
    const rootConditions = this._row.root.child('conditions');
    for (let i = 0; i < rootConditions.length; i++) {
      const item = rootConditions.at(i);
      if (item?.child('id').value === id) {
        return item;
      }
    }
    const groups = this._row.root.child('groups');
    for (let gi = 0; gi < groups.length; gi++) {
      const groupConditions = groups.at(gi)?.child('conditions');
      if (groupConditions) {
        for (let ci = 0; ci < groupConditions.length; ci++) {
          const item = groupConditions.at(ci);
          if (item?.child('id').value === id) {
            return item;
          }
        }
      }
    }
    return null;
  }

  private _findConditionLocation(id: string) {
    const rootConditions = this._row.root.child('conditions');
    for (let i = 0; i < rootConditions.length; i++) {
      const item = rootConditions.at(i);
      if (item?.child('id').value === id) {
        return { conditionsNode: rootConditions, index: i };
      }
    }
    const groups = this._row.root.child('groups');
    for (let gi = 0; gi < groups.length; gi++) {
      const groupConditions = groups.at(gi)?.child('conditions');
      if (groupConditions) {
        for (let ci = 0; ci < groupConditions.length; ci++) {
          const item = groupConditions.at(ci);
          if (item?.child('id').value === id) {
            return { conditionsNode: groupConditions, index: ci };
          }
        }
      }
    }
    return null;
  }
}
