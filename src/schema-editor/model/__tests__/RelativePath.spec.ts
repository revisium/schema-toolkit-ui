import { RelativePath } from '../formula/parsing/RelativePath';
import { EMPTY_PATH, jsonPointerToPath } from '../path';

describe('RelativePath', () => {
  describe('resolve()', () => {
    describe('simple identifiers', () => {
      it('resolves identifier from root', () => {
        const basePath = EMPTY_PATH;
        const relative = new RelativePath(basePath, 'fieldName');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe('/properties/fieldName');
      });

      it('resolves identifier from nested path', () => {
        const basePath = jsonPointerToPath('/properties/parent');
        const relative = new RelativePath(basePath, 'sibling');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe(
          '/properties/parent/properties/sibling',
        );
      });
    });

    describe('member expressions (dot notation)', () => {
      it('resolves nested member expression', () => {
        const basePath = EMPTY_PATH;
        const relative = new RelativePath(basePath, 'parent.child');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe(
          '/properties/parent/properties/child',
        );
      });

      it('resolves deeply nested member expression', () => {
        const basePath = EMPTY_PATH;
        const relative = new RelativePath(basePath, 'a.b.c.d');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe(
          '/properties/a/properties/b/properties/c/properties/d',
        );
      });
    });

    describe('relative paths (..)', () => {
      it('resolves single parent reference', () => {
        const basePath = jsonPointerToPath(
          '/properties/parent/properties/child',
        );
        const relative = new RelativePath(basePath, '../sibling');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe(
          '/properties/parent/properties/sibling',
        );
      });

      it('resolves multiple parent references', () => {
        const basePath = jsonPointerToPath(
          '/properties/a/properties/b/properties/c',
        );
        const relative = new RelativePath(basePath, '../../sibling');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe(
          '/properties/a/properties/sibling',
        );
      });

      it('returns null when going above root', () => {
        const basePath = jsonPointerToPath('/properties/single');
        const relative = new RelativePath(basePath, '../../invalid');
        const resolved = relative.resolve();

        expect(resolved).toBeNull();
      });
    });

    describe('root paths (/)', () => {
      it('resolves absolute root path', () => {
        const basePath = jsonPointerToPath(
          '/properties/nested/properties/deep',
        );
        const relative = new RelativePath(basePath, '/rootField');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe('/properties/rootField');
      });

      it('resolves absolute nested path', () => {
        const basePath = jsonPointerToPath(
          '/properties/somewhere/properties/else',
        );
        const relative = new RelativePath(basePath, '/config.settings');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe(
          '/properties/config/properties/settings',
        );
      });

      it('returns null for invalid root path with empty part', () => {
        const basePath = EMPTY_PATH;
        const relative = new RelativePath(basePath, '/a..b');
        const resolved = relative.resolve();

        expect(resolved).toBeNull();
      });
    });

    describe('array access ([*] and [n])', () => {
      it('resolves wildcard array access', () => {
        const basePath = EMPTY_PATH;
        const relative = new RelativePath(basePath, 'items[*]');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe('/properties/items/items');
      });

      it('resolves indexed array access', () => {
        const basePath = EMPTY_PATH;
        const relative = new RelativePath(basePath, 'items[0]');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe('/properties/items/items');
      });

      it('resolves nested array access in root path', () => {
        const basePath = jsonPointerToPath('/properties/other');
        const relative = new RelativePath(basePath, '/data.items[*].value');
        const resolved = relative.resolve();

        expect(resolved).not.toBeNull();
        expect(resolved?.asJsonPointer()).toBe(
          '/properties/data/properties/items/items/properties/value',
        );
      });
    });

    describe('error handling', () => {
      it('returns null for invalid formula syntax', () => {
        const basePath = EMPTY_PATH;
        const relative = new RelativePath(basePath, '+++invalid');
        const resolved = relative.resolve();

        expect(resolved).toBeNull();
      });

      it('returns null for empty path after parent navigation', () => {
        const basePath = EMPTY_PATH;
        const relative = new RelativePath(basePath, '../something');
        const resolved = relative.resolve();

        expect(resolved).toBeNull();
      });
    });
  });
});
