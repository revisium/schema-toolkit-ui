import { ResolvedDependency } from '../formula/FormulaDependency';

describe('ResolvedDependency', () => {
  describe('construction', () => {
    it('creates dependency with path and nodeId', () => {
      const dep = new ResolvedDependency('price', 'node-1');

      expect(dep.originalPath()).toBe('price');
      expect(dep.targetNodeId()).toBe('node-1');
    });

    it('throws error for empty path', () => {
      expect(() => new ResolvedDependency('', 'node-1')).toThrow(
        'FormulaDependency requires originalPath',
      );
    });

    it('throws error for empty nodeId', () => {
      expect(() => new ResolvedDependency('price', '')).toThrow(
        'FormulaDependency requires targetNodeId',
      );
    });
  });

  describe('paths', () => {
    it('stores simple identifier path', () => {
      const dep = new ResolvedDependency('fieldName', 'node-1');
      expect(dep.originalPath()).toBe('fieldName');
    });

    it('stores nested path', () => {
      const dep = new ResolvedDependency('parent.child.value', 'node-1');
      expect(dep.originalPath()).toBe('parent.child.value');
    });

    it('stores relative path', () => {
      const dep = new ResolvedDependency('../sibling', 'node-1');
      expect(dep.originalPath()).toBe('../sibling');
    });

    it('stores absolute path', () => {
      const dep = new ResolvedDependency('/root.field', 'node-1');
      expect(dep.originalPath()).toBe('/root.field');
    });

    it('stores array access path', () => {
      const dep = new ResolvedDependency('items[*].price', 'node-1');
      expect(dep.originalPath()).toBe('items[*].price');
    });
  });
});
