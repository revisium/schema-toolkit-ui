import { EMPTY_PATH, PathFromSegments } from '../path/Paths';
import { PropertySegment, ITEMS_SEGMENT } from '../path/PathSegment';

describe('Paths', () => {
  describe('EMPTY_PATH', () => {
    it('returns empty segments', () => {
      expect(EMPTY_PATH.segments()).toEqual([]);
    });

    it('returns empty json pointer', () => {
      expect(EMPTY_PATH.asJsonPointer()).toBe('');
    });

    it('returns empty simple path', () => {
      expect(EMPTY_PATH.asSimple()).toBe('');
    });

    it('parent returns itself', () => {
      expect(EMPTY_PATH.parent()).toBe(EMPTY_PATH);
    });

    it('child creates path with single property segment', () => {
      const child = EMPTY_PATH.child('name');
      expect(child.segments()).toHaveLength(1);
      expect(child.segments()[0]?.isProperty()).toBe(true);
      expect(child.segments()[0]?.propertyName()).toBe('name');
    });

    it('childItems throws error', () => {
      expect(() => EMPTY_PATH.childItems()).toThrow(
        'Cannot add items to empty path without property',
      );
    });

    it('equals returns true for empty paths', () => {
      const other = new PathFromSegments([]);
      expect(EMPTY_PATH.equals(other)).toBe(true);
    });

    it('equals returns false for non-empty paths', () => {
      const other = new PathFromSegments([new PropertySegment('name')]);
      expect(EMPTY_PATH.equals(other)).toBe(false);
    });

    it('isEmpty returns true', () => {
      expect(EMPTY_PATH.isEmpty()).toBe(true);
    });

    it('length returns 0', () => {
      expect(EMPTY_PATH.length()).toBe(0);
    });
  });

  describe('PathFromSegments', () => {
    describe('with empty segments', () => {
      it('creates empty path', () => {
        const path = new PathFromSegments([]);
        expect(path.isEmpty()).toBe(true);
        expect(path.length()).toBe(0);
      });
    });

    describe('with single property segment', () => {
      const path = new PathFromSegments([new PropertySegment('name')]);

      it('returns segments', () => {
        expect(path.segments()).toHaveLength(1);
        expect(path.segments()[0]?.propertyName()).toBe('name');
      });

      it('returns json pointer', () => {
        expect(path.asJsonPointer()).toBe('/properties/name');
      });

      it('returns simple path', () => {
        expect(path.asSimple()).toBe('name');
      });

      it('parent returns empty path', () => {
        expect(path.parent().isEmpty()).toBe(true);
      });

      it('child adds property segment', () => {
        const child = path.child('email');
        expect(child.segments()).toHaveLength(2);
        expect(child.asSimple()).toBe('name.email');
      });

      it('childItems adds items segment', () => {
        const items = path.childItems();
        expect(items.segments()).toHaveLength(2);
        expect(items.segments()[1]?.isItems()).toBe(true);
      });

      it('isEmpty returns false', () => {
        expect(path.isEmpty()).toBe(false);
      });

      it('length returns 1', () => {
        expect(path.length()).toBe(1);
      });
    });

    describe('with property and items segments', () => {
      const path = new PathFromSegments([
        new PropertySegment('items'),
        ITEMS_SEGMENT,
      ]);

      it('returns json pointer', () => {
        expect(path.asJsonPointer()).toBe('/properties/items/items');
      });

      it('returns simple path with bracket notation', () => {
        expect(path.asSimple()).toBe('items[*]');
      });

      it('length returns 2', () => {
        expect(path.length()).toBe(2);
      });
    });

    describe('with nested properties', () => {
      const path = new PathFromSegments([
        new PropertySegment('user'),
        new PropertySegment('address'),
      ]);

      it('returns json pointer', () => {
        expect(path.asJsonPointer()).toBe(
          '/properties/user/properties/address',
        );
      });

      it('returns simple path with dots', () => {
        expect(path.asSimple()).toBe('user.address');
      });

      it('parent returns path without last segment', () => {
        const parent = path.parent();
        expect(parent.length()).toBe(1);
        expect(parent.asSimple()).toBe('user');
      });
    });

    describe('equals', () => {
      it('returns true for equal paths', () => {
        const path1 = new PathFromSegments([new PropertySegment('name')]);
        const path2 = new PathFromSegments([new PropertySegment('name')]);
        expect(path1.equals(path2)).toBe(true);
      });

      it('returns false for different paths', () => {
        const path1 = new PathFromSegments([new PropertySegment('name')]);
        const path2 = new PathFromSegments([new PropertySegment('email')]);
        expect(path1.equals(path2)).toBe(false);
      });

      it('returns false for paths with different lengths', () => {
        const path1 = new PathFromSegments([new PropertySegment('user')]);
        const path2 = new PathFromSegments([
          new PropertySegment('user'),
          new PropertySegment('name'),
        ]);
        expect(path1.equals(path2)).toBe(false);
      });

      it('returns false when comparing with empty path', () => {
        const path = new PathFromSegments([new PropertySegment('name')]);
        expect(path.equals(EMPTY_PATH)).toBe(false);
      });
    });

    describe('complex nested paths', () => {
      it('handles deeply nested path', () => {
        const path = new PathFromSegments([
          new PropertySegment('level1'),
          new PropertySegment('level2'),
          new PropertySegment('level3'),
        ]);
        expect(path.asJsonPointer()).toBe(
          '/properties/level1/properties/level2/properties/level3',
        );
        expect(path.asSimple()).toBe('level1.level2.level3');
        expect(path.length()).toBe(3);
      });

      it('handles array in nested object', () => {
        const path = new PathFromSegments([
          new PropertySegment('data'),
          new PropertySegment('items'),
          ITEMS_SEGMENT,
          new PropertySegment('name'),
        ]);
        expect(path.asJsonPointer()).toBe(
          '/properties/data/properties/items/items/properties/name',
        );
        expect(path.asSimple()).toBe('data.items[*].name');
        expect(path.length()).toBe(4);
      });
    });
  });
});
