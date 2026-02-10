import { jest } from '@jest/globals';
import { FilterFieldType } from '../../../shared/field-types';
import type { ColumnSpec } from '../types';
import { ColumnsModel } from '../ColumnsModel';

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

describe('ColumnsModel', () => {
  let model: ColumnsModel;

  beforeEach(() => {
    model = new ColumnsModel();
  });

  describe('init', () => {
    it('stores all columns', () => {
      const columns = [col({ field: 'a' }), col({ field: 'b' })];
      model.init(columns);
      expect(model.visibleColumns.length + model.hiddenColumns.length).toBe(2);
    });

    it('selects defaults via selectDefaultColumns', () => {
      const columns = [
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
        col({ field: 'e' }),
      ];
      model.init(columns);
      expect(model.visibleColumns).toHaveLength(3);
    });

    it('builds lookup for field resolution', () => {
      const columns = [col({ field: 'title' }), col({ field: 'body' })];
      model.init(columns);
      expect(model.visibleColumns.every((c) => c.field)).toBe(true);
    });
  });

  describe('visibility', () => {
    it('showColumn adds column to visible', () => {
      const columns = [
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
      ];
      model.init(columns);
      expect(model.hiddenColumns.some((c) => c.field === 'd')).toBe(true);
      model.showColumn('d');
      expect(model.visibleColumns.some((c) => c.field === 'd')).toBe(true);
    });

    it('hideColumn removes column from visible', () => {
      const columns = [col({ field: 'a' }), col({ field: 'b' })];
      model.init(columns);
      model.hideColumn('a');
      expect(model.visibleColumns.some((c) => c.field === 'a')).toBe(false);
      expect(model.hiddenColumns.some((c) => c.field === 'a')).toBe(true);
    });

    it('visibleColumns and hiddenColumns are complementary', () => {
      const columns = [
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ];
      model.init(columns);
      const allFields = new Set([
        ...model.visibleColumns.map((c) => c.field),
        ...model.hiddenColumns.map((c) => c.field),
      ]);
      expect(allFields.size).toBe(3);
    });
  });

  describe('width', () => {
    it('setColumnWidth stores width', () => {
      model.init([col({ field: 'a' })]);
      model.setColumnWidth('a', 200);
      expect(model.getColumnWidth('a')).toBe(200);
    });

    it('getColumnWidth returns undefined for unset', () => {
      model.init([col({ field: 'a' })]);
      expect(model.getColumnWidth('a')).toBeUndefined();
    });

    it('observable.map tracks per-key', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.setColumnWidth('a', 100);
      model.setColumnWidth('b', 200);
      expect(model.getColumnWidth('a')).toBe(100);
      expect(model.getColumnWidth('b')).toBe(200);
    });
  });

  describe('reorder', () => {
    it('reorderColumns changes order', () => {
      const columns = [
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ];
      model.init(columns);
      model.reorderColumns(['c', 'a', 'b']);
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['c', 'a', 'b']);
    });

    it('visibleColumns reflects new order', () => {
      const columns = [col({ field: 'x' }), col({ field: 'y' })];
      model.init(columns);
      model.reorderColumns(['y', 'x']);
      expect(model.visibleColumns[0]?.field).toBe('y');
      expect(model.visibleColumns[1]?.field).toBe('x');
    });
  });

  describe('serialization', () => {
    it('serializeToViewColumns prefixes data fields', () => {
      const columns = [col({ field: 'title' }), col({ field: 'body' })];
      model.init(columns);
      model.reorderColumns(['title', 'body']);
      const result = model.serializeToViewColumns();
      expect(result).toEqual([{ field: 'data.title' }, { field: 'data.body' }]);
    });

    it('serializeToViewColumns keeps system fields as-is', () => {
      const columns = [
        col({ field: 'id', isSystem: true }),
        col({ field: 'title' }),
      ];
      model.init(columns);
      model.showColumn('id');
      model.reorderColumns(['id', 'title']);
      const result = model.serializeToViewColumns();
      expect(result[0]).toEqual({ field: 'id' });
      expect(result[1]).toEqual({ field: 'data.title' });
    });

    it('applyViewColumns restores state and ignores invalid fields', () => {
      const columns = [col({ field: 'title' }), col({ field: 'body' })];
      model.init(columns);
      model.applyViewColumns([
        { field: 'data.body', width: 150 },
        { field: 'data.nonexistent' },
      ]);
      expect(model.visibleColumns).toHaveLength(1);
      expect(model.visibleColumns[0]?.field).toBe('body');
      expect(model.getColumnWidth('body')).toBe(150);
    });
  });

  describe('fields', () => {
    it('sortableFields excludes deprecated', () => {
      const columns = [
        col({ field: 'active' }),
        col({ field: 'old', isDeprecated: true }),
      ];
      model.init(columns);
      expect(model.sortableFields).toHaveLength(1);
      expect(model.sortableFields[0]?.field).toBe('active');
    });

    it('filterableFields excludes deprecated', () => {
      const columns = [
        col({ field: 'active' }),
        col({ field: 'old', isDeprecated: true }),
      ];
      model.init(columns);
      expect(model.filterableFields).toHaveLength(1);
      expect(model.filterableFields[0]?.field).toBe('active');
    });
  });

  describe('resetToDefaults', () => {
    it('restores defaults and clears widths', () => {
      const columns = [
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
        col({ field: 'e' }),
      ];
      model.init(columns);
      model.showColumn('d');
      model.showColumn('e');
      model.setColumnWidth('a', 300);
      model.resetToDefaults();
      expect(model.visibleColumns).toHaveLength(3);
      expect(model.getColumnWidth('a')).toBeUndefined();
    });
  });

  describe('onChange', () => {
    it('callback fires on changes', () => {
      const onChange = jest.fn();
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
      ]);
      model.setOnChange(onChange);
      model.showColumn('d');
      expect(onChange).toHaveBeenCalled();
    });
  });
});
