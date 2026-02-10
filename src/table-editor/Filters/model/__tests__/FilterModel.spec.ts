import { FilterFieldType } from '../../../shared/field-types';
import type { ColumnSpec } from '../../../Columns/model/types';
import { FilterOperator } from '../operators';
import { FilterModel } from '../FilterModel';

function col(overrides: Partial<ColumnSpec> & { field: string }): ColumnSpec {
  return {
    label: overrides.field,
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    ...overrides,
  };
}

describe('FilterModel', () => {
  let model: FilterModel;

  beforeEach(() => {
    model = new FilterModel();
    model.init([
      col({ field: 'name' }),
      col({ field: 'age', fieldType: FilterFieldType.Number }),
      col({ field: 'active', fieldType: FilterFieldType.Boolean }),
    ]);
  });

  describe('conditions', () => {
    it('addCondition adds with defaults', () => {
      model.addCondition();
      expect(model.totalConditionCount).toBe(1);
      const condition = model.rootGroup.conditions[0];
      expect(condition?.field).toBe('name');
      expect(condition?.operator).toBe(FilterOperator.Equals);
      expect(condition?.value).toBe('');
    });

    it('updateCondition field resets operator and value', () => {
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'test' });
      model.updateCondition(id, { field: 'active' });
      const condition = model.rootGroup.conditions[0];
      expect(condition?.field).toBe('active');
      expect(condition?.fieldType).toBe(FilterFieldType.Boolean);
      expect(condition?.operator).toBe(FilterOperator.IsTrue);
      expect(condition?.value).toBe('');
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
        col({ field: 'active', fieldType: FilterFieldType.Boolean }),
      ]);
      model.addCondition();
      expect(model.rootGroup.conditions[0]?.operator).toBe(
        FilterOperator.IsTrue,
      );
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
      model.init([col({ field: 'age', fieldType: FilterFieldType.Number })]);
      model.addCondition();
      const id = model.rootGroup.conditions[0]!.id;
      model.updateCondition(id, { value: 'abc' });
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

    it('applySnapshot syncs next IDs to avoid collisions', () => {
      model.addCondition();
      model.addCondition();
      model.addCondition();
      model.apply();
      const snapshot = JSON.stringify(model.rootGroup);

      model.init([
        col({ field: 'name' }),
        col({ field: 'age', fieldType: FilterFieldType.Number }),
        col({ field: 'active', fieldType: FilterFieldType.Boolean }),
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
