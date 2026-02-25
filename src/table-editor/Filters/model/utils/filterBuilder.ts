import { stripDataFieldPrefix } from '../../../TableEditor/model/SchemaContext.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import { SYSTEM_FIELD_IDS } from '../../../shared/system-field-ids.js';
import { operatorRequiresValue, FilterOperator } from './operators.js';
import type { FilterCondition, FilterGroup } from '../types.js';

function parseValue(
  value: string,
  fieldType: FilterFieldType,
): string | number {
  if (fieldType === FilterFieldType.Number) {
    const num = Number(value);
    if (!Number.isNaN(num)) {
      return num;
    }
  }
  return value;
}

function buildOperatorClause(
  operator: FilterOperator,
  value: string,
  fieldType: FilterFieldType,
  isSystemField: boolean,
): Record<string, unknown> {
  const parsed = parseValue(value, fieldType);

  switch (operator) {
    case FilterOperator.Equals:
      return { equals: parsed };
    case FilterOperator.NotEquals:
      return { not: { equals: parsed } };
    case FilterOperator.Contains:
      return isSystemField ? { contains: value } : { string_contains: value };
    case FilterOperator.NotContains:
      return isSystemField
        ? { not: { contains: value } }
        : { not: { string_contains: value } };
    case FilterOperator.StartsWith:
      return isSystemField
        ? { startsWith: value }
        : { string_starts_with: value };
    case FilterOperator.EndsWith:
      return isSystemField ? { endsWith: value } : { string_ends_with: value };
    case FilterOperator.Gt:
      return { gt: parsed };
    case FilterOperator.Gte:
      return { gte: parsed };
    case FilterOperator.Lt:
      return { lt: parsed };
    case FilterOperator.Lte:
      return { lte: parsed };
    case FilterOperator.IsEmpty:
      return { equals: null };
    case FilterOperator.IsNotEmpty:
      return { not: { equals: null } };
    case FilterOperator.IsTrue:
      return { equals: true };
    case FilterOperator.IsFalse:
      return { equals: false };
    case FilterOperator.Search:
      return { search: value };
  }
}

function buildConditionClause(
  condition: FilterCondition,
): Record<string, unknown> | null {
  if (operatorRequiresValue(condition.operator) && condition.value === '') {
    return null;
  }

  if (condition.operator === FilterOperator.Search) {
    if (SYSTEM_FIELD_IDS.has(condition.field)) {
      return {
        [condition.field]: {
          search: condition.value,
          searchLanguage: condition.searchLanguage || 'simple',
          searchType: condition.searchType || 'plain',
        },
      };
    }
    const path = stripDataFieldPrefix(condition.field);
    return {
      data: {
        path,
        search: condition.value,
        searchLanguage: condition.searchLanguage || 'simple',
        searchType: condition.searchType || 'plain',
      },
    };
  }

  const isSystemField = SYSTEM_FIELD_IDS.has(condition.field);

  const opClause = buildOperatorClause(
    condition.operator,
    condition.value,
    condition.fieldType,
    isSystemField,
  );

  if (isSystemField) {
    return { [condition.field]: opClause };
  }

  const path = stripDataFieldPrefix(condition.field);
  return {
    data: {
      path,
      ...opClause,
    },
  };
}

export function buildWhereClause(
  group: FilterGroup,
): Record<string, unknown> | null {
  const clauses: Record<string, unknown>[] = [];

  for (const condition of group.conditions) {
    const clause = buildConditionClause(condition);
    if (clause) {
      clauses.push(clause);
    }
  }

  for (const subGroup of group.groups) {
    const subClause = buildWhereClause(subGroup);
    if (subClause) {
      clauses.push(subClause);
    }
  }

  if (clauses.length === 0) {
    return null;
  }

  if (clauses.length === 1) {
    const first = clauses[0];
    if (first) {
      return first;
    }
    return null;
  }

  const key = group.logic === 'or' ? 'OR' : 'AND';
  return { [key]: clauses };
}
