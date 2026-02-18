import { makeAutoObservable } from 'mobx';
import { createRowModel } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../lib/initReactivity.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { syncNextIds } from './filterTreeUtils.js';
import {
  getConditionErrorMessage,
  isConditionValueValid,
} from './filterValidation.js';
import { FilterOperator, getDefaultOperator } from './operators.js';
import { SearchLanguage, SearchType } from './searchTypes.js';
import { buildWhereClause } from './filterBuilder.js';
import type { FilterGroup } from './types.js';
import { FILTER_SCHEMA, type FilterData } from './filterSchema.js';
import { FilterGroupVM } from './FilterGroupVM.js';
import { FilterConditionVM } from './FilterConditionVM.js';

type FilterRowModel = ReturnType<typeof createRowModel<typeof FILTER_SCHEMA>>;

export class FilterModel {
  private readonly _row: FilterRowModel;
  private _availableFields: ColumnSpec[] = [];
  private _onChange: (() => void) | null = null;
  private _onApply: ((where: Record<string, unknown> | null) => void) | null =
    null;
  private _isOpen = false;
  private _committedHasFilters = false;

  constructor() {
    ensureReactivityProvider();
    this._row = createRowModel<typeof FILTER_SCHEMA>({
      rowId: 'filter',
      schema: FILTER_SCHEMA,
      data: this._emptyFilterData(),
    });
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  setOpen(value: boolean): void {
    this._isOpen = value;
  }

  get rootGroup(): FilterGroupVM {
    return new FilterGroupVM(this._row.root, true);
  }

  get hasPendingChanges(): boolean {
    return this._row.isDirty;
  }

  get totalConditionCount(): number {
    return this._countConditions();
  }

  get hasActiveFilters(): boolean {
    return this._committedHasFilters;
  }

  get allFiltersValid(): boolean {
    return this._validateAll();
  }

  buildCurrentWhereClause(): Record<string, unknown> | null {
    return buildWhereClause(this.serializeRootGroup());
  }

  get isEmpty(): boolean {
    const conditionsNode = this._row.root.child('conditions');
    const groupsNode = this._row.root.child('groups');
    return conditionsNode.length === 0 && groupsNode.length === 0;
  }

  init(availableFields: ColumnSpec[]): void {
    this._availableFields = availableFields;
    this._row.reset(this._emptyFilterData());
    this._committedHasFilters = false;
  }

  addCondition(groupId?: string): void {
    const firstField = this._availableFields[0];
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

    this._notifyChange();
  }

  addConditionForField(field: string): void {
    const col = this._availableFields.find((c) => c.field === field);
    if (!col) {
      return;
    }

    const conditionData = this._newConditionData(col);
    this._row.root.child('conditions').pushValue(conditionData);
    this._notifyChange();
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

    this._notifyChange();
  }

  removeCondition(id: string): void {
    const result = this._findConditionLocation(id);
    if (result) {
      result.conditionsNode.removeAt(result.index);
      this._notifyChange();
    }
  }

  addGroup(): void {
    const groupData = {
      id: this._generateGroupId(),
      logic: 'and',
      conditions: [],
    };
    this._row.root.child('groups').pushValue(groupData);
    this._notifyChange();
  }

  removeGroup(id: string): void {
    const groupsNode = this._row.root.child('groups');
    const idx = groupsNode.findIndex((g) => g.child('id').value === id);
    if (idx >= 0) {
      groupsNode.removeAt(idx);
      this._notifyChange();
    }
  }

  setGroupLogic(id: string, logic: 'and' | 'or'): void {
    if (this._row.root.child('id').value === id) {
      this._row.root.child('logic').setValue(logic);
      this._notifyChange();
      return;
    }
    const groupsNode = this._row.root.child('groups');
    const idx = groupsNode.findIndex((g) => g.child('id').value === id);
    if (idx >= 0) {
      groupsNode.at(idx)?.child('logic').setValue(logic);
      this._notifyChange();
    }
  }

  apply(): void {
    this._removeEmptyGroups();
    this._row.commit();
    this._committedHasFilters = !this.isEmpty;
    this._fireOnApply();
    this._notifyChange();
  }

  reset(): void {
    this._row.revert();
    this._notifyChange();
  }

  applySnapshot(serialized: string): void {
    const parsed = JSON.parse(serialized) as FilterGroup;
    const ids = syncNextIds(parsed);
    const data = this._groupToData(
      parsed,
      ids.nextConditionId,
      ids.nextGroupId,
    );
    this._row.reset(data);
    this._committedHasFilters =
      parsed.conditions.length > 0 || parsed.groups.length > 0;
    this._notifyChange();
  }

  clearAll(): void {
    this._row.reset(this._emptyFilterData());
    this._committedHasFilters = false;
    this._fireOnApply();
    this._notifyChange();
  }

  isConditionValid(id: string): boolean {
    const condNode = this._findConditionNode(id);
    if (!condNode) {
      return false;
    }
    return isConditionValueValid(new FilterConditionVM(condNode));
  }

  getConditionError(id: string): string | null {
    const condNode = this._findConditionNode(id);
    if (!condNode) {
      return null;
    }
    return getConditionErrorMessage(new FilterConditionVM(condNode));
  }

  setOnChange(cb: (() => void) | null): void {
    this._onChange = cb;
  }

  setOnApply(
    cb: ((where: Record<string, unknown> | null) => void) | null,
  ): void {
    this._onApply = cb;
  }

  serializeRootGroup(): FilterGroup {
    const plain = this._row.root.getPlainValue() as FilterData;
    return {
      id: plain.id,
      logic: plain.logic as 'and' | 'or',
      conditions: plain.conditions.map((c) => ({
        id: c.id,
        field: c.field,
        fieldType: c.fieldType as FilterGroup['conditions'][0]['fieldType'],
        operator: c.operator as FilterGroup['conditions'][0]['operator'],
        value: c.value,
        searchLanguage: c.searchLanguage || undefined,
        searchType: c.searchType || undefined,
      })),
      groups: plain.groups.map((g) => ({
        id: g.id,
        logic: g.logic as 'and' | 'or',
        conditions: g.conditions.map((c) => ({
          id: c.id,
          field: c.field,
          fieldType: c.fieldType as FilterGroup['conditions'][0]['fieldType'],
          operator: c.operator as FilterGroup['conditions'][0]['operator'],
          value: c.value,
          searchLanguage: c.searchLanguage || undefined,
          searchType: c.searchType || undefined,
        })),
        groups: [],
      })),
    };
  }

  dispose(): void {
    this._onChange = null;
    this._onApply = null;
    this._row.dispose();
  }

  private _applyFieldUpdate(
    condNode: NonNullable<ReturnType<FilterModel['_findConditionNode']>>,
    field: string,
  ): void {
    const col = this._availableFields.find((c) => c.field === field);
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
    condNode: NonNullable<ReturnType<FilterModel['_findConditionNode']>>,
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

  private _emptyFilterData(): FilterData {
    return {
      id: 'g-1',
      logic: 'and',
      conditions: [],
      groups: [],
      nextConditionId: 1,
      nextGroupId: 2,
    };
  }

  private _conditionToData(c: {
    id: string;
    field: string;
    fieldType: string;
    operator: string;
    value: string;
    searchLanguage?: string;
    searchType?: string;
  }) {
    return {
      id: c.id,
      field: c.field,
      fieldType: c.fieldType,
      operator: c.operator,
      value: c.value,
      searchLanguage: c.searchLanguage ?? '',
      searchType: c.searchType ?? '',
    };
  }

  private _groupToData(
    group: FilterGroup,
    nextConditionId: number,
    nextGroupId: number,
  ): FilterData {
    return {
      id: group.id,
      logic: group.logic,
      conditions: group.conditions.map((c) => this._conditionToData(c)),
      groups: group.groups.map((g) => ({
        id: g.id,
        logic: g.logic,
        conditions: g.conditions.map((c) => this._conditionToData(c)),
      })),
      nextConditionId,
      nextGroupId,
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

  private _findConditionNode(id: string) {
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

  private _countConditions(): number {
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

  private _validateAll(): boolean {
    const rootConditions = this._row.root.child('conditions');
    for (let i = 0; i < rootConditions.length; i++) {
      const item = rootConditions.at(i);
      if (item && !isConditionValueValid(new FilterConditionVM(item))) {
        return false;
      }
    }
    const groups = this._row.root.child('groups');
    for (let gi = 0; gi < groups.length; gi++) {
      const groupConditions = groups.at(gi)?.child('conditions');
      if (groupConditions) {
        for (let ci = 0; ci < groupConditions.length; ci++) {
          const item = groupConditions.at(ci);
          if (item && !isConditionValueValid(new FilterConditionVM(item))) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private _removeEmptyGroups(): void {
    const groupsNode = this._row.root.child('groups');
    for (let i = groupsNode.length - 1; i >= 0; i--) {
      const group = groupsNode.at(i);
      if (group?.child('conditions').length === 0) {
        groupsNode.removeAt(i);
      }
    }
  }

  private _fireOnApply(): void {
    if (this._onApply) {
      const where = buildWhereClause(this.serializeRootGroup());
      this._onApply(where);
    }
  }

  private _notifyChange(): void {
    if (this._onChange) {
      this._onChange();
    }
  }
}
