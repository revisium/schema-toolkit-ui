import type { FilterFieldType } from '../../shared/field-types.js';
import type { FilterOperator } from './operators.js';

export interface FilterCondition {
  id: string;
  field: string;
  fieldType: FilterFieldType;
  operator: FilterOperator;
  value: string;
}

export interface FilterGroup {
  id: string;
  logic: 'and' | 'or';
  conditions: FilterCondition[];
  groups: FilterGroup[];
}
