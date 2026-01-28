import { describe, it, expect } from '@jest/globals';
import { PathUtils } from '../path/PathUtils';
import { EMPTY_PATH, PathFromSegments } from '../path/Paths';
import { PropertySegment, ITEMS_SEGMENT } from '../path/PathSegment';

describe('PathUtils', () => {
  describe('parseArrayNotation', () => {
    it('should parse simple field name', () => {
      const result = PathUtils.parseArrayNotation('field');
      expect(result).toEqual({ name: 'field', hasArray: false });
    });

    it('should parse field with array notation [*]', () => {
      const result = PathUtils.parseArrayNotation('items[*]');
      expect(result).toEqual({ name: 'items', hasArray: true });
    });

    it('should parse field with array notation [0]', () => {
      const result = PathUtils.parseArrayNotation('items[0]');
      expect(result).toEqual({ name: 'items', hasArray: true });
    });

    it('should parse field with array notation []', () => {
      const result = PathUtils.parseArrayNotation('items[]');
      expect(result).toEqual({ name: 'items', hasArray: true });
    });
  });

  describe('jsonPointerToSegments', () => {
    it('should parse empty pointer', () => {
      expect(PathUtils.jsonPointerToSegments('')).toEqual([]);
      expect(PathUtils.jsonPointerToSegments('/')).toEqual([]);
    });

    it('should parse single property', () => {
      const segments = PathUtils.jsonPointerToSegments('/properties/name');
      expect(segments).toHaveLength(1);
      expect(segments[0]?.isProperty()).toBe(true);
      expect(segments[0]?.propertyName()).toBe('name');
    });

    it('should parse nested properties', () => {
      const segments = PathUtils.jsonPointerToSegments(
        '/properties/user/properties/name',
      );
      expect(segments).toHaveLength(2);
      expect(segments[0]?.propertyName()).toBe('user');
      expect(segments[1]?.propertyName()).toBe('name');
    });

    it('should parse array items', () => {
      const segments = PathUtils.jsonPointerToSegments(
        '/properties/items/items',
      );
      expect(segments).toHaveLength(2);
      expect(segments[0]?.propertyName()).toBe('items');
      expect(segments[1]?.isItems()).toBe(true);
    });

    it('should throw on invalid segment', () => {
      expect(() => PathUtils.jsonPointerToSegments('/invalid')).toThrow();
    });
  });

  describe('segmentsToJsonPointer', () => {
    it('should convert empty segments', () => {
      expect(PathUtils.segmentsToJsonPointer([])).toBe('');
    });

    it('should convert single property', () => {
      const segments = [new PropertySegment('name')];
      expect(PathUtils.segmentsToJsonPointer(segments)).toBe(
        '/properties/name',
      );
    });

    it('should convert property with items', () => {
      const segments = [new PropertySegment('items'), ITEMS_SEGMENT];
      expect(PathUtils.segmentsToJsonPointer(segments)).toBe(
        '/properties/items/items',
      );
    });
  });

  describe('isChildOf', () => {
    it('should return false for empty parent and empty child', () => {
      expect(PathUtils.isChildOf(EMPTY_PATH, EMPTY_PATH)).toBe(false);
    });

    it('should return true for empty parent and non-empty child', () => {
      const child = new PathFromSegments([new PropertySegment('name')]);
      expect(PathUtils.isChildOf(EMPTY_PATH, child)).toBe(true);
    });

    it('should return true for parent-child relationship', () => {
      const parent = new PathFromSegments([new PropertySegment('user')]);
      const child = new PathFromSegments([
        new PropertySegment('user'),
        new PropertySegment('name'),
      ]);
      expect(PathUtils.isChildOf(parent, child)).toBe(true);
    });

    it('should return false for same path', () => {
      const path = new PathFromSegments([new PropertySegment('user')]);
      expect(PathUtils.isChildOf(path, path)).toBe(false);
    });

    it('should return false for sibling paths', () => {
      const path1 = new PathFromSegments([new PropertySegment('user')]);
      const path2 = new PathFromSegments([new PropertySegment('name')]);
      expect(PathUtils.isChildOf(path1, path2)).toBe(false);
    });
  });

  describe('isChildOfJsonPointer', () => {
    it('should return true for parent-child relationship', () => {
      expect(
        PathUtils.isChildOfJsonPointer(
          '/properties/user',
          '/properties/user/properties/name',
        ),
      ).toBe(true);
    });

    it('should return false for same path', () => {
      expect(
        PathUtils.isChildOfJsonPointer('/properties/user', '/properties/user'),
      ).toBe(false);
    });

    it('should handle empty parent', () => {
      expect(PathUtils.isChildOfJsonPointer('', '/properties/user')).toBe(true);
      expect(PathUtils.isChildOfJsonPointer('', '')).toBe(false);
    });
  });

  describe('getTopLevelPath', () => {
    it('should return null for empty path', () => {
      expect(PathUtils.getTopLevelPath(EMPTY_PATH)).toBeNull();
    });

    it('should return first segment for simple path', () => {
      const path = new PathFromSegments([new PropertySegment('user')]);
      const topLevel = PathUtils.getTopLevelPath(path);
      expect(topLevel?.asSimple()).toBe('user');
    });

    it('should return first segment for nested path', () => {
      const path = new PathFromSegments([
        new PropertySegment('user'),
        new PropertySegment('name'),
      ]);
      const topLevel = PathUtils.getTopLevelPath(path);
      expect(topLevel?.asSimple()).toBe('user');
    });
  });

  describe('getTopLevelJsonPointer', () => {
    it('should return null for empty path', () => {
      expect(PathUtils.getTopLevelJsonPointer('')).toBeNull();
    });

    it('should return top level for property path', () => {
      expect(
        PathUtils.getTopLevelJsonPointer('/properties/user/properties/name'),
      ).toBe('/properties/user');
    });

    it('should return null for invalid path', () => {
      expect(PathUtils.getTopLevelJsonPointer('/invalid')).toBeNull();
    });
  });

  describe('isTopLevelProperty', () => {
    it('should return true for single property', () => {
      const path = new PathFromSegments([new PropertySegment('user')]);
      expect(PathUtils.isTopLevelProperty(path)).toBe(true);
    });

    it('should return false for nested property', () => {
      const path = new PathFromSegments([
        new PropertySegment('user'),
        new PropertySegment('name'),
      ]);
      expect(PathUtils.isTopLevelProperty(path)).toBe(false);
    });

    it('should return false for empty path', () => {
      expect(PathUtils.isTopLevelProperty(EMPTY_PATH)).toBe(false);
    });
  });

  describe('countArrayDepth', () => {
    it('should return 0 for path without arrays', () => {
      const path = new PathFromSegments([new PropertySegment('user')]);
      expect(PathUtils.countArrayDepth(path)).toBe(0);
    });

    it('should count array segments', () => {
      const path = new PathFromSegments([
        new PropertySegment('items'),
        ITEMS_SEGMENT,
        new PropertySegment('nested'),
        ITEMS_SEGMENT,
      ]);
      expect(PathUtils.countArrayDepth(path)).toBe(2);
    });
  });

  describe('getFieldNameFromPath', () => {
    it('should return simple field name', () => {
      const path = new PathFromSegments([new PropertySegment('user')]);
      expect(PathUtils.getFieldNameFromPath(path)).toBe('user');
    });

    it('should return dotted path for nested', () => {
      const path = new PathFromSegments([
        new PropertySegment('user'),
        new PropertySegment('name'),
      ]);
      expect(PathUtils.getFieldNameFromPath(path)).toBe('user.name');
    });

    it('should add [*] for array items', () => {
      const path = new PathFromSegments([
        new PropertySegment('items'),
        ITEMS_SEGMENT,
        new PropertySegment('name'),
      ]);
      expect(PathUtils.getFieldNameFromPath(path)).toBe('items[*].name');
    });
  });

  describe('simplePathToSegments', () => {
    it('should parse empty path', () => {
      expect(PathUtils.simplePathToSegments('')).toEqual([]);
    });

    it('should parse simple field', () => {
      const segments = PathUtils.simplePathToSegments('name');
      expect(segments).toHaveLength(1);
      expect(segments[0]?.propertyName()).toBe('name');
    });

    it('should parse dotted path', () => {
      const segments = PathUtils.simplePathToSegments('user.name');
      expect(segments).toHaveLength(2);
      expect(segments[0]?.propertyName()).toBe('user');
      expect(segments[1]?.propertyName()).toBe('name');
    });

    it('should parse array notation', () => {
      const segments = PathUtils.simplePathToSegments('items[*].name');
      expect(segments).toHaveLength(3);
      expect(segments[0]?.propertyName()).toBe('items');
      expect(segments[1]?.isItems()).toBe(true);
      expect(segments[2]?.propertyName()).toBe('name');
    });
  });

  describe('buildChildJsonPointer', () => {
    it('should build from empty parent', () => {
      expect(PathUtils.buildChildJsonPointer('', 'name')).toBe(
        '/properties/name',
      );
    });

    it('should build from non-empty parent', () => {
      expect(PathUtils.buildChildJsonPointer('/properties/user', 'name')).toBe(
        '/properties/user/properties/name',
      );
    });
  });

  describe('getParentJsonPointer', () => {
    it('should return empty for top-level path', () => {
      expect(PathUtils.getParentJsonPointer('/properties/user')).toBe('');
    });

    it('should return parent for nested path', () => {
      expect(
        PathUtils.getParentJsonPointer('/properties/user/properties/name'),
      ).toBe('/properties/user');
    });

    it('should return array field as parent for /items segment', () => {
      expect(
        PathUtils.getParentJsonPointer('/properties/myArray/items'),
      ).toBe('/properties/myArray');
    });

    it('should return parent for path inside array items', () => {
      expect(
        PathUtils.getParentJsonPointer('/properties/myArray/items/properties/name'),
      ).toBe('/properties/myArray/items');
    });

    it('should return empty for empty path', () => {
      expect(PathUtils.getParentJsonPointer('')).toBe('');
    });
  });

  describe('countArrayDepthFromJsonPointer', () => {
    it('should return 0 for path without arrays', () => {
      expect(PathUtils.countArrayDepthFromJsonPointer('/properties/name')).toBe(0);
    });

    it('should return 1 for path with one array', () => {
      expect(
        PathUtils.countArrayDepthFromJsonPointer('/properties/items/items'),
      ).toBe(1);
    });

    it('should return 2 for nested arrays', () => {
      expect(
        PathUtils.countArrayDepthFromJsonPointer(
          '/properties/matrix/items/properties/row/items',
        ),
      ).toBe(2);
    });

    it('should not count property named "items" as array depth', () => {
      expect(
        PathUtils.countArrayDepthFromJsonPointer('/properties/items/properties/name'),
      ).toBe(0);
    });

    it('should correctly count when property is named "items" and has array', () => {
      expect(
        PathUtils.countArrayDepthFromJsonPointer('/properties/items/items/properties/value'),
      ).toBe(1);
    });
  });
});
