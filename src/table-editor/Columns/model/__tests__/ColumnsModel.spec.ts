import { jest } from '@jest/globals';
import { autorun } from 'mobx';
import { FilterFieldType } from '../../../shared/field-types';
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
        col({ field: 'f' }),
      ];
      model.init(columns);
      expect(model.visibleColumns).toHaveLength(4);
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
        col({ field: 'e' }),
      ];
      model.init(columns);
      expect(model.hiddenColumns.some((c) => c.field === 'e')).toBe(true);
      model.showColumn('e');
      expect(model.visibleColumns.some((c) => c.field === 'e')).toBe(true);
    });

    it('hideColumn removes column from visible', () => {
      const columns = [col({ field: 'a' }), col({ field: 'b' })];
      model.init(columns);
      model.hideColumn('a');
      expect(model.visibleColumns.some((c) => c.field === 'a')).toBe(false);
      expect(model.hiddenColumns.some((c) => c.field === 'a')).toBe(true);
    });

    it('hideColumn does not hide the last visible column', () => {
      const columns = [col({ field: 'a' }), col({ field: 'b' })];
      model.init(columns);
      model.hideColumn('a');
      expect(model.visibleColumns).toHaveLength(1);
      model.hideColumn('b');
      expect(model.visibleColumns).toHaveLength(1);
      expect(model.visibleColumns[0]?.field).toBe('b');
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

    it('sortableFields excludes File columns', () => {
      const columns = [
        col({ field: 'name' }),
        col({ field: 'avatar', fieldType: FilterFieldType.File }),
        col({ field: 'avatar.fileName' }),
        col({ field: 'avatar.size', fieldType: FilterFieldType.Number }),
      ];
      model.init(columns);
      const sortable = model.sortableFields.map((c) => c.field);
      expect(sortable).toContain('name');
      expect(sortable).toContain('avatar.fileName');
      expect(sortable).toContain('avatar.size');
      expect(sortable).not.toContain('avatar');
    });

    it('filterableFields excludes File columns', () => {
      const columns = [
        col({ field: 'name' }),
        col({ field: 'avatar', fieldType: FilterFieldType.File }),
        col({ field: 'avatar.url' }),
      ];
      model.init(columns);
      const filterable = model.filterableFields.map((c) => c.field);
      expect(filterable).toContain('name');
      expect(filterable).toContain('avatar.url');
      expect(filterable).not.toContain('avatar');
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
      expect(model.visibleColumns).toHaveLength(4);
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

    it('hideAll keeps the first visible column', () => {
      model.hideAll();
      expect(model.visibleColumns).toHaveLength(1);
      expect(model.visibleColumns[0]?.field).toBe('a');
      expect(model.hiddenColumns).toHaveLength(2);
    });

    it('addAll shows all columns', () => {
      model.hideColumn('a');
      model.addAll();
      expect(model.visibleColumns).toHaveLength(3);
      expect(model.hiddenColumns).toHaveLength(0);
    });

    it('canRemoveColumn is true when multiple columns visible', () => {
      expect(model.canRemoveColumn).toBe(true);
    });

    it('canRemoveColumn is false when only one column visible', () => {
      model.hideColumn('b');
      model.hideColumn('c');
      expect(model.visibleColumns).toHaveLength(1);
      expect(model.canRemoveColumn).toBe(false);
    });

    it('canRemoveColumn is false when no columns visible', () => {
      model.reorderColumns([]);
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
        col({ field: 'e' }),
      ]);
      const available = model.availableFieldsToAdd;
      const fields = available.map((c) => c.field);
      expect(fields).not.toContain('a');
      expect(fields).not.toContain('sys');
      expect(fields).toContain('e');
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

  describe('pinning', () => {
    beforeEach(() => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
        col({ field: 'e' }),
      ]);
      model.reorderColumns(['a', 'b', 'c', 'd', 'e']);
    });

    it('pinLeft moves column to end of pinned-left zone', () => {
      model.pinLeft('b');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'b',
        'a',
        'c',
        'd',
        'e',
      ]);
      expect(model.getPinState('b')).toBe('left');
    });

    it('pinRight moves column to start of pinned-right zone', () => {
      model.pinRight('d');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'b',
        'c',
        'e',
        'd',
      ]);
      expect(model.getPinState('d')).toBe('right');
    });

    it('multiple pinLeft preserves order', () => {
      model.pinLeft('a');
      model.pinLeft('c');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'c',
        'b',
        'd',
        'e',
      ]);
      expect(model.pinnedLeftCount).toBe(2);
    });

    it('multiple pinRight preserves order', () => {
      model.pinRight('e');
      model.pinRight('c');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'b',
        'd',
        'c',
        'e',
      ]);
      expect(model.pinnedRightCount).toBe(2);
    });

    it('unpin from left moves to start of middle zone', () => {
      model.pinLeft('a');
      model.pinLeft('b');
      model.unpin('a');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'b',
        'a',
        'c',
        'd',
        'e',
      ]);
      expect(model.getPinState('a')).toBeUndefined();
    });

    it('unpin from right moves to end of middle zone', () => {
      model.pinRight('d');
      model.pinRight('e');
      model.unpin('e');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'b',
        'c',
        'e',
        'd',
      ]);
      expect(model.getPinState('e')).toBeUndefined();
    });

    it('isPinned returns correct state', () => {
      expect(model.isPinned('a')).toBe(false);
      model.pinLeft('a');
      expect(model.isPinned('a')).toBe(true);
    });

    it('canPinLeft returns false when already pinned left', () => {
      model.pinLeft('a');
      expect(model.canPinLeft('a')).toBe(false);
      expect(model.canPinRight('a')).toBe(true);
    });

    it('canPinRight returns false when already pinned right', () => {
      model.pinRight('a');
      expect(model.canPinRight('a')).toBe(false);
      expect(model.canPinLeft('a')).toBe(true);
    });

    it('canUnpin returns false for unpinned column', () => {
      expect(model.canUnpin('a')).toBe(false);
      model.pinLeft('a');
      expect(model.canUnpin('a')).toBe(true);
    });

    it('hideColumn also unpins', () => {
      model.pinLeft('a');
      expect(model.isPinned('a')).toBe(true);
      model.hideColumn('a');
      expect(model.isPinned('a')).toBe(false);
    });

    it('resetToDefaults clears pins', () => {
      model.pinLeft('a');
      model.pinRight('e');
      model.resetToDefaults();
      expect(model.pinnedLeftCount).toBe(0);
      expect(model.pinnedRightCount).toBe(0);
    });

    it('hideAll clears pins', () => {
      model.pinLeft('a');
      model.pinRight('e');
      model.hideAll();
      expect(model.pinnedLeftCount).toBe(0);
      expect(model.pinnedRightCount).toBe(0);
    });

    it('showColumn inserts before pinned-right zone', () => {
      model.hideColumn('c');
      model.pinRight('e');
      model.showColumn('c');
      const fields = model.visibleColumns.map((c) => c.field);
      const cIndex = fields.indexOf('c');
      const eIndex = fields.indexOf('e');
      expect(cIndex).toBeLessThan(eIndex);
    });

    it('showColumn inserts before pinned-right zone with multiple pins', () => {
      model.hideColumn('c');
      model.pinRight('d');
      model.pinRight('e');
      model.showColumn('c');
      const fields = model.visibleColumns.map((c) => c.field);
      const cIndex = fields.indexOf('c');
      const dIndex = fields.indexOf('d');
      expect(cIndex).toBeLessThan(dIndex);
    });

    it('addAll places columns before pinned-right zone', () => {
      model.hideColumn('c');
      model.pinRight('e');
      model.addAll();
      const fields = model.visibleColumns.map((c) => c.field);
      const cIndex = fields.indexOf('c');
      const eIndex = fields.indexOf('e');
      expect(cIndex).toBeLessThan(eIndex);
    });

    it('pinLeft then pinRight re-pins to right', () => {
      model.pinLeft('b');
      model.pinRight('b');
      expect(model.getPinState('b')).toBe('right');
      expect(model.pinnedLeftCount).toBe(0);
      expect(model.pinnedRightCount).toBe(1);
    });

    it('insertColumnBefore between two pinned-left auto-pins', () => {
      model.pinLeft('a');
      model.pinLeft('b');
      model.hideColumn('d');
      // [a, b, c, e] → insert d before b → between a(pinLeft) and b(pinLeft)
      model.insertColumnBefore('b', 'd');
      expect(model.getPinState('d')).toBe('left');
      expect(model.pinnedLeftCount).toBe(3);
    });

    it('insertColumnAfter between two pinned-left auto-pins', () => {
      model.pinLeft('a');
      model.pinLeft('b');
      model.hideColumn('d');
      // [a, b, c, e] → insert d after a → between a(pinLeft) and b(pinLeft)
      model.insertColumnAfter('a', 'd');
      expect(model.getPinState('d')).toBe('left');
      expect(model.pinnedLeftCount).toBe(3);
    });

    it('insertColumnBefore between two pinned-right auto-pins', () => {
      model.pinRight('d');
      model.pinRight('e');
      model.hideColumn('c');
      // [a, b, e, d] → insert c before d → between e(pinRight) and d(pinRight)
      model.insertColumnBefore('d', 'c');
      expect(model.getPinState('c')).toBe('right');
      expect(model.pinnedRightCount).toBe(3);
    });

    it('insertColumnAfter between two pinned-right auto-pins', () => {
      model.pinRight('d');
      model.pinRight('e');
      model.hideColumn('c');
      // [a, b, e, d] → insert c after e → between e(pinRight) and d(pinRight)
      model.insertColumnAfter('e', 'c');
      expect(model.getPinState('c')).toBe('right');
      expect(model.pinnedRightCount).toBe(3);
    });

    it('insertColumnAfter last pinned-left does not auto-pin', () => {
      model.pinLeft('a');
      model.pinLeft('b');
      model.hideColumn('d');
      // [a, b, c, e] → insert d after b → after pinLeft zone boundary
      model.insertColumnAfter('b', 'd');
      expect(model.getPinState('d')).toBeUndefined();
      expect(model.pinnedLeftCount).toBe(2);
    });

    it('insertColumnAfter single pinned-left does not auto-pin', () => {
      model.pinLeft('a');
      model.hideColumn('d');
      // [a, b, c, e] → insert d after a → after pinLeft zone boundary
      model.insertColumnAfter('a', 'd');
      expect(model.getPinState('d')).toBeUndefined();
      expect(model.pinnedLeftCount).toBe(1);
    });

    it('insertColumnBefore first pinned-right does not auto-pin', () => {
      model.pinRight('d');
      model.pinRight('e');
      model.hideColumn('c');
      // [a, b, e, d] → insert c before e → before pinRight zone boundary
      model.insertColumnBefore('e', 'c');
      expect(model.getPinState('c')).toBeUndefined();
      expect(model.pinnedRightCount).toBe(2);
    });

    it('insertColumnBefore single pinned-right does not auto-pin', () => {
      model.pinRight('e');
      model.hideColumn('d');
      // [a, b, c, e] → insert d before e → before pinRight zone boundary
      model.insertColumnBefore('e', 'd');
      expect(model.getPinState('d')).toBeUndefined();
      expect(model.pinnedRightCount).toBe(1);
    });

    it('insertColumnAfter last pinned-right does not auto-pin', () => {
      model.pinRight('d');
      model.pinRight('e');
      model.hideColumn('c');
      // [a, b, e, d] → insert c after d → after last pinRight (end of array)
      model.insertColumnAfter('d', 'c');
      expect(model.getPinState('c')).toBeUndefined();
      expect(model.pinnedRightCount).toBe(2);
    });

    it('insertColumnBefore first pinned-left does not auto-pin', () => {
      model.pinLeft('a');
      model.pinLeft('b');
      model.hideColumn('d');
      // [a, b, c, e] → insert d before a → before first pinLeft
      model.insertColumnBefore('a', 'd');
      expect(model.getPinState('d')).toBeUndefined();
      expect(model.pinnedLeftCount).toBe(2);
    });

    it('insertColumnBefore unpinned target does not auto-pin', () => {
      model.pinLeft('a');
      model.hideColumn('d');
      model.insertColumnBefore('c', 'd');
      expect(model.getPinState('d')).toBeUndefined();
    });

    it('insertColumnAfter unpinned target does not auto-pin', () => {
      model.pinLeft('a');
      model.pinRight('e');
      model.hideColumn('d');
      model.insertColumnAfter('c', 'd');
      expect(model.getPinState('d')).toBeUndefined();
    });
  });

  describe('pinning — zone-aware movement', () => {
    beforeEach(() => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
        col({ field: 'e' }),
      ]);
      model.reorderColumns(['a', 'b', 'c', 'd', 'e']);
      model.pinLeft('a');
      model.pinRight('e');
    });

    it('canMoveLeft respects pinned-left boundary', () => {
      expect(model.canMoveLeft('b')).toBe(false);
      expect(model.canMoveLeft('c')).toBe(true);
    });

    it('canMoveRight respects pinned-right boundary', () => {
      expect(model.canMoveRight('d')).toBe(false);
      expect(model.canMoveRight('c')).toBe(true);
    });

    it('moveColumnLeft does not cross into left zone', () => {
      model.moveColumnLeft('b');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'b',
        'c',
        'd',
        'e',
      ]);
    });

    it('moveColumnRight does not cross into right zone', () => {
      model.moveColumnRight('d');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'b',
        'c',
        'd',
        'e',
      ]);
    });

    it('moveColumnToStart moves to start of zone', () => {
      model.moveColumnToStart('d');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'd',
        'b',
        'c',
        'e',
      ]);
    });

    it('moveColumnToEnd moves to end of zone', () => {
      model.moveColumnToEnd('b');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'c',
        'd',
        'b',
        'e',
      ]);
    });

    it('move within pinned-left zone works', () => {
      model.pinLeft('b');
      expect(model.canMoveLeft('b')).toBe(true);
      model.moveColumnLeft('b');
      expect(model.visibleColumns.map((c) => c.field)).toEqual([
        'b',
        'a',
        'c',
        'd',
        'e',
      ]);
    });
  });

  describe('pinning — sticky offsets', () => {
    beforeEach(() => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
        col({ field: 'e' }),
      ]);
      model.reorderColumns(['a', 'b', 'c', 'd', 'e']);
    });

    it('getColumnStickyLeft returns undefined for unpinned', () => {
      expect(model.getColumnStickyLeft('a', 0)).toBeUndefined();
    });

    it('getColumnStickyLeft returns selectionWidth for first pinned-left', () => {
      model.pinLeft('a');
      expect(model.getColumnStickyLeft('a', 40)).toBe(40);
      expect(model.getColumnStickyLeft('a', 0)).toBe(0);
    });

    it('getColumnStickyLeft cumulates widths', () => {
      model.pinLeft('a');
      model.setColumnWidth('a', 200);
      model.pinLeft('b');
      expect(model.getColumnStickyLeft('b', 40)).toBe(240);
    });

    it('getColumnStickyRight returns undefined for unpinned', () => {
      expect(model.getColumnStickyRight('a')).toBeUndefined();
    });

    it('getColumnStickyRight returns 0 for last pinned-right', () => {
      model.pinRight('e');
      expect(model.getColumnStickyRight('e')).toBe(0);
    });

    it('getColumnStickyRight cumulates widths of columns after', () => {
      model.pinRight('d');
      model.pinRight('e');
      model.setColumnWidth('d', 200);
      expect(model.getColumnStickyRight('e')).toBe(200);
    });

    it('isStickyLeftBoundary is true for rightmost pinned-left', () => {
      model.pinLeft('a');
      model.pinLeft('b');
      expect(model.isStickyLeftBoundary('a')).toBe(false);
      expect(model.isStickyLeftBoundary('b')).toBe(true);
    });

    it('isStickyRightBoundary is true for leftmost pinned-right', () => {
      model.pinRight('d');
      model.pinRight('e');
      expect(model.isStickyRightBoundary('e')).toBe(true);
      expect(model.isStickyRightBoundary('d')).toBe(false);
    });

    it('resolveColumnWidth returns default for unset', () => {
      expect(model.resolveColumnWidth('a')).toBe(150);
    });

    it('resolveColumnWidth returns set width', () => {
      model.setColumnWidth('a', 300);
      expect(model.resolveColumnWidth('a')).toBe(300);
    });
  });

  describe('pinning — serialization round-trip', () => {
    it('serialize includes pinned state', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.reorderColumns(['a', 'b']);
      model.pinLeft('a');
      const result = model.serializeToViewColumns();
      expect(result[0]).toEqual({ field: 'data.a', pinned: 'left' });
      expect(result[1]).toEqual({ field: 'data.b' });
    });

    it('apply restores pinned state', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.applyViewColumns([
        { field: 'data.a', pinned: 'left' },
        { field: 'data.b', pinned: 'right' },
      ]);
      expect(model.getPinState('a')).toBe('left');
      expect(model.getPinState('b')).toBe('right');
    });

    it('round-trip preserves pinned state', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model.reorderColumns(['a', 'b', 'c']);
      model.pinLeft('a');
      model.pinRight('c');
      model.setColumnWidth('b', 200);
      const serialized = model.serializeToViewColumns();

      const model2 = new ColumnsModel();
      model2.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model2.applyViewColumns(serialized);
      expect(model2.getPinState('a')).toBe('left');
      expect(model2.getPinState('c')).toBe('right');
      expect(model2.getColumnWidth('b')).toBe(200);
      expect(model2.visibleColumns.map((c) => c.field)).toEqual([
        'a',
        'b',
        'c',
      ]);
    });

    it('serialize pinned-left with width', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.reorderColumns(['a', 'b']);
      model.pinLeft('a');
      model.setColumnWidth('a', 250);
      const result = model.serializeToViewColumns();
      expect(result[0]).toEqual({
        field: 'data.a',
        pinned: 'left',
        width: 250,
      });
    });

    it('serialize pinned-right with width', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.reorderColumns(['a', 'b']);
      model.pinRight('b');
      model.setColumnWidth('b', 300);
      const result = model.serializeToViewColumns();
      expect(result[1]).toEqual({
        field: 'data.b',
        pinned: 'right',
        width: 300,
      });
    });

    it('serialize pinned-right without width', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.reorderColumns(['a', 'b']);
      model.pinRight('b');
      const result = model.serializeToViewColumns();
      expect(result[1]).toEqual({ field: 'data.b', pinned: 'right' });
    });

    it('apply restores pinned-left with width', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.applyViewColumns([
        { field: 'data.a', pinned: 'left', width: 250 },
        { field: 'data.b' },
      ]);
      expect(model.getPinState('a')).toBe('left');
      expect(model.getColumnWidth('a')).toBe(250);
    });

    it('apply restores pinned-right with width', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.applyViewColumns([
        { field: 'data.a' },
        { field: 'data.b', pinned: 'right', width: 300 },
      ]);
      expect(model.getPinState('b')).toBe('right');
      expect(model.getColumnWidth('b')).toBe(300);
    });

    it('apply restores pinned without width (uses default)', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.applyViewColumns([
        { field: 'data.a', pinned: 'left' },
        { field: 'data.b' },
      ]);
      expect(model.getPinState('a')).toBe('left');
      expect(model.getColumnWidth('a')).toBeUndefined();
      expect(model.resolveColumnWidth('a')).toBe(150);
    });

    it('round-trip preserves all pin+width combinations', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
      ]);
      model.reorderColumns(['a', 'b', 'c', 'd']);
      model.pinLeft('a');
      model.setColumnWidth('a', 200);
      model.setColumnWidth('c', 180);
      model.pinRight('d');

      const serialized = model.serializeToViewColumns();
      expect(serialized).toEqual([
        { field: 'data.a', pinned: 'left', width: 200 },
        { field: 'data.b' },
        { field: 'data.c', width: 180 },
        { field: 'data.d', pinned: 'right' },
      ]);

      const model2 = new ColumnsModel();
      model2.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
      ]);
      model2.applyViewColumns(serialized);
      expect(model2.getPinState('a')).toBe('left');
      expect(model2.getColumnWidth('a')).toBe(200);
      expect(model2.getPinState('b')).toBeUndefined();
      expect(model2.getColumnWidth('b')).toBeUndefined();
      expect(model2.getPinState('c')).toBeUndefined();
      expect(model2.getColumnWidth('c')).toBe(180);
      expect(model2.getPinState('d')).toBe('right');
      expect(model2.getColumnWidth('d')).toBeUndefined();
    });
  });

  describe('pinning — zone order validation', () => {
    it('valid zone order: left, none, right', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model.applyViewColumns([
        { field: 'data.a', pinned: 'left' },
        { field: 'data.b' },
        { field: 'data.c', pinned: 'right' },
      ]);
      expect(model.getPinState('a')).toBe('left');
      expect(model.getPinState('b')).toBeUndefined();
      expect(model.getPinState('c')).toBe('right');
    });

    it('valid zone order: all left', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.applyViewColumns([
        { field: 'data.a', pinned: 'left' },
        { field: 'data.b', pinned: 'left' },
      ]);
      expect(model.getPinState('a')).toBe('left');
      expect(model.getPinState('b')).toBe('left');
    });

    it('valid zone order: all right', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.applyViewColumns([
        { field: 'data.a', pinned: 'right' },
        { field: 'data.b', pinned: 'right' },
      ]);
      expect(model.getPinState('a')).toBe('right');
      expect(model.getPinState('b')).toBe('right');
    });

    it('valid zone order: all none', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.applyViewColumns([{ field: 'data.a' }, { field: 'data.b' }]);
      expect(model.getPinState('a')).toBeUndefined();
      expect(model.getPinState('b')).toBeUndefined();
    });

    it('invalid: right before left — ignores all pinned', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model.applyViewColumns([
        { field: 'data.a', pinned: 'right' },
        { field: 'data.b', pinned: 'left' },
        { field: 'data.c' },
      ]);
      expect(model.getPinState('a')).toBeUndefined();
      expect(model.getPinState('b')).toBeUndefined();
      expect(model.getPinState('c')).toBeUndefined();
    });

    it('invalid: left after none — ignores all pinned', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model.applyViewColumns([
        { field: 'data.a', pinned: 'left' },
        { field: 'data.b' },
        { field: 'data.c', pinned: 'left' },
      ]);
      expect(model.getPinState('a')).toBeUndefined();
      expect(model.getPinState('b')).toBeUndefined();
      expect(model.getPinState('c')).toBeUndefined();
    });

    it('invalid: none after right — ignores all pinned', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model.applyViewColumns([
        { field: 'data.a', pinned: 'right' },
        { field: 'data.b' },
        { field: 'data.c' },
      ]);
      expect(model.getPinState('a')).toBeUndefined();
      expect(model.getPinState('b')).toBeUndefined();
      expect(model.getPinState('c')).toBeUndefined();
    });

    it('invalid zone order preserves widths and field order', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model.applyViewColumns([
        { field: 'data.a', pinned: 'right', width: 200 },
        { field: 'data.b', pinned: 'left', width: 300 },
        { field: 'data.c' },
      ]);
      expect(model.getPinState('a')).toBeUndefined();
      expect(model.getPinState('b')).toBeUndefined();
      expect(model.getColumnWidth('a')).toBe(200);
      expect(model.getColumnWidth('b')).toBe(300);
      expect(model.visibleColumns.map((c) => c.field)).toEqual(['a', 'b', 'c']);
    });
  });

  describe('resize performance', () => {
    it('setColumnWidth does not fire onChange', () => {
      const onChange = jest.fn();
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.setOnChange(onChange);

      model.setColumnWidth('a', 100);
      model.setColumnWidth('a', 150);
      model.setColumnWidth('a', 200);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('commitColumnWidth fires onChange', () => {
      const onChange = jest.fn();
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.setOnChange(onChange);

      model.setColumnWidth('a', 200);
      model.commitColumnWidth();

      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it('setColumnWidth updates width without notification', () => {
      const onChange = jest.fn();
      model.init([col({ field: 'a' })]);
      model.setOnChange(onChange);

      model.setColumnWidth('a', 250);

      expect(model.getColumnWidth('a')).toBe(250);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('sticky offset does not re-trigger autorun on setColumnWidth', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model.reorderColumns(['a', 'b', 'c']);
      model.pinLeft('a');
      model.pinLeft('b');

      const spy = jest.fn();
      const dispose = autorun(() => {
        model.getColumnStickyLeft('b', 0);
        spy();
      });

      expect(spy).toHaveBeenCalledTimes(1);

      model.setColumnWidth('a', 200);
      model.setColumnWidth('a', 250);
      model.setColumnWidth('a', 300);

      expect(spy).toHaveBeenCalledTimes(1);
      dispose();
    });

    it('sticky right offset does not re-trigger autorun on setColumnWidth', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
      ]);
      model.reorderColumns(['a', 'b', 'c', 'd']);
      model.pinRight('b');
      model.pinRight('c');

      const spy = jest.fn();
      const dispose = autorun(() => {
        model.getColumnStickyRight('c');
        spy();
      });

      expect(spy).toHaveBeenCalledTimes(1);

      model.setColumnWidth('b', 200);
      model.setColumnWidth('b', 250);

      expect(spy).toHaveBeenCalledTimes(1);
      dispose();
    });

    it('resolveColumnWidth for sticky col does not re-trigger autorun on setColumnWidth', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.reorderColumns(['a', 'b']);
      model.pinLeft('a');

      const spy = jest.fn();
      const dispose = autorun(() => {
        model.resolveColumnWidth('a');
        spy();
      });

      expect(spy).toHaveBeenCalledTimes(1);

      model.setColumnWidth('a', 200);
      model.setColumnWidth('a', 250);

      expect(spy).toHaveBeenCalledTimes(1);
      dispose();
    });

    it('isResizing is false initially', () => {
      model.init([col({ field: 'a' })]);
      expect(model.isResizing).toBe(false);
    });

    it('isResizing is true after setColumnWidth', () => {
      model.init([col({ field: 'a' })]);
      model.setColumnWidth('a', 200);
      expect(model.isResizing).toBe(true);
    });

    it('isResizing is false after commitColumnWidth', () => {
      model.init([col({ field: 'a' })]);
      model.setColumnWidth('a', 200);
      model.commitColumnWidth();
      expect(model.isResizing).toBe(false);
    });

    it('columnWidthCssVars does not re-trigger autorun during resize drag', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);

      model.setColumnWidth('a', 100);

      const spy = jest.fn();
      const dispose = autorun(() => {
        void model.columnWidthCssVars;
        spy();
      });

      expect(spy).toHaveBeenCalledTimes(1);

      model.setColumnWidth('a', 200);
      model.setColumnWidth('a', 250);
      model.setColumnWidth('a', 300);

      expect(spy).toHaveBeenCalledTimes(1);
      dispose();
    });

    it('columnWidthCssVars updates after commitColumnWidth', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);

      model.setColumnWidth('a', 200);
      model.setColumnWidth('a', 300);
      model.commitColumnWidth();

      expect(model.columnWidthCssVars['--cw-a']).toBe('300px');
    });

    it('getWidthCssVarsDuringResize returns live values during drag', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);

      model.setColumnWidth('a', 200);
      const vars = model.getWidthCssVarsDuringResize();
      expect(vars['--cw-a']).toBe('200px');
      expect(vars['--cw-b']).toBe('150px');

      model.setColumnWidth('a', 300);
      const vars2 = model.getWidthCssVarsDuringResize();
      expect(vars2['--cw-a']).toBe('300px');
    });

    it('setColumnWidth uses escaped CSS var for dotted field on wrapper element', () => {
      const el = document.createElement('div');
      model.init([col({ field: 'avatar.status' })]);
      model.setWrapperElement(el);

      model.setColumnWidth('avatar.status', 200);

      expect(el.style.getPropertyValue('--cw-avatar-status')).toBe('200px');
    });

    it('getWidthCssVarsDuringResize escapes dots in field names', () => {
      model.init([col({ field: 'avatar' }), col({ field: 'avatar.status' })]);

      model.setColumnWidth('avatar.status', 200);
      const vars = model.getWidthCssVarsDuringResize();
      expect(vars['--cw-avatar']).toBe('150px');
      expect(vars['--cw-avatar-status']).toBe('200px');
    });
  });

  describe('columnWidthCssVar', () => {
    it('returns var with default width for regular field', () => {
      model.init([col({ field: 'name' })]);
      expect(model.columnWidthCssVar('name')).toBe('var(--cw-name, 150px)');
    });

    it('returns var with id default width for id field', () => {
      model.init([col({ field: 'id' })]);
      expect(model.columnWidthCssVar('id')).toBe('var(--cw-id, 240px)');
    });

    it('escapes dots in field name for CSS var', () => {
      model.init([col({ field: 'avatar.status' })]);
      expect(model.columnWidthCssVar('avatar.status')).toBe(
        'var(--cw-avatar-status, 150px)',
      );
    });
  });

  describe('columnWidthCssVars', () => {
    it('returns CSS vars for all visible fields with defaults', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      const vars = model.columnWidthCssVars;
      expect(vars['--cw-a']).toBe('150px');
      expect(vars['--cw-b']).toBe('150px');
    });

    it('returns custom width when set', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.setColumnWidth('a', 200);
      const vars = model.columnWidthCssVars;
      expect(vars['--cw-a']).toBe('200px');
      expect(vars['--cw-b']).toBe('150px');
    });

    it('returns id default for id column', () => {
      model.init([col({ field: 'id' }), col({ field: 'a' })]);
      const vars = model.columnWidthCssVars;
      expect(vars['--cw-id']).toBe('240px');
    });

    it('does not include hidden fields', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.hideColumn('b');
      const vars = model.columnWidthCssVars;
      expect(vars['--cw-a']).toBeDefined();
      expect(vars['--cw-b']).toBeUndefined();
    });

    it('escapes dots in field names for CSS var keys', () => {
      model.init([col({ field: 'avatar' }), col({ field: 'avatar.status' })]);
      const vars = model.columnWidthCssVars;
      expect(vars['--cw-avatar']).toBe('150px');
      expect(vars['--cw-avatar-status']).toBe('150px');
    });
  });

  describe('getColumnStickyLeftCss', () => {
    it('returns undefined for non-pinned column', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      expect(model.getColumnStickyLeftCss('a', 0)).toBeUndefined();
    });

    it('returns 0px for first left-pinned column without selection', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.pinLeft('a');
      expect(model.getColumnStickyLeftCss('a', 0)).toBe('0px');
    });

    it('returns selection width for first left-pinned column with selection', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.pinLeft('a');
      expect(model.getColumnStickyLeftCss('a', 40)).toBe('40px');
    });

    it('returns css var offset for second left-pinned column', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model.pinLeft('a');
      model.pinLeft('b');
      expect(model.getColumnStickyLeftCss('b', 0)).toBe('var(--cw-a, 150px)');
    });

    it('returns calc with selection and multiple pinned columns', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
      ]);
      model.pinLeft('a');
      model.pinLeft('b');
      expect(model.getColumnStickyLeftCss('b', 40)).toBe(
        'calc(40px + var(--cw-a, 150px))',
      );
    });

    it('escapes dots in pinned dotted field name', () => {
      model.init([
        col({ field: 'avatar.status' }),
        col({ field: 'avatar.url' }),
        col({ field: 'c' }),
      ]);
      model.pinLeft('avatar.status');
      model.pinLeft('avatar.url');
      expect(model.getColumnStickyLeftCss('avatar.url', 0)).toBe(
        'var(--cw-avatar-status, 150px)',
      );
    });
  });

  describe('getColumnStickyRightCss', () => {
    it('returns undefined for non-pinned column', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      expect(model.getColumnStickyRightCss('a')).toBeUndefined();
    });

    it('returns 0px for last right-pinned column', () => {
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
      model.pinRight('b');
      expect(model.getColumnStickyRightCss('b')).toBe('0px');
    });

    it('returns css var offset for non-last right-pinned column', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
      ]);
      model.pinRight('c');
      model.pinRight('d');
      // pinRight inserts at start of right zone:
      // pinRight('c'): [a, b, d, c]   (c = right)
      // pinRight('d'): [a, b, d, c]   (d = right, c = right)
      // Right zone order: d, c. d has c after it.
      expect(model.getColumnStickyRightCss('d')).toBe('var(--cw-c, 150px)');
    });

    it('returns calc for right-pinned column with multiple after it', () => {
      model.init([
        col({ field: 'a' }),
        col({ field: 'b' }),
        col({ field: 'c' }),
        col({ field: 'd' }),
        col({ field: 'e' }),
      ]);
      model.reorderColumns(['a', 'b', 'c', 'd', 'e']);
      model.pinRight('c');
      model.pinRight('d');
      model.pinRight('e');
      // pinRight('c'): [a, b, d, e, c]  (c = right)
      // pinRight('d'): [a, b, e, d, c]  (d, c = right)
      // pinRight('e'): [a, b, e, d, c]  (e, d, c = right)
      // Right zone order: e, d, c. e has d and c after it.
      expect(model.getColumnStickyRightCss('e')).toBe(
        'calc(var(--cw-d, 150px) + var(--cw-c, 150px))',
      );
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
        col({ field: 'e' }),
      ]);
      model.setOnChange(onChange);
      model.showColumn('e');
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
      model.init([col({ field: 'a' }), col({ field: 'b' })]);
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
