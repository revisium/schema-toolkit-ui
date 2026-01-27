import { NULL_NODE } from '../node/NullNode';
import { EMPTY_METADATA } from '../node/NodeMetadata';

describe('NULL_NODE', () => {
  describe('identity', () => {
    it('returns empty id', () => {
      expect(NULL_NODE.id()).toBe('');
    });

    it('isNull returns true', () => {
      expect(NULL_NODE.isNull()).toBe(true);
    });

    it('isObject returns false', () => {
      expect(NULL_NODE.isObject()).toBe(false);
    });

    it('isArray returns false', () => {
      expect(NULL_NODE.isArray()).toBe(false);
    });

    it('isPrimitive returns false', () => {
      expect(NULL_NODE.isPrimitive()).toBe(false);
    });

    it('isRef returns false', () => {
      expect(NULL_NODE.isRef()).toBe(false);
    });
  });

  describe('accessors that throw', () => {
    it('name throws error', () => {
      expect(() => NULL_NODE.name()).toThrow('Null node has no name');
    });

    it('nodeType throws error', () => {
      expect(() => NULL_NODE.nodeType()).toThrow('Null node has no type');
    });

    it('ref throws error', () => {
      expect(() => NULL_NODE.ref()).toThrow('Null node has no ref');
    });
  });

  describe('accessors that return defaults', () => {
    it('metadata returns EMPTY_METADATA', () => {
      expect(NULL_NODE.metadata()).toBe(EMPTY_METADATA);
    });

    it('children returns empty array', () => {
      expect(NULL_NODE.properties()).toEqual([]);
    });

    it('child returns NULL_NODE', () => {
      expect(NULL_NODE.property('any')).toBe(NULL_NODE);
    });

    it('items returns NULL_NODE', () => {
      expect(NULL_NODE.items()).toBe(NULL_NODE);
    });
  });

  describe('mutators that throw', () => {
    it('setName throws error', () => {
      expect(() => NULL_NODE.setName('name')).toThrow(
        'Cannot modify null node',
      );
    });

    it('setMetadata throws error', () => {
      expect(() => NULL_NODE.setMetadata({})).toThrow(
        'Cannot modify null node',
      );
    });

    it('addChild throws error', () => {
      expect(() => NULL_NODE.addProperty(NULL_NODE)).toThrow(
        'Cannot modify null node',
      );
    });

    it('removeChild throws error', () => {
      expect(() => NULL_NODE.removeProperty('name')).toThrow(
        'Cannot modify null node',
      );
    });

    it('removePropertyById throws error', () => {
      expect(() => NULL_NODE.removePropertyById('id')).toThrow(
        'Cannot modify null node',
      );
    });

    it('replaceChild throws error', () => {
      expect(() => NULL_NODE.replaceProperty('name', NULL_NODE)).toThrow(
        'Cannot modify null node',
      );
    });

    it('setItems throws error', () => {
      expect(() => NULL_NODE.setItems(NULL_NODE)).toThrow(
        'Cannot modify null node',
      );
    });
  });
});
