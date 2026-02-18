import { jest } from '@jest/globals';
import { FilterFieldType } from '../../../shared/field-types';
import { testCol as col } from '../../../__tests__/helpers';
import { SortModel } from '../SortModel';

describe('SortModel', () => {
  let model: SortModel;

  beforeEach(() => {
    model = new SortModel();
    model.init([
      col({ field: 'name' }),
      col({ field: 'age', fieldType: FilterFieldType.Number }),
      col({ field: 'id', isSystem: true }),
    ]);
  });

  it('initial state has no sorts', () => {
    expect(model.sorts).toEqual([]);
    expect(model.hasSorts).toBe(false);
    expect(model.sortCount).toBe(0);
  });

  it('addSort adds entry', () => {
    model.addSort('name');
    expect(model.sorts).toHaveLength(1);
    expect(model.sorts[0]).toEqual({ field: 'name', direction: 'asc' });
  });

  it('addSort defaults to asc', () => {
    model.addSort('name');
    expect(model.sorts[0]?.direction).toBe('asc');
  });

  it('removeSort removes entry', () => {
    model.addSort('name');
    model.removeSort('name');
    expect(model.sorts).toHaveLength(0);
    expect(model.hasSorts).toBe(false);
  });

  it('toggleDirection flips direction', () => {
    model.addSort('name');
    expect(model.sorts[0]?.direction).toBe('asc');
    model.toggleDirection('name');
    expect(model.sorts[0]?.direction).toBe('desc');
    model.toggleDirection('name');
    expect(model.sorts[0]?.direction).toBe('asc');
  });

  it('reorderSorts updates order', () => {
    model.addSort('name');
    model.addSort('age');
    model.reorderSorts(['age', 'name']);
    expect(model.sorts.map((s) => s.field)).toEqual(['age', 'name']);
  });

  it('clearAll removes all sorts', () => {
    model.addSort('name');
    model.addSort('age');
    model.clearAll();
    expect(model.sorts).toHaveLength(0);
  });

  it('availableFields excludes already used', () => {
    model.addSort('name');
    const available = model.availableFields.map((f) => f.field);
    expect(available).not.toContain('name');
    expect(available).toContain('age');
    expect(available).toContain('id');
  });

  it('serializeToViewSorts with data. prefix', () => {
    model.addSort('name');
    model.addSort('id', 'desc');
    const result = model.serializeToViewSorts();
    expect(result).toEqual([
      { field: 'data.name', direction: 'asc' },
      { field: 'id', direction: 'desc' },
    ]);
  });

  it('applyViewSorts restores sorts', () => {
    model.applyViewSorts([
      { field: 'data.age', direction: 'desc' },
      { field: 'data.unknown', direction: 'asc' },
    ]);
    expect(model.sorts).toHaveLength(1);
    expect(model.sorts[0]).toEqual({ field: 'age', direction: 'desc' });
  });

  it('onChange fires on apply', () => {
    const onChange = jest.fn();
    model.setOnChange(onChange);
    model.addSort('name');
    expect(onChange).not.toHaveBeenCalled();
    model.apply();
    expect(onChange).toHaveBeenCalled();
  });

  it('applyViewSorts fires onChange', () => {
    const onChange = jest.fn();
    model.setOnChange(onChange);
    model.applyViewSorts([{ field: 'data.name', direction: 'asc' }]);
    expect(onChange).toHaveBeenCalled();
  });

  describe('draft/applied state', () => {
    it('initial state has no pending changes', () => {
      expect(model.hasPendingChanges).toBe(false);
    });

    it('initial state has no applied sorts', () => {
      expect(model.hasAppliedSorts).toBe(false);
      expect(model.appliedSortCount).toBe(0);
    });

    it('addSort creates pending changes', () => {
      model.addSort('name');
      expect(model.hasPendingChanges).toBe(true);
    });

    it('addSort does not affect applied sorts', () => {
      model.addSort('name');
      expect(model.hasAppliedSorts).toBe(false);
      expect(model.appliedSortCount).toBe(0);
    });

    it('apply commits draft to applied', () => {
      model.addSort('name');
      model.apply();
      expect(model.hasPendingChanges).toBe(false);
      expect(model.hasAppliedSorts).toBe(true);
      expect(model.appliedSortCount).toBe(1);
    });

    it('setDirection creates pending changes after apply', () => {
      model.addSort('name', 'asc');
      model.apply();
      expect(model.hasPendingChanges).toBe(false);

      model.setDirection('name', 'desc');
      expect(model.hasPendingChanges).toBe(true);
      expect(model.sorts[0]?.direction).toBe('desc');
    });

    it('setDirection does not fire onChange', () => {
      const onChange = jest.fn();
      model.setOnChange(onChange);
      model.addSort('name', 'asc');
      model.apply();
      onChange.mockClear();

      model.setDirection('name', 'desc');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('setDirection on non-existent field is noop', () => {
      model.addSort('name', 'asc');
      model.apply();
      model.setDirection('unknown', 'desc');
      expect(model.hasPendingChanges).toBe(false);
    });

    it('addSort after apply creates pending changes', () => {
      model.addSort('name');
      model.apply();
      expect(model.hasPendingChanges).toBe(false);

      model.addSort('age');
      expect(model.hasPendingChanges).toBe(true);
      expect(model.hasAppliedSorts).toBe(true);
      expect(model.appliedSortCount).toBe(1);
    });

    it('removeSort after apply creates pending changes', () => {
      model.addSort('name');
      model.apply();
      expect(model.hasPendingChanges).toBe(false);

      model.removeSort('name');
      expect(model.hasPendingChanges).toBe(true);
      expect(model.hasAppliedSorts).toBe(true);
    });

    it('clearAll resets both draft and applied', () => {
      model.addSort('name');
      model.addSort('age');
      model.apply();
      expect(model.hasAppliedSorts).toBe(true);

      model.clearAll();
      expect(model.hasPendingChanges).toBe(false);
      expect(model.hasAppliedSorts).toBe(false);
      expect(model.appliedSortCount).toBe(0);
    });

    it('clearAll fires onChange', () => {
      const onChange = jest.fn();
      model.setOnChange(onChange);
      model.addSort('name');
      model.apply();
      onChange.mockClear();

      model.clearAll();
      expect(onChange).toHaveBeenCalled();
    });

    it('applyViewSorts sets applied state', () => {
      model.applyViewSorts([{ field: 'data.name', direction: 'asc' }]);
      expect(model.hasPendingChanges).toBe(false);
      expect(model.hasAppliedSorts).toBe(true);
      expect(model.appliedSortCount).toBe(1);
    });

    it('toggleDirection creates pending changes after apply', () => {
      model.addSort('name', 'asc');
      model.apply();
      expect(model.hasPendingChanges).toBe(false);

      model.toggleDirection('name');
      expect(model.hasPendingChanges).toBe(true);
    });

    it('replaceField creates pending changes after apply', () => {
      model.addSort('name', 'asc');
      model.apply();
      expect(model.hasPendingChanges).toBe(false);

      model.replaceField('name', 'age');
      expect(model.hasPendingChanges).toBe(true);
    });

    it('multiple apply cycles work correctly', () => {
      model.addSort('name');
      model.apply();
      expect(model.appliedSortCount).toBe(1);

      model.addSort('age');
      model.apply();
      expect(model.appliedSortCount).toBe(2);
      expect(model.hasPendingChanges).toBe(false);
    });

    it('revert to same state as applied removes pending', () => {
      model.addSort('name', 'asc');
      model.apply();

      model.setDirection('name', 'desc');
      expect(model.hasPendingChanges).toBe(true);

      model.setDirection('name', 'asc');
      expect(model.hasPendingChanges).toBe(false);
    });
  });

  describe('badge state', () => {
    it('no badge when empty and no applied', () => {
      expect(model.hasSorts).toBe(false);
      expect(model.hasAppliedSorts).toBe(false);
      expect(model.hasPendingChanges).toBe(false);
    });

    it('pending badge when draft has sorts but not applied', () => {
      model.addSort('name');
      expect(model.hasSorts).toBe(true);
      expect(model.hasAppliedSorts).toBe(false);
      expect(model.hasPendingChanges).toBe(true);
    });

    it('applied badge when sorts are committed', () => {
      model.addSort('name');
      model.apply();
      expect(model.hasSorts).toBe(true);
      expect(model.hasAppliedSorts).toBe(true);
      expect(model.hasPendingChanges).toBe(false);
    });

    it('pending badge when applied sorts modified', () => {
      model.addSort('name', 'asc');
      model.apply();
      model.setDirection('name', 'desc');
      expect(model.hasAppliedSorts).toBe(true);
      expect(model.hasPendingChanges).toBe(true);
    });

    it('badge count reflects applied count not draft count', () => {
      model.addSort('name');
      model.apply();
      expect(model.appliedSortCount).toBe(1);

      model.addSort('age');
      expect(model.appliedSortCount).toBe(1);
      expect(model.sortCount).toBe(2);
    });
  });

  describe('header helpers', () => {
    it('getSortDirection returns null when not sorted', () => {
      expect(model.getSortDirection('name')).toBeNull();
    });

    it('getSortDirection returns direction when sorted', () => {
      model.addSort('name', 'desc');
      expect(model.getSortDirection('name')).toBe('desc');
    });

    it('getSortIndex returns null when not sorted', () => {
      expect(model.getSortIndex('name')).toBeNull();
    });

    it('getSortIndex returns 1-based index', () => {
      model.addSort('name');
      model.addSort('age');
      expect(model.getSortIndex('name')).toBe(1);
      expect(model.getSortIndex('age')).toBe(2);
    });

    it('isSorted returns false when not sorted', () => {
      expect(model.isSorted('name')).toBe(false);
    });

    it('isSorted returns true when sorted', () => {
      model.addSort('name');
      expect(model.isSorted('name')).toBe(true);
    });

    it('setSingleSort adds sort if not present', () => {
      model.setSingleSort('name', 'asc');
      expect(model.sorts).toHaveLength(1);
      expect(model.sorts[0]).toEqual({ field: 'name', direction: 'asc' });
    });

    it('setSingleSort updates direction if already sorted', () => {
      model.addSort('name', 'asc');
      model.setSingleSort('name', 'desc');
      expect(model.sorts).toHaveLength(1);
      expect(model.sorts[0]?.direction).toBe('desc');
    });

    it('setSingleSort preserves other sorts', () => {
      model.addSort('name', 'asc');
      model.setSingleSort('age', 'desc');
      expect(model.sorts).toHaveLength(2);
      expect(model.sorts[0]).toEqual({ field: 'name', direction: 'asc' });
      expect(model.sorts[1]).toEqual({ field: 'age', direction: 'desc' });
    });

    it('setSingleSort fires onChange', () => {
      const onChange = jest.fn();
      model.setOnChange(onChange);
      model.setSingleSort('name', 'asc');
      expect(onChange).toHaveBeenCalled();
    });
  });
});
