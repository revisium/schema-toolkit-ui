import { jest } from '@jest/globals';
import { FilterFieldType } from '../../../shared/field-types';
import type { ColumnSpec } from '../../../Columns/model/types';
import { SortModel } from '../SortModel';

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

  it('onChange fires on changes', () => {
    const onChange = jest.fn();
    model.setOnChange(onChange);
    model.addSort('name');
    expect(onChange).toHaveBeenCalled();
  });

  it('applyViewSorts fires onChange', () => {
    const onChange = jest.fn();
    model.setOnChange(onChange);
    model.applyViewSorts([{ field: 'data.name', direction: 'asc' }]);
    expect(onChange).toHaveBeenCalled();
  });
});
