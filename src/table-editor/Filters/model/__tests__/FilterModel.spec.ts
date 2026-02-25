import { jest } from '@jest/globals';
import { FilterFieldType } from '../../../shared/field-types';
import { testCol as col } from '../../../__tests__/helpers';
import { FilterOperator } from '../operators';
import { SearchLanguage, SearchType } from '../searchTypes';
import { FilterModel } from '../FilterModel';
import { buildWhereClause } from '../filterBuilder';

describe('FilterModel', () => {
  let model: FilterModel;

  beforeEach(() => {
    model = new FilterModel();
    model.init([
      col({ field: 'data.name' }),
      col({ field: 'data.age', fieldType: FilterFieldType.Number }),
      col({ field: 'data.active', fieldType: FilterFieldType.Boolean }),
      col({ field: 'createdAt', fieldType: FilterFieldType.DateTime }),
    ]);
  });

  describe('conditions', () => {
    it('addCondition adds with defaults', () => {
      model.addCondition();
      expect(model.totalConditionCount).toBe(1);
      const condition = model.rootGroup.conditions[0];
      expect(condition?.field).toBe('data.name');
      expect(condition?.operator).toBe(FilterOperator.Equals);
      expect(condition?.value).toBe('');
    });

    it('updateCondition field resets operator and value when type changes', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      model.updateCondition(id, { field: 'data.active' });
      const condition = model.rootGroup.conditions[0];
      expect(condition?.field).toBe('data.active');
      expect(condition?.fieldType).toBe(FilterFieldType.Boolean);
      expect(condition?.operator).toBe(FilterOperator.IsTrue);
      expect(condition?.value).toBe('');
    });

    it('updateCondition field preserves value when same type', () => {
      model.init([
        col({ field: 'data.first_name' }),
        col({ field: 'data.last_name' }),
      ]);
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'Alice' });
      model.updateCondition(id, { field: 'data.last_name' });
      const condition = model.rootGroup.conditions[0];
      expect(condition?.field).toBe('data.last_name');
      expect(condition?.value).toBe('Alice');
    });

    it('updateCondition operator resets value', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      model.updateCondition(id, { operator: FilterOperator.Contains });
      expect(model.rootGroup.conditions[0]?.value).toBe('');
    });

    it('updateCondition value updates value', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'hello' });
      expect(model.rootGroup.conditions[0]?.value).toBe('hello');
    });

    it('removeCondition removes', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.removeCondition(id);
      expect(model.totalConditionCount).toBe(0);
    });

    it('default operator matches field type', () => {
      model.init([
        col({ field: 'data.active', fieldType: FilterFieldType.Boolean }),
      ]);
      model.addCondition();
      expect(model.rootGroup.conditions[0]?.operator).toBe(
        FilterOperator.IsTrue,
      );
    });
  });

  describe('search operator', () => {
    it('switching to search sets language and type defaults', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { operator: FilterOperator.Search });
      const condition = model.rootGroup.conditions[0];
      expect(condition?.operator).toBe(FilterOperator.Search);
      expect(condition?.searchLanguage).toBe(SearchLanguage.Simple);
      expect(condition?.searchType).toBe(SearchType.Plain);
    });

    it('switching away from search clears language and type', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { operator: FilterOperator.Search });
      model.updateCondition(id, { operator: FilterOperator.Equals });
      const condition = model.rootGroup.conditions[0];
      expect(condition?.searchLanguage).toBe('');
      expect(condition?.searchType).toBe('');
    });

    it('updateCondition searchLanguage', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { operator: FilterOperator.Search });
      model.updateCondition(id, {
        searchLanguage: SearchLanguage.English,
      });
      expect(model.rootGroup.conditions[0]?.searchLanguage).toBe(
        SearchLanguage.English,
      );
    });

    it('updateCondition searchType', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { operator: FilterOperator.Search });
      model.updateCondition(id, { searchType: SearchType.Phrase });
      expect(model.rootGroup.conditions[0]?.searchType).toBe(SearchType.Phrase);
    });
  });

  describe('groups', () => {
    it('addGroup adds nested group', () => {
      model.addGroup();
      expect(model.rootGroup.groups).toHaveLength(1);
    });

    it('removeGroup removes', () => {
      model.addGroup();
      const groupId = model.rootGroup.groups[0]!.id;
      model.removeGroup(groupId);
      expect(model.rootGroup.groups).toHaveLength(0);
    });

    it('setGroupLogic changes logic', () => {
      model.addGroup();
      const groupId = model.rootGroup.groups[0]!.id;
      model.setGroupLogic(groupId, 'or');
      expect(model.rootGroup.groups[0]?.logic).toBe('or');
    });

    it('nested group supports conditions', () => {
      model.addGroup();
      const groupId = model.rootGroup.groups[0]!.id;
      model.addCondition(groupId);
      expect(model.rootGroup.groups[0]?.conditions).toHaveLength(1);
      expect(model.totalConditionCount).toBe(1);
    });

    it('addCondition to specific group', () => {
      model.addGroup();
      const groupId = model.rootGroup.groups[0]!.id;
      model.addCondition(groupId);
      expect(model.rootGroup.conditions).toHaveLength(0);
      expect(model.rootGroup.groups[0]?.conditions).toHaveLength(1);
    });

    it('nested groups always have empty groups array', () => {
      model.addGroup();
      expect(model.rootGroup.groups[0]?.groups).toEqual([]);
    });
  });

  describe('validation', () => {
    it('valid condition with value', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      expect(model.isConditionValid(id)).toBe(true);
    });

    it('invalid condition with empty value', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      expect(model.isConditionValid(id)).toBe(false);
    });

    it('invalid number value', () => {
      model.init([
        col({ field: 'data.age', fieldType: FilterFieldType.Number }),
      ]);
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'abc' });
      expect(model.isConditionValid(id)).toBe(false);
    });

    it('valid datetime value', () => {
      model.init([
        col({ field: 'createdAt', fieldType: FilterFieldType.DateTime }),
      ]);
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: '2024-01-15T10:30:00.000Z' });
      expect(model.isConditionValid(id)).toBe(true);
    });

    it('invalid datetime value', () => {
      model.init([
        col({ field: 'createdAt', fieldType: FilterFieldType.DateTime }),
      ]);
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'not-a-date' });
      expect(model.isConditionValid(id)).toBe(false);
    });

    it('unary operator always valid', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { operator: FilterOperator.IsEmpty });
      expect(model.isConditionValid(id)).toBe(true);
    });

    it('allFiltersValid checks all conditions', () => {
      model.addCondition();
      expect(model.allFiltersValid).toBe(false);
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      expect(model.allFiltersValid).toBe(true);
    });

    it('getConditionError returns message', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      expect(model.getConditionError(id)).toBe('Value is required');
      model.updateCondition(id, { value: 'test' });
      expect(model.getConditionError(id)).toBeNull();
    });
  });

  describe('apply/reset', () => {
    it('apply snapshots current state', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      model.apply();
      expect(model.hasActiveFilters).toBe(true);
    });

    it('hasPendingChanges detects changes after apply', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      model.apply();
      expect(model.hasPendingChanges).toBe(false);
      model.updateCondition(id, { value: 'changed' });
      expect(model.hasPendingChanges).toBe(true);
    });

    it('reset reverts to applied state', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      model.apply();
      model.updateCondition(id, { value: 'changed' });
      model.reset();
      expect(model.rootGroup.conditions[0]?.value).toBe('test');
      expect(model.hasPendingChanges).toBe(false);
    });

    it('clearAll empties everything', () => {
      model.addCondition();
      model.apply();
      model.clearAll();
      expect(model.totalConditionCount).toBe(0);
      expect(model.hasActiveFilters).toBe(false);
      expect(model.isEmpty).toBe(true);
    });

    it('hasActiveFilters is false when empty group is applied', () => {
      model.apply();
      expect(model.hasActiveFilters).toBe(false);
    });

    it('init resets dirty state', () => {
      model.addCondition();
      model.init([
        col({ field: 'data.name' }),
        col({ field: 'data.age', fieldType: FilterFieldType.Number }),
        col({ field: 'data.active', fieldType: FilterFieldType.Boolean }),
      ]);
      expect(model.hasPendingChanges).toBe(false);
    });

    it('apply removes empty groups', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      model.addGroup();
      expect(model.rootGroup.groups).toHaveLength(1);
      model.apply();
      expect(model.rootGroup.groups).toHaveLength(0);
    });

    it('apply calls onApply with where clause', () => {
      const onApply = jest.fn();
      model.setOnApply(onApply);
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'Alice' });
      model.apply();
      expect(onApply).toHaveBeenCalledTimes(1);
      const expected = buildWhereClause(model.rootGroup);
      expect(onApply).toHaveBeenCalledWith(expected);
    });

    it('apply calls onApply with null when no conditions', () => {
      const onApply = jest.fn();
      model.setOnApply(onApply);
      model.apply();
      expect(onApply).toHaveBeenCalledWith(null);
    });

    it('clearAll calls onApply with null', () => {
      const onApply = jest.fn();
      model.setOnApply(onApply);
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      model.apply();
      onApply.mockClear();
      model.clearAll();
      expect(onApply).toHaveBeenCalledWith(null);
    });

    it('onApply not called when not set', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      expect(() => model.apply()).not.toThrow();
    });

    it('dispose clears onApply', () => {
      const onApply = jest.fn();
      model.setOnApply(onApply);
      model.dispose();
      model = new FilterModel();
      model.init([col({ field: 'data.name' })]);
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      model.apply();
      expect(onApply).not.toHaveBeenCalled();
    });

    it('apply builds correct where clause for multiple conditions', () => {
      const onApply = jest.fn();
      model.setOnApply(onApply);
      model.addCondition();
      model.addCondition();
      const c1 = model.rootGroup.conditions[0]!.id;
      const c2 = model.rootGroup.conditions[1]!.id;
      model.updateCondition(c1, { value: 'Alice' });
      model.updateCondition(c2, { field: 'data.age' });
      model.updateCondition(c2, { value: '25' });
      model.apply();
      expect(onApply).toHaveBeenCalledWith({
        AND: [
          { data: { path: 'name', equals: 'Alice' } },
          { data: { path: 'age', equals: 25 } },
        ],
      });
    });

    it('hasFilterForField returns false before apply', () => {
      model.addCondition();
      expect(model.hasFilterForField('data.name')).toBe(false);
    });

    it('hasFilterForField returns true for root condition after apply', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'Alice' });
      model.apply();
      expect(model.hasFilterForField('data.name')).toBe(true);
      expect(model.hasFilterForField('data.age')).toBe(false);
    });

    it('hasFilterForField returns true for group condition after apply', () => {
      model.addGroup();
      const groupId = model.rootGroup.groups[0]!.id;
      model.addCondition(groupId);
      const condId = model.rootGroup.groups[0]!.conditions[0]!.id;
      model.updateCondition(condId, { field: 'data.age' });
      model.updateCondition(condId, { value: '25' });
      model.apply();
      expect(model.hasFilterForField('data.age')).toBe(true);
      expect(model.hasFilterForField('data.name')).toBe(false);
    });

    it('hasFilterForField returns false after clearAll', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      model.apply();
      model.clearAll();
      expect(model.hasFilterForField('data.name')).toBe(false);
    });

    it('addConditionForField adds condition for specific field', () => {
      model.addConditionForField('data.age');
      expect(model.totalConditionCount).toBe(1);
      expect(model.rootGroup.conditions[0]?.field).toBe('data.age');
      expect(model.rootGroup.conditions[0]?.fieldType).toBe(
        FilterFieldType.Number,
      );
    });

    it('addConditionForField ignores unknown field', () => {
      model.addConditionForField('unknown');
      expect(model.totalConditionCount).toBe(0);
    });

    it('applySnapshot syncs next IDs to avoid collisions', () => {
      model.addCondition();
      model.addCondition();
      model.addCondition();
      model.apply();

      const rg = model.rootGroup;
      const snapshot = JSON.stringify({
        id: rg.id,
        logic: rg.logic,
        conditions: rg.conditions.map((c) => ({
          id: c.id,
          field: c.field,
          fieldType: c.fieldType,
          operator: c.operator,
          value: c.value,
        })),
        groups: [],
      });

      model.init([
        col({ field: 'data.name' }),
        col({ field: 'data.age', fieldType: FilterFieldType.Number }),
        col({ field: 'data.active', fieldType: FilterFieldType.Boolean }),
      ]);
      model.applySnapshot(snapshot);
      expect(model.totalConditionCount).toBe(3);

      model.addCondition();
      expect(model.totalConditionCount).toBe(4);
      const ids = model.rootGroup.conditions.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
