import { makeAutoObservable } from 'mobx';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { FilterFieldType } from '../../shared/field-types.js';
import { getDefaultOperator, operatorRequiresValue } from './operators.js';
import type { FilterCondition, FilterGroup } from './types.js';

export class FilterModel {
  private _nextConditionId = 1;
  private _nextGroupId = 1;
  private _rootGroup: FilterGroup = this._createEmptyGroup();
  private _appliedSnapshot: string | null = null;
  private _availableFields: ColumnSpec[] = [];
  private _onChange: (() => void) | null = null;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get rootGroup(): FilterGroup {
    return this._rootGroup;
  }

  get hasPendingChanges(): boolean {
    const current = this._serialize(this._rootGroup);
    return current !== this._appliedSnapshot;
  }

  get totalConditionCount(): number {
    return this._countConditions(this._rootGroup);
  }

  get hasActiveFilters(): boolean {
    return (
      this._appliedSnapshot !== null &&
      this._appliedSnapshot !== this._serialize(this._createEmptyGroup())
    );
  }

  get allFiltersValid(): boolean {
    return this._validateGroup(this._rootGroup);
  }

  get isEmpty(): boolean {
    return (
      this._rootGroup.conditions.length === 0 &&
      this._rootGroup.groups.length === 0
    );
  }

  init(availableFields: ColumnSpec[]): void {
    this._availableFields = availableFields;
    this._rootGroup = this._createEmptyGroup();
    this._appliedSnapshot = null;
    this._nextConditionId = 1;
    this._nextGroupId = 1;
  }

  addCondition(groupId?: string): void {
    const firstField = this._availableFields[0];
    if (!firstField) {
      return;
    }

    const condition: FilterCondition = {
      id: this._generateConditionId(),
      field: firstField.field,
      fieldType: firstField.fieldType,
      operator: getDefaultOperator(firstField.fieldType),
      value: '',
    };

    const group = groupId
      ? this._findGroupInTree(this._rootGroup, groupId)
      : this._rootGroup;
    if (group) {
      group.conditions.push(condition);
      this._notifyChange();
    }
  }

  updateCondition(
    id: string,
    updates: Partial<Pick<FilterCondition, 'field' | 'operator' | 'value'>>,
  ): void {
    const found = this._findConditionInGroup(this._rootGroup, id);
    if (!found) {
      return;
    }

    const { condition } = found;

    if (updates.field !== undefined && updates.field !== condition.field) {
      const col = this._availableFields.find((c) => c.field === updates.field);
      if (col) {
        condition.field = col.field;
        condition.fieldType = col.fieldType;
        condition.operator = getDefaultOperator(col.fieldType);
        condition.value = '';
      }
    } else if (
      updates.operator !== undefined &&
      updates.operator !== condition.operator
    ) {
      condition.operator = updates.operator;
      condition.value = '';
    } else if (updates.value !== undefined) {
      condition.value = updates.value;
    }

    this._notifyChange();
  }

  removeCondition(id: string): void {
    const found = this._findConditionInGroup(this._rootGroup, id);
    if (found) {
      const index = found.parent.conditions.indexOf(found.condition);
      if (index !== -1) {
        found.parent.conditions.splice(index, 1);
        this._notifyChange();
      }
    }
  }

  addGroup(parentGroupId?: string): void {
    const parent = parentGroupId
      ? this._findGroupInTree(this._rootGroup, parentGroupId)
      : this._rootGroup;
    if (parent) {
      parent.groups.push(this._createEmptyGroup());
      this._notifyChange();
    }
  }

  removeGroup(id: string): void {
    this._removeGroupFromTree(this._rootGroup, id);
    this._notifyChange();
  }

  setGroupLogic(id: string, logic: 'and' | 'or'): void {
    const group = this._findGroupInTree(this._rootGroup, id);
    if (group) {
      group.logic = logic;
      this._notifyChange();
    }
  }

