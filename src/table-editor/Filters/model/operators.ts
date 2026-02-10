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

const ALL_OPERATORS: OperatorInfo[] = [
  { operator: FilterOperator.Equals, label: 'equals', requiresValue: true },
  {
    operator: FilterOperator.NotEquals,
    label: 'not equals',
    requiresValue: true,
  },
  { operator: FilterOperator.Contains, label: 'contains', requiresValue: true },
  {
    operator: FilterOperator.NotContains,
    label: 'not contains',
    requiresValue: true,
  },
  {
    operator: FilterOperator.StartsWith,
    label: 'starts with',
    requiresValue: true,
  },
  {
    operator: FilterOperator.EndsWith,
    label: 'ends with',
    requiresValue: true,
  },
  { operator: FilterOperator.IsEmpty, label: 'is empty', requiresValue: false },
  {
    operator: FilterOperator.IsNotEmpty,
    label: 'is not empty',
    requiresValue: false,
  },
  { operator: FilterOperator.Gt, label: '>', requiresValue: true },
  { operator: FilterOperator.Gte, label: '>=', requiresValue: true },
  { operator: FilterOperator.Lt, label: '<', requiresValue: true },
  { operator: FilterOperator.Lte, label: '<=', requiresValue: true },
  { operator: FilterOperator.IsTrue, label: 'is true', requiresValue: false },
  { operator: FilterOperator.IsFalse, label: 'is false', requiresValue: false },
];

const STRING_OPERATORS: FilterOperator[] = [
  FilterOperator.Equals,
  FilterOperator.NotEquals,
  FilterOperator.Contains,
  FilterOperator.NotContains,
  FilterOperator.StartsWith,
  FilterOperator.EndsWith,
  FilterOperator.IsEmpty,
  FilterOperator.IsNotEmpty,
];

const NUMBER_OPERATORS: FilterOperator[] = [
  FilterOperator.Equals,
  FilterOperator.NotEquals,
  FilterOperator.Gt,
  FilterOperator.Gte,
  FilterOperator.Lt,
  FilterOperator.Lte,
  FilterOperator.IsEmpty,
  FilterOperator.IsNotEmpty,
];

const BOOLEAN_OPERATORS: FilterOperator[] = [
  FilterOperator.IsTrue,
  FilterOperator.IsFalse,
  FilterOperator.IsEmpty,
  FilterOperator.IsNotEmpty,
];

const FOREIGN_KEY_OPERATORS: FilterOperator[] = [
  FilterOperator.Equals,
  FilterOperator.NotEquals,
  FilterOperator.IsEmpty,
  FilterOperator.IsNotEmpty,
];

export const OPERATORS_BY_TYPE: Readonly<
  Record<FilterFieldType, readonly FilterOperator[]>
> = {
  [FilterFieldType.String]: STRING_OPERATORS,
  [FilterFieldType.Number]: NUMBER_OPERATORS,
  [FilterFieldType.Boolean]: BOOLEAN_OPERATORS,
  [FilterFieldType.ForeignKey]: FOREIGN_KEY_OPERATORS,
  [FilterFieldType.File]: STRING_OPERATORS,
  [FilterFieldType.DateTime]: NUMBER_OPERATORS,
};

export function getOperatorInfo(operator: FilterOperator): OperatorInfo {
  const info = ALL_OPERATORS.find((o) => o.operator === operator);
  if (!info) {
    throw new Error(`Unknown operator: ${operator}`);
  }
  return info;
}

export function getDefaultOperator(fieldType: FilterFieldType): FilterOperator {
  const operators = OPERATORS_BY_TYPE[fieldType];
  const first = operators[0];
  if (!first) {
    throw new Error(`No operators defined for field type: ${fieldType}`);
  }
  return first;
}

export function getOperatorsForType(
  fieldType: FilterFieldType,
): OperatorInfo[] {
  const operators = OPERATORS_BY_TYPE[fieldType];
  return operators.map((op) => getOperatorInfo(op));
}
