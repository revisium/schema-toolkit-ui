import { JsonPointerPath } from '../path/JsonPointerPath';

describe('JsonPointerPath', () => {
  describe('empty paths', () => {
    it('parses empty string as empty path', () => {
      const path = new JsonPointerPath('');
      expect(path.isEmpty()).toBe(true);
      expect(path.segments()).toEqual([]);
      expect(path.asJsonPointer()).toBe('');
      expect(path.asSimple()).toBe('');
    });

    it('parses single slash as empty path', () => {
      const path = new JsonPointerPath('/');
      expect(path.isEmpty()).toBe(true);
    });
  });

  describe('property paths', () => {
    it('parses single property', () => {
      const path = new JsonPointerPath('/properties/name');
      expect(path.isEmpty()).toBe(false);
      expect(path.segments()).toHaveLength(1);
      expect(path.segments()[0]?.isProperty()).toBe(true);
      expect(path.segments()[0]?.propertyName()).toBe('name');
      expect(path.asSimple()).toBe('name');
    });

    it('parses nested properties', () => {
      const path = new JsonPointerPath('/properties/user/properties/address');
      expect(path.segments()).toHaveLength(2);
      expect(path.segments()[0]?.propertyName()).toBe('user');
      expect(path.segments()[1]?.propertyName()).toBe('address');
      expect(path.asSimple()).toBe('user.address');
    });

    it('parses deeply nested properties', () => {
      const path = new JsonPointerPath(
        '/properties/a/properties/b/properties/c',
      );
      expect(path.segments()).toHaveLength(3);
      expect(path.asSimple()).toBe('a.b.c');
      expect(path.length()).toBe(3);
    });
  });

  describe('array paths', () => {
    it('parses property with items', () => {
      const path = new JsonPointerPath('/properties/items/items');
      expect(path.segments()).toHaveLength(2);
      expect(path.segments()[0]?.isProperty()).toBe(true);
      expect(path.segments()[1]?.isItems()).toBe(true);
      expect(path.asSimple()).toBe('items[*]');
    });

    it('parses nested array in object', () => {
      const path = new JsonPointerPath(
        '/properties/data/properties/items/items/properties/name',
      );
      expect(path.segments()).toHaveLength(4);
      expect(path.asSimple()).toBe('data.items[*].name');
    });
  });

  describe('invalid paths', () => {
    it('throws for invalid segment', () => {
      expect(() => new JsonPointerPath('/invalid/segment')).toThrow(
        'Invalid path segment',
      );
    });

    it('throws for properties without name', () => {
      expect(() => new JsonPointerPath('/properties')).toThrow(
        'Invalid path segment',
      );
    });
  });

  describe('path operations', () => {
    it('parent returns path without last segment', () => {
      const path = new JsonPointerPath('/properties/user/properties/name');
      const parent = path.parent();
      expect(parent.length()).toBe(1);
      expect(parent.asSimple()).toBe('user');
    });

    it('child adds property segment', () => {
      const path = new JsonPointerPath('/properties/user');
      const child = path.child('name');
      expect(child.length()).toBe(2);
      expect(child.asSimple()).toBe('user.name');
    });

    it('childItems adds items segment', () => {
      const path = new JsonPointerPath('/properties/items');
      const items = path.childItems();
      expect(items.length()).toBe(2);
      expect(items.asSimple()).toBe('items[*]');
    });

    it('equals returns true for same paths', () => {
      const path1 = new JsonPointerPath('/properties/name');
      const path2 = new JsonPointerPath('/properties/name');
      expect(path1.equals(path2)).toBe(true);
    });

    it('equals returns false for different paths', () => {
      const path1 = new JsonPointerPath('/properties/name');
      const path2 = new JsonPointerPath('/properties/email');
      expect(path1.equals(path2)).toBe(false);
    });
  });

  describe('asJsonPointer', () => {
    it('returns original pointer', () => {
      const pointer = '/properties/user/properties/name';
      const path = new JsonPointerPath(pointer);
      expect(path.asJsonPointer()).toBe(pointer);
    });
  });
});
