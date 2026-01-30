import { Path } from '../../core';

describe('Path', () => {
  describe('construction', () => {
    describe('empty()', () => {
      it('creates empty path', () => {
        const path = Path.empty();

        expect(path.isEmpty()).toBe(true);
        expect(path.length()).toBe(0);
        expect(path.segments()).toEqual([]);
      });
    });

    describe('fromString()', () => {
      it('parses empty string as empty path', () => {
        const path = Path.fromString('');

        expect(path.isEmpty()).toBe(true);
      });

      it('parses simple property', () => {
        const path = Path.fromString('name');

        expect(path.segments()).toEqual([{ type: 'property', name: 'name' }]);
      });

      it('parses nested properties', () => {
        const path = Path.fromString('user.address.city');

        expect(path.segments()).toEqual([
          { type: 'property', name: 'user' },
          { type: 'property', name: 'address' },
          { type: 'property', name: 'city' },
        ]);
      });

      it('parses array index', () => {
        const path = Path.fromString('items[0]');

        expect(path.segments()).toEqual([
          { type: 'property', name: 'items' },
          { type: 'index', index: 0 },
        ]);
      });

      it('parses nested array index', () => {
        const path = Path.fromString('items[0].price');

        expect(path.segments()).toEqual([
          { type: 'property', name: 'items' },
          { type: 'index', index: 0 },
          { type: 'property', name: 'price' },
        ]);
      });

      it('parses array items wildcard', () => {
        const path = Path.fromString('items[*]');

        expect(path.segments()).toEqual([
          { type: 'property', name: 'items' },
          { type: 'items' },
        ]);
      });

      it('parses nested array items', () => {
        const path = Path.fromString('items[*].price');

        expect(path.segments()).toEqual([
          { type: 'property', name: 'items' },
          { type: 'items' },
          { type: 'property', name: 'price' },
        ]);
      });

      it('parses multi-digit index', () => {
        const path = Path.fromString('items[123]');

        expect(path.segments()).toEqual([
          { type: 'property', name: 'items' },
          { type: 'index', index: 123 },
        ]);
      });

      it('parses array of arrays', () => {
        const path = Path.fromString('matrix[0][1]');

        expect(path.segments()).toEqual([
          { type: 'property', name: 'matrix' },
          { type: 'index', index: 0 },
          { type: 'index', index: 1 },
        ]);
      });

      it('parses property with underscore', () => {
        const path = Path.fromString('user_name');

        expect(path.segments()).toEqual([
          { type: 'property', name: 'user_name' },
        ]);
      });

      it('parses property starting with underscore', () => {
        const path = Path.fromString('_private');

        expect(path.segments()).toEqual([
          { type: 'property', name: '_private' },
        ]);
      });

      it('throws on invalid path', () => {
        expect(() => Path.fromString('123invalid')).toThrow(
          'Invalid path segment',
        );
      });
    });

    describe('fromSegments()', () => {
      it('creates path from segments array', () => {
        const segments = [
          { type: 'property' as const, name: 'items' },
          { type: 'index' as const, index: 0 },
        ];
        const path = Path.fromSegments(segments);

        expect(path.segments()).toEqual(segments);
      });
    });
  });

  describe('accessors', () => {
    describe('first()', () => {
      it('returns first segment', () => {
        const path = Path.fromString('user.name');

        expect(path.first()).toEqual({ type: 'property', name: 'user' });
      });

      it('returns undefined for empty path', () => {
        const path = Path.empty();

        expect(path.first()).toBeUndefined();
      });
    });

    describe('last()', () => {
      it('returns last segment', () => {
        const path = Path.fromString('user.name');

        expect(path.last()).toEqual({ type: 'property', name: 'name' });
      });

      it('returns undefined for empty path', () => {
        const path = Path.empty();

        expect(path.last()).toBeUndefined();
      });
    });
  });

  describe('navigation', () => {
    describe('parent()', () => {
      it('returns parent path', () => {
        const path = Path.fromString('user.address.city');

        expect(path.parent().asSimple()).toBe('user.address');
      });

      it('returns empty for single segment', () => {
        const path = Path.fromString('user');

        expect(path.parent().isEmpty()).toBe(true);
      });

      it('returns self for empty path', () => {
        const path = Path.empty();

        expect(path.parent().isEmpty()).toBe(true);
      });

      it('handles array index parent', () => {
        const path = Path.fromString('items[0]');

        expect(path.parent().asSimple()).toBe('items');
      });
    });

    describe('child()', () => {
      it('appends property segment', () => {
        const path = Path.fromString('user');

        expect(path.child('name').asSimple()).toBe('user.name');
      });

      it('appends to empty path', () => {
        const path = Path.empty();

        expect(path.child('name').asSimple()).toBe('name');
      });
    });

    describe('childIndex()', () => {
      it('appends index segment', () => {
        const path = Path.fromString('items');

        expect(path.childIndex(0).asSimple()).toBe('items[0]');
      });
    });

    describe('childItems()', () => {
      it('appends items segment', () => {
        const path = Path.fromString('items');

        expect(path.childItems().asSimple()).toBe('items[*]');
      });
    });
  });

  describe('comparison', () => {
    describe('equals()', () => {
      it('returns true for equal paths', () => {
        const path1 = Path.fromString('user.name');
        const path2 = Path.fromString('user.name');

        expect(path1.equals(path2)).toBe(true);
      });

      it('returns false for different paths', () => {
        const path1 = Path.fromString('user.name');
        const path2 = Path.fromString('user.email');

        expect(path1.equals(path2)).toBe(false);
      });

      it('returns false for different lengths', () => {
        const path1 = Path.fromString('user');
        const path2 = Path.fromString('user.name');

        expect(path1.equals(path2)).toBe(false);
      });

      it('compares index segments', () => {
        const path1 = Path.fromString('items[0]');
        const path2 = Path.fromString('items[0]');
        const path3 = Path.fromString('items[1]');

        expect(path1.equals(path2)).toBe(true);
        expect(path1.equals(path3)).toBe(false);
      });

      it('compares items segments', () => {
        const path1 = Path.fromString('items[*]');
        const path2 = Path.fromString('items[*]');

        expect(path1.equals(path2)).toBe(true);
      });
    });

    describe('isChildOf()', () => {
      it('returns true when path is child of parent', () => {
        const parent = Path.fromString('user');
        const child = Path.fromString('user.name');

        expect(child.isChildOf(parent)).toBe(true);
      });

      it('returns true for deep child', () => {
        const parent = Path.fromString('user');
        const child = Path.fromString('user.address.city');

        expect(child.isChildOf(parent)).toBe(true);
      });

      it('returns false when not a child', () => {
        const path1 = Path.fromString('user');
        const path2 = Path.fromString('items');

        expect(path2.isChildOf(path1)).toBe(false);
      });

      it('returns false when same path', () => {
        const path = Path.fromString('user');

        expect(path.isChildOf(path)).toBe(false);
      });

      it('returns false when parent is longer', () => {
        const parent = Path.fromString('user.name');
        const child = Path.fromString('user');

        expect(child.isChildOf(parent)).toBe(false);
      });

      it('handles array paths', () => {
        const parent = Path.fromString('items[0]');
        const child = Path.fromString('items[0].price');

        expect(child.isChildOf(parent)).toBe(true);
      });
    });
  });

  describe('serialization', () => {
    describe('asSimple()', () => {
      it('serializes empty path', () => {
        expect(Path.empty().asSimple()).toBe('');
      });

      it('serializes simple property', () => {
        expect(Path.fromString('name').asSimple()).toBe('name');
      });

      it('serializes nested properties', () => {
        expect(Path.fromString('user.address.city').asSimple()).toBe(
          'user.address.city',
        );
      });

      it('serializes array index', () => {
        expect(Path.fromString('items[0]').asSimple()).toBe('items[0]');
      });

      it('serializes array items', () => {
        expect(Path.fromString('items[*]').asSimple()).toBe('items[*]');
      });

      it('serializes complex path', () => {
        expect(Path.fromString('orders[0].items[*].price').asSimple()).toBe(
          'orders[0].items[*].price',
        );
      });
    });

    describe('asJsonPointer()', () => {
      it('serializes empty path', () => {
        expect(Path.empty().asJsonPointer()).toBe('');
      });

      it('serializes simple property', () => {
        expect(Path.fromString('name').asJsonPointer()).toBe('/name');
      });

      it('serializes nested properties', () => {
        expect(Path.fromString('user.address.city').asJsonPointer()).toBe(
          '/user/address/city',
        );
      });

      it('serializes array index', () => {
        expect(Path.fromString('items[0]').asJsonPointer()).toBe('/items/0');
      });

      it('serializes array items as dash', () => {
        expect(Path.fromString('items[*]').asJsonPointer()).toBe('/items/-');
      });

      it('serializes complex path', () => {
        expect(
          Path.fromString('orders[0].items[1].price').asJsonPointer(),
        ).toBe('/orders/0/items/1/price');
      });
    });
  });

  describe('immutability', () => {
    it('parent() does not modify original', () => {
      const original = Path.fromString('user.name');
      const parent = original.parent();

      expect(original.asSimple()).toBe('user.name');
      expect(parent.asSimple()).toBe('user');
    });

    it('child() does not modify original', () => {
      const original = Path.fromString('user');
      const child = original.child('name');

      expect(original.asSimple()).toBe('user');
      expect(child.asSimple()).toBe('user.name');
    });

    it('fromSegments() creates independent copy', () => {
      const segments = [{ type: 'property' as const, name: 'user' }];
      const path = Path.fromSegments(segments);

      segments.push({ type: 'property' as const, name: 'name' });

      expect(path.segments()).toHaveLength(1);
    });
  });
});
