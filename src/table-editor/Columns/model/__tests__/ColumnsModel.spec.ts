import { jest } from '@jest/globals';
import { testCol as col } from '../../../__tests__/helpers';
import { ColumnsModel } from '../ColumnsModel';

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

  describe('column management', () => {
    beforeEach(() => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
        col({ field: 'e' }),
      ]);
      model.reorderColumns(['a', 'b', 'c']);
    });

    it('getColumnIndex returns correct index', () => {
      expect(model.getColumnIndex('a')).toBe(0);
      expect(model.getColumnIndex('b')).toBe(1);
      expect(model.getColumnIndex('c')).toBe(2);
      expect(model.getColumnIndex('z')).toBe(-1);
    });

    it('canMoveLeft is false for first column', () => {
      expect(model.canMoveLeft('a')).toBe(false);
      expect(model.canMoveLeft('b')).toBe(true);
    });

    it('canMoveRight is false for last column', () => {
      expect(model.canMoveRight('c')).toBe(false);
      expect(model.canMoveRight('b')).toBe(true);
    });

    it('canMoveToStart is false for first column', () => {
      expect(model.canMoveToStart('a')).toBe(false);
      expect(model.canMoveToStart('b')).toBe(true);
    });

    it('canMoveToEnd is false for last column', () => {
      expect(model.canMoveToEnd('c')).toBe(false);
      expect(model.canMoveToEnd('b')).toBe(true);
    });

    it('moveColumnLeft swaps with predecessor', () => {
      model.moveColumnLeft('b');
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['b', 'a', 'c']);
    });

    it('moveColumnLeft on first column is no-op', () => {
      model.moveColumnLeft('a');
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['a', 'b', 'c']);
    });

    it('moveColumnRight swaps with successor', () => {
      model.moveColumnRight('b');
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['a', 'c', 'b']);
    });

    it('moveColumnRight on last column is no-op', () => {
      model.moveColumnRight('c');
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['a', 'b', 'c']);
    });

    it('moveColumnToStart moves column to index 0', () => {
      model.moveColumnToStart('c');
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['c', 'a', 'b']);
    });

    it('moveColumnToEnd moves column to last index', () => {
      model.moveColumnToEnd('a');
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['b', 'c', 'a']);
    });

    it('insertColumnBefore adds column at correct position', () => {
      model.insertColumnBefore('b', 'd');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'd',
        'b',
        'c',
      ]);
    });

    it('insertColumnAfter adds column at correct position', () => {
      model.insertColumnAfter('b', 'd');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'b',
        'd',
        'c',
      ]);
    });

    it('insertColumnBefore ignores already visible column', () => {
      model.insertColumnBefore('b', 'a');
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['a', 'b', 'c']);
    });

    it('insertColumnAfter ignores already visible column', () => {
      model.insertColumnAfter('b', 'c');
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['a', 'b', 'c']);
    });

    it('insertColumnBefore ignores invalid target', () => {
      model.insertColumnBefore('z', 'd');
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('bulk operations', () => {
    beforeEach(() => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
    });

    it('hideAll removes all visible columns', () => {
      model.hideAll();
      expect(model.visibleColumns).toHaveLength(0);
      expect(model.hiddenColumns).toHaveLength(3);
    });

    it('addAll shows all columns', () => {
      model.hideColumn('a');
      model.addAll();
      expect(model.visibleColumns).toHaveLength(3);
      expect(model.hiddenColumns).toHaveLength(0);
    });

    it('canRemoveColumn is true when columns visible', () => {
      expect(model.canRemoveColumn).toBe(true);
    });

    it('canRemoveColumn is false when no columns visible', () => {
      model.hideAll();
      expect(model.canRemoveColumn).toBe(false);
    });

    it('hasHiddenColumns is true when some hidden', () => {
      model.hideColumn('a');
      expect(model.hasHiddenColumns).toBe(true);
    });

    it('hasHiddenColumns is false when all visible', () => {
      model.addAll();
      expect(model.hasHiddenColumns).toBe(false);
    });
  });

  describe('available fields', () => {
    it('availableFieldsToAdd returns hidden non-system fields', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'sys', isSystem: true }),
        col({ field: 'c' }),
        col({ field: 'd' }),
      ]);
      const available = model.availableFieldsToAdd;
      const fields = available.map((c) => c.field);
      expect(fields).not.toContain('a');
      expect(fields).not.toContain('sys');
      expect(fields).toContain('d');
    });

    it('availableSystemFieldsToAdd returns hidden system fields', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'sys1', isSystem: true }),
        col({ field: 'sys2', isSystem: true }),
      ]);
      model.showColumn('sys1');
      const available = model.availableSystemFieldsToAdd;
      expect(available).toHaveLength(1);
      expect(available[0]?.field).toBe('sys2');
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

    it('callback fires on moveColumnLeft', () => {
      const onChange = jest.fn();
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.setOnChange(onChange);
      model.moveColumnLeft('b');
      expect(onChange).toHaveBeenCalled();
    });

    it('callback fires on insertColumnBefore', () => {
      const onChange = jest.fn();
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model.reorderColumns(['a', 'b']);
      model.setOnChange(onChange);
      model.insertColumnBefore('b', 'c');
      expect(onChange).toHaveBeenCalled();
    });

    it('callback fires on hideAll', () => {
      const onChange = jest.fn();
      model.init([col({ field: 'a' })]);
      model.setOnChange(onChange);
      model.hideAll();
      expect(onChange).toHaveBeenCalled();
    });

    it('callback fires on addAll', () => {
      const onChange = jest.fn();
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.hideColumn('b');
      model.setOnChange(onChange);
      model.addAll();
      expect(onChange).toHaveBeenCalled();
    });
  });
});
