import { obj, arr, str, num } from '@revisium/schema-toolkit';
import type { InferNode, InferValue } from '@revisium/schema-toolkit';

export const CONDITION_SCHEMA = obj({
  id: str(),
  field: str(),
  fieldType: str(),
  operator: str(),
  value: str(),
  searchLanguage: str(),
  searchType: str(),
});

export const NESTED_GROUP_SCHEMA = obj({
  id: str(),
  logic: str(),
  conditions: arr(CONDITION_SCHEMA),
});

export const FILTER_SCHEMA = obj({
  id: str(),
  logic: str(),
  conditions: arr(CONDITION_SCHEMA),
  groups: arr(NESTED_GROUP_SCHEMA),
  nextConditionId: num(),
  nextGroupId: num(),
});

export type ConditionNode = InferNode<typeof CONDITION_SCHEMA>;
export type NestedGroupNode = InferNode<typeof NESTED_GROUP_SCHEMA>;
export type FilterRootNode = InferNode<typeof FILTER_SCHEMA>;
export type FilterData = InferValue<typeof FILTER_SCHEMA>;
