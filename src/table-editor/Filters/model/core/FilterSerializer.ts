import type { createRowModel } from '@revisium/schema-toolkit';
import type { FILTER_SCHEMA, FilterData } from '../filterSchema.js';
import { syncNextIds } from '../utils/filterTreeUtils.js';
import { buildWhereClause } from '../utils/filterBuilder.js';
import type { FilterGroup } from '../types.js';

type FilterRowModel = ReturnType<typeof createRowModel<typeof FILTER_SCHEMA>>;

export class FilterSerializer {
  constructor(private readonly _row: FilterRowModel) {}

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

  buildCurrentWhereClause(): Record<string, unknown> | null {
    return buildWhereClause(this.serializeRootGroup());
  }

  applySnapshot(serialized: string): boolean {
    const parsed = JSON.parse(serialized) as FilterGroup;
    const ids = syncNextIds(parsed);
    const data = this._groupToData(
      parsed,
      ids.nextConditionId,
      ids.nextGroupId,
    );
    this._row.reset(data);
    return parsed.conditions.length > 0 || parsed.groups.length > 0;
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
}