  apply(): void {
    this._appliedSnapshot = this._serialize(this._rootGroup);
    this._notifyChange();
  }

  reset(): void {
    if (this._appliedSnapshot !== null) {
      this._rootGroup = JSON.parse(this._appliedSnapshot) as FilterGroup;
    } else {
      this._rootGroup = this._createEmptyGroup();
    }
    this._notifyChange();
  }

  clearAll(): void {
    this._rootGroup = this._createEmptyGroup();
    this._appliedSnapshot = null;
    this._notifyChange();
  }

  isConditionValid(id: string): boolean {
    const found = this._findConditionInGroup(this._rootGroup, id);
    if (!found) {
      return false;
    }
    return this._isConditionValueValid(found.condition);
  }

  getConditionError(id: string): string | null {
    const found = this._findConditionInGroup(this._rootGroup, id);
    if (!found) {
      return null;
    }
    const condition = found.condition;

    if (!operatorRequiresValue(condition.operator)) {
      return null;
    }

    if (condition.value === '') {
      return 'Value is required';
    }

    if (
      (condition.fieldType === FilterFieldType.Number ||
        condition.fieldType === FilterFieldType.DateTime) &&
      isNaN(Number(condition.value))
    ) {
      return 'Value must be a number';
    }

    return null;
  }

  setOnChange(cb: (() => void) | null): void {
    this._onChange = cb;
  }

  dispose(): void {
    this._onChange = null;
  }

  private _createEmptyGroup(): FilterGroup {
    return {
      id: this._generateGroupId(),
      logic: 'and',
      conditions: [],
      groups: [],
    };
  }

  private _generateConditionId(): string {
    return `c-${this._nextConditionId++}`;
  }

  private _generateGroupId(): string {
    return `g-${this._nextGroupId++}`;
  }

  private _findConditionInGroup(
    group: FilterGroup,
    id: string,
  ): { condition: FilterCondition; parent: FilterGroup } | null {
    for (const condition of group.conditions) {
      if (condition.id === id) {
        return { condition, parent: group };
      }
    }
    for (const subGroup of group.groups) {
      const found = this._findConditionInGroup(subGroup, id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private _findGroupInTree(group: FilterGroup, id: string): FilterGroup | null {
    if (group.id === id) {
      return group;
    }
    for (const subGroup of group.groups) {
      const found = this._findGroupInTree(subGroup, id);
      if (found) {
        return found;
      }
    }
    return null;
  }

  private _removeGroupFromTree(parent: FilterGroup, id: string): boolean {
    const index = parent.groups.findIndex((g) => g.id === id);
    if (index !== -1) {
      parent.groups.splice(index, 1);
      return true;
    }
    for (const subGroup of parent.groups) {
      if (this._removeGroupFromTree(subGroup, id)) {
        return true;
      }
    }
    return false;
  }

  private _countConditions(group: FilterGroup): number {
    let count = group.conditions.length;
    for (const subGroup of group.groups) {
      count += this._countConditions(subGroup);
    }
    return count;
  }

  private _validateGroup(group: FilterGroup): boolean {
    for (const condition of group.conditions) {
      if (!this._isConditionValueValid(condition)) {
        return false;
      }
    }
    for (const subGroup of group.groups) {
      if (!this._validateGroup(subGroup)) {
        return false;
      }
    }
    return true;
  }

  private _isConditionValueValid(condition: FilterCondition): boolean {
    if (!operatorRequiresValue(condition.operator)) {
      return true;
    }
    if (condition.value === '') {
      return false;
    }
    if (
      (condition.fieldType === FilterFieldType.Number ||
        condition.fieldType === FilterFieldType.DateTime) &&
      isNaN(Number(condition.value))
    ) {
      return false;
    }
    return true;
  }

  private _serialize(group: FilterGroup): string {
    return JSON.stringify(group);
  }

  private _notifyChange(): void {
    if (this._onChange) {
      this._onChange();
    }
  }
}
