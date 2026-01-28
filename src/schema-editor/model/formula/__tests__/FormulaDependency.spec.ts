import { ResolvedDependency } from '..';

describe('ResolvedDependency', () => {
  describe('construction', () => {
    it('creates dependency with nodeId', () => {
      const dep = new ResolvedDependency('node-1');

      expect(dep.targetNodeId()).toBe('node-1');
    });

    it('throws error for empty nodeId', () => {
      expect(() => new ResolvedDependency('')).toThrow(
        'FormulaDependency requires targetNodeId',
      );
    });
  });

  describe('targetNodeId', () => {
    it('returns the nodeId', () => {
      const dep = new ResolvedDependency('node-abc');
      expect(dep.targetNodeId()).toBe('node-abc');
    });
  });
});
