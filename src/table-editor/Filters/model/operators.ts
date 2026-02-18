import { FilterFieldType } from '../../shared/field-types.js';

export enum FilterOperator {
  Equals = 'equals',
  NotEquals = 'not_equals',
  Contains = 'contains',
  NotContains = 'not_contains',
  StartsWith = 'starts_with',
  EndsWith = 'ends_with',
  IsEmpty = 'is_empty',
  IsNotEmpty = 'is_not_empty',
  Gt = 'gt',
  Gte = 'gte',
  Lt = 'lt',
  Lte = 'lte',
  IsTrue = 'is_true',
  IsFalse = 'is_false',
  Search = 'search',
}

export interface OperatorInfo {
  operator: FilterOperator;
  label: string;
  requiresValue: boolean;
}

const UNARY_OPERATORS = new Set<FilterOperator>([
  FilterOperator.IsEmpty,
  FilterOperator.IsNotEmpty,
  FilterOperator.IsTrue,
  FilterOperator.IsFalse,
]);

export function operatorRequiresValue(operator: FilterOperator): boolean {
  return !UNARY_OPERATORS.has(operator);
}

function op(
  operator: FilterOperator,
  label: string,
  requiresValue = true,
): OperatorInfo {
  return { operator, label, requiresValue };
}

const STRING_OPERATORS: OperatorInfo[] = [
  op(FilterOperator.Equals, 'equals'),
  op(FilterOperator.NotEquals, 'not equals'),
  op(FilterOperator.Contains, 'contains'),
  op(FilterOperator.NotContains, 'not contains'),
  op(FilterOperator.StartsWith, 'starts with'),
  op(FilterOperator.EndsWith, 'ends with'),
  op(FilterOperator.IsEmpty, 'is empty', false),
  op(FilterOperator.IsNotEmpty, 'is not empty', false),
  op(FilterOperator.Search, 'search'),
];

const NUMBER_OPERATORS: OperatorInfo[] = [
  op(FilterOperator.Equals, '='),
  op(FilterOperator.NotEquals, '!='),
  op(FilterOperator.Gt, '>'),
  op(FilterOperator.Gte, '>='),
  op(FilterOperator.Lt, '<'),
  op(FilterOperator.Lte, '<='),
  op(FilterOperator.IsEmpty, 'is empty', false),
  op(FilterOperator.IsNotEmpty, 'is not empty', false),
];

const BOOLEAN_OPERATORS: OperatorInfo[] = [
  op(FilterOperator.IsTrue, 'is true', false),
  op(FilterOperator.IsFalse, 'is false', false),
  op(FilterOperator.IsEmpty, 'is empty', false),
  op(FilterOperator.IsNotEmpty, 'is not empty', false),
];

const FOREIGN_KEY_OPERATORS: OperatorInfo[] = [
  op(FilterOperator.Equals, 'equals'),
  op(FilterOperator.NotEquals, 'not equals'),
  op(FilterOperator.IsEmpty, 'is empty', false),
  op(FilterOperator.IsNotEmpty, 'is not empty', false),
];

const DATETIME_OPERATORS: OperatorInfo[] = [
  op(FilterOperator.Equals, 'is'),
  op(FilterOperator.NotEquals, 'is not'),
  op(FilterOperator.Lt, 'before'),
  op(FilterOperator.Gt, 'after'),
  op(FilterOperator.Lte, 'on or before'),
  op(FilterOperator.Gte, 'on or after'),
];

export const OPERATORS_BY_TYPE: Readonly<
  Record<FilterFieldType, readonly OperatorInfo[]>
> = {
  [FilterFieldType.String]: STRING_OPERATORS,
  [FilterFieldType.Number]: NUMBER_OPERATORS,
  [FilterFieldType.Boolean]: BOOLEAN_OPERATORS,
  [FilterFieldType.ForeignKey]: FOREIGN_KEY_OPERATORS,
  [FilterFieldType.File]: STRING_OPERATORS,
  [FilterFieldType.DateTime]: DATETIME_OPERATORS,
};

export function getOperatorLabel(
  operator: FilterOperator,
  fieldType: FilterFieldType,
): string {
  const ops = OPERATORS_BY_TYPE[fieldType];
  const found = ops.find((o) => o.operator === operator);
  if (found) {
    return found.label;
  }
  return operator;
}

export function getDefaultOperator(fieldType: FilterFieldType): FilterOperator {
  const operators = OPERATORS_BY_TYPE[fieldType];
  const first = operators[0];
  if (!first) {
    throw new Error(`No operators defined for field type: ${fieldType}`);
  }
  return first.operator;
}

export function getOperatorsForType(
  fieldType: FilterFieldType,
): OperatorInfo[] {
  return [...OPERATORS_BY_TYPE[fieldType]];
}
