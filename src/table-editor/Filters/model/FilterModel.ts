import { makeAutoObservable } from 'mobx';
import type { ColumnSpec } from '../../Columns/model/types.js';
import {
  countConditions,
  findConditionInGroup,
  findGroupInTree,
  removeGroupFromTree,
  syncNextIds,
} from './filterTreeUtils.js';
import {
  getConditionErrorMessage,
  isConditionValueValid,
  validateGroup,
} from './filterValidation.js';
import { getDefaultOperator } from './operators.js';
import type { FilterCondition, FilterGroup } from './types.js';

export class FilterModel {
  private _nextConditionId = 1;
  private _nextGroupId = 1;
  private _rootGroup: FilterGroup = this._createEmptyGroup();
  private _appliedSnapshot: string | null = null;
  private _availableFields: ColumnSpec[] = [];
  private _onChange: (() => void) | null = null;
  private _isOpen = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  setOpen(value: boolean): void {
    this._isOpen = value;
  }

  get rootGroup(): FilterGroup {
    return this._rootGroup;
  }

  get hasPendingChanges(): boolean {
    const current = JSON.stringify(this._rootGroup);
    return current !== this._appliedSnapshot;
  }

  get totalConditionCount(): number {
    return countConditions(this._rootGroup);
  }

  get hasActiveFilters(): boolean {
    if (this._appliedSnapshot === null) {
      return false;
    }
    const parsed = JSON.parse(this._appliedSnapshot) as FilterGroup;
    return parsed.conditions.length > 0 || parsed.groups.length > 0;
  }

  get allFiltersValid(): boolean {
    return validateGroup(this._rootGroup);
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
      ? findGroupInTree(this._rootGroup, groupId)
      : this._rootGroup;
    if (group) {
      group.conditions.push(condition);
      this._notifyChange();
    }
  }

  addConditionForField(field: string): void {
    const col = this._availableFields.find((c) => c.field === field);
    if (!col) {
      return;
    }

    const condition: FilterCondition = {
      id: this._generateConditionId(),
      field: col.field,
      fieldType: col.fieldType,
      operator: getDefaultOperator(col.fieldType),
      value: '',
    };

    this._rootGroup.conditions.push(condition);
    this._notifyChange();
  }

  updateCondition(
    id: string,
    updates: Partial<Pick<FilterCondition, 'field' | 'operator' | 'value'>>,
  ): void {
    const found = findConditionInGroup(this._rootGroup, id);
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
    const found = findConditionInGroup(this._rootGroup, id);
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
      ? findGroupInTree(this._rootGroup, parentGroupId)
      : this._rootGroup;
    if (parent) {
      parent.groups.push(this._createEmptyGroup());
      this._notifyChange();
    }
  }

  removeGroup(id: string): void {
    removeGroupFromTree(this._rootGroup, id);
    this._notifyChange();
  }

  setGroupLogic(id: string, logic: 'and' | 'or'): void {
    const group = findGroupInTree(this._rootGroup, id);
    if (group) {
      group.logic = logic;
      this._notifyChange();
    }
  }

  apply(): void {
    this._appliedSnapshot = JSON.stringify(this._rootGroup);
    this._notifyChange();
  }

  reset(): void {
    if (this._appliedSnapshot === null) {
      this._rootGroup = this._createEmptyGroup();
    } else {
      this._rootGroup = JSON.parse(this._appliedSnapshot) as FilterGroup;
    }
    this._notifyChange();
  }

  applySnapshot(serialized: string): void {
    this._rootGroup = JSON.parse(serialized) as FilterGroup;
    this._appliedSnapshot = serialized;
    const ids = syncNextIds(this._rootGroup);
    this._nextConditionId = ids.nextConditionId;
    this._nextGroupId = ids.nextGroupId;
    this._notifyChange();
  }

  clearAll(): void {
    this._rootGroup = this._createEmptyGroup();
    this._appliedSnapshot = null;
    this._notifyChange();
  }

  isConditionValid(id: string): boolean {
    const found = findConditionInGroup(this._rootGroup, id);
    if (!found) {
      return false;
    }
    return isConditionValueValid(found.condition);
  }

  getConditionError(id: string): string | null {
    const found = findConditionInGroup(this._rootGroup, id);
    if (!found) {
      return null;
    }
    return getConditionErrorMessage(found.condition);
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

  private _notifyChange(): void {
    if (this._onChange) {
      this._onChange();
    }
  }
}
