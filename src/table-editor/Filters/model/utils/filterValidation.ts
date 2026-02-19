import { FilterFieldType } from '../../../shared/field-types.js';
import { operatorRequiresValue } from './operators.js';
import type { FilterCondition, FilterGroup } from '../types.js';

export function isConditionValueValid(condition: FilterCondition): boolean {
  if (!operatorRequiresValue(condition.operator)) {
    return true;
  }
  if (condition.value === '') {
    return false;
  }
  if (condition.fieldType === FilterFieldType.Number) {
    return !Number.isNaN(Number(condition.value));
  }
  if (condition.fieldType === FilterFieldType.DateTime) {
    return !Number.isNaN(new Date(condition.value).getTime());
  }
  return true;
}

export function validateGroup(group: FilterGroup): boolean {
  for (const condition of group.conditions) {
    if (!isConditionValueValid(condition)) {
      return false;
    }
  }
  for (const subGroup of group.groups) {
    if (!validateGroup(subGroup)) {
      return false;
    }
  }
  return true;
}

export function getConditionErrorMessage(
  condition: FilterCondition,
): string | null {
  if (!operatorRequiresValue(condition.operator)) {
    return null;
  }

  if (condition.value === '') {
    return 'Value is required';
  }

  if (condition.fieldType === FilterFieldType.Number) {
    if (Number.isNaN(Number(condition.value))) {
      return 'Value must be a number';
    }
  }

  if (condition.fieldType === FilterFieldType.DateTime) {
    if (Number.isNaN(new Date(condition.value).getTime())) {
      return 'Value must be a valid date';
    }
  }

  return null;
}
