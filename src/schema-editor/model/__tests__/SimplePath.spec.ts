import { SimplePath } from '../path/SimplePath';

describe('SimplePath', () => {
  describe('empty paths', () => {
    it('parses empty string as empty path', () => {
      const path = new SimplePath('');
      expect(path.isEmpty()).toBe(true);
      expect(path.segments()).toEqual([]);
      expect(path.asSimple()).toBe('');
      expect(path.asJsonPointer()).toBe('');
    });
  });

  describe('property paths', () => {
    it('parses single property', () => {
      const path = new SimplePath('name');
      expect(path.isEmpty()).toBe(false);
      expect(path.segments()).toHaveLength(1);
      expect(path.segments()[0]?.isProperty()).toBe(true);
      expect(path.segments()[0]?.propertyName()).toBe('name');
      expect(path.asJsonPointer()).toBe('/properties/name');
    });

    it('parses nested properties', () => {
      const path = new SimplePath('user.address');
      expect(path.segments()).toHaveLength(2);
      expect(path.segments()[0]?.propertyName()).toBe('user');
      expect(path.segments()[1]?.propertyName()).toBe('address');
      expect(path.asJsonPointer()).toBe('/properties/user/properties/address');
    });

    it('parses deeply nested properties', () => {
      const path = new SimplePath('a.b.c.d');
      expect(path.segments()).toHaveLength(4);
      expect(path.length()).toBe(4);
      expect(path.asJsonPointer()).toBe(
        '/properties/a/properties/b/properties/c/properties/d',
      );
    });
  });

  describe('array paths', () => {
    it('parses property with wildcard index', () => {
      const path = new SimplePath('items[*]');
      expect(path.segments()).toHaveLength(2);
      expect(path.segments()[0]?.isProperty()).toBe(true);
      expect(path.segments()[0]?.propertyName()).toBe('items');
      expect(path.segments()[1]?.isItems()).toBe(true);
      expect(path.asJsonPointer()).toBe('/properties/items/items');
    });

    it('parses property with numeric index', () => {
      const path = new SimplePath('items[0]');
      expect(path.segments()).toHaveLength(2);
      expect(path.segments()[0]?.propertyName()).toBe('items');
      expect(path.segments()[1]?.isItems()).toBe(true);
    });

    it('parses nested array access', () => {
      const path = new SimplePath('data.items[*].name');
      expect(path.segments()).toHaveLength(4);
      expect(path.asJsonPointer()).toBe(
        '/properties/data/properties/items/items/properties/name',
      );
    });

    it('parses multiple array accesses', () => {
      const path = new SimplePath('matrix[*].rows[*].value');
      expect(path.segments()).toHaveLength(5);
    });
  });

  describe('invalid paths', () => {
    it('throws for empty segment', () => {
      expect(() => new SimplePath('user..name')).toThrow(
        'Invalid simple path: empty segment',
      );
    });

    it('throws for leading dot', () => {
      expect(() => new SimplePath('.name')).toThrow(
        'Invalid simple path: empty segment',
      );
    });

    it('throws for trailing dot', () => {
      expect(() => new SimplePath('name.')).toThrow(
        'Invalid simple path: empty segment',
      );
    });
  });

  describe('path operations', () => {
    it('parent returns path without last segment', () => {
      const path = new SimplePath('user.name');
      const parent = path.parent();
      expect(parent.length()).toBe(1);
      expect(parent.asSimple()).toBe('user');
    });

    it('child adds property segment', () => {
      const path = new SimplePath('user');
      const child = path.child('name');
      expect(child.length()).toBe(2);
      expect(child.asSimple()).toBe('user.name');
    });

    it('childItems adds items segment', () => {
      const path = new SimplePath('items');
      const items = path.childItems();
      expect(items.length()).toBe(2);
      expect(items.asSimple()).toBe('items[*]');
    });

    it('equals returns true for same paths', () => {
      const path1 = new SimplePath('user.name');
      const path2 = new SimplePath('user.name');
      expect(path1.equals(path2)).toBe(true);
    });

    it('equals returns false for different paths', () => {
      const path1 = new SimplePath('user.name');
      const path2 = new SimplePath('user.email');
      expect(path1.equals(path2)).toBe(false);
    });
  });

  describe('asSimple', () => {
    it('returns original simple path', () => {
      const simple = 'user.address.city';
      const path = new SimplePath(simple);
      expect(path.asSimple()).toBe(simple);
    });
  });
});
