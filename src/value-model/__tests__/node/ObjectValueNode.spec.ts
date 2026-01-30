import {
  ObjectValueNode,
  StringValueNode,
  NumberValueNode,
  resetNodeIdCounter,
} from '../../node';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('ObjectValueNode', () => {
  describe('construction', () => {
    it('creates empty object node', () => {
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' });

      expect(node.name).toBe('user');
      expect(node.type).toBe('object');
      expect(node.children).toHaveLength(0);
    });

    it('creates object node with children', () => {
      const name = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      const age = new NumberValueNode(undefined, 'age', { type: 'number' }, 25);
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
        age,
      ]);

      expect(node.children).toHaveLength(2);
      expect(node.child('name')).toBe(name);
      expect(node.child('age')).toBe(age);
    });

    it('sets parent on children', () => {
      const name = new StringValueNode(undefined, 'name', { type: 'string' });
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
      ]);

      expect(name.parent).toBe(node);
    });
  });

  describe('value', () => {
    it('returns object with child nodes', () => {
      const name = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
      ]);

      const value = node.value;

      expect(value).toHaveProperty('name', name);
    });

    it('returns empty object for empty node', () => {
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' });

      expect(node.value).toEqual({});
    });
  });

  describe('child access', () => {
    it('child() returns child by name', () => {
      const name = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
      ]);

      expect(node.child('name')).toBe(name);
    });

    it('child() returns undefined for non-existent name', () => {
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' });

      expect(node.child('missing')).toBeUndefined();
    });

    it('hasChild() returns true for existing child', () => {
      const name = new StringValueNode(undefined, 'name', { type: 'string' });
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
      ]);

      expect(node.hasChild('name')).toBe(true);
    });

    it('hasChild() returns false for non-existent child', () => {
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' });

      expect(node.hasChild('missing')).toBe(false);
    });
  });

  describe('addChild', () => {
    it('adds child to object', () => {
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' });
      const name = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );

      node.addChild(name);

      expect(node.children).toHaveLength(1);
      expect(node.child('name')).toBe(name);
    });

    it('sets parent on added child', () => {
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' });
      const name = new StringValueNode(undefined, 'name', { type: 'string' });

      node.addChild(name);

      expect(name.parent).toBe(node);
    });

    it('replaces existing child with same name', () => {
      const name1 = new StringValueNode(
        'id-1',
        'name',
        { type: 'string' },
        'John',
      );
      const name2 = new StringValueNode(
        'id-2',
        'name',
        { type: 'string' },
        'Jane',
      );
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name1,
      ]);

      node.addChild(name2);

      expect(node.children).toHaveLength(1);
      expect(node.child('name')).toBe(name2);
    });
  });

  describe('removeChild', () => {
    it('removes child from object', () => {
      const name = new StringValueNode(undefined, 'name', { type: 'string' });
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
      ]);

      node.removeChild('name');

      expect(node.children).toHaveLength(0);
      expect(node.child('name')).toBeUndefined();
    });

    it('clears parent on removed child', () => {
      const name = new StringValueNode(undefined, 'name', { type: 'string' });
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
      ]);

      node.removeChild('name');

      expect(name.parent).toBeNull();
    });

    it('does nothing for non-existent child', () => {
      const name = new StringValueNode(undefined, 'name', { type: 'string' });
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
      ]);

      node.removeChild('missing');

      expect(node.children).toHaveLength(1);
    });
  });

  describe('getPlainValue', () => {
    it('returns plain object with primitive values', () => {
      const name = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      const age = new NumberValueNode(undefined, 'age', { type: 'number' }, 25);
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
        age,
      ]);

      expect(node.getPlainValue()).toEqual({
        name: 'John',
        age: 25,
      });
    });

    it('returns nested plain object', () => {
      const city = new StringValueNode(
        undefined,
        'city',
        { type: 'string' },
        'NYC',
      );
      const address = new ObjectValueNode(
        undefined,
        'address',
        { type: 'object' },
        [city],
      );
      const user = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        address,
      ]);

      expect(user.getPlainValue()).toEqual({
        address: {
          city: 'NYC',
        },
      });
    });

    it('returns empty object for empty node', () => {
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' });

      expect(node.getPlainValue()).toEqual({});
    });
  });

  describe('validation - errors aggregation', () => {
    it('collects errors from children', () => {
      const name = new StringValueNode(undefined, 'name', {
        type: 'string',
        required: true,
      });
      const age = new NumberValueNode(
        undefined,
        'age',
        {
          type: 'number',
          minimum: 18,
        },
        10,
      );
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
        age,
      ]);

      const errors = node.errors;

      expect(errors).toHaveLength(2);
      expect(errors.map((e) => e.type)).toContain('required');
      expect(errors.map((e) => e.type)).toContain('min');
    });

    it('returns empty array when all children valid', () => {
      const name = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
      ]);

      expect(node.errors).toHaveLength(0);
    });

    it('collects nested errors', () => {
      const city = new StringValueNode(undefined, 'city', {
        type: 'string',
        required: true,
      });
      const address = new ObjectValueNode(
        undefined,
        'address',
        { type: 'object' },
        [city],
      );
      const user = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        address,
      ]);

      expect(user.errors).toHaveLength(1);
      expect(user.errors[0].type).toBe('required');
    });
  });

  describe('validation - warnings aggregation', () => {
    it('collects warnings from children', () => {
      const total = new NumberValueNode(undefined, 'total', { type: 'number' });
      total.setFormulaWarning({
        type: 'nan',
        message: 'NaN result',
        expression: 'test',
        computedValue: NaN,
      });
      const node = new ObjectValueNode(undefined, 'order', { type: 'object' }, [
        total,
      ]);

      expect(node.warnings).toHaveLength(1);
      expect(node.warnings[0].type).toBe('nan');
    });
  });

  describe('isValid and hasWarnings', () => {
    it('isValid is true when all children valid', () => {
      const name = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
      ]);

      expect(node.isValid).toBe(true);
    });

    it('isValid is false when any child invalid', () => {
      const name = new StringValueNode(undefined, 'name', {
        type: 'string',
        required: true,
      });
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' }, [
        name,
      ]);

      expect(node.isValid).toBe(false);
    });

    it('hasWarnings is true when any child has warnings', () => {
      const total = new NumberValueNode(undefined, 'total', { type: 'number' });
      total.setFormulaWarning({
        type: 'nan',
        message: 'test',
        expression: 'test',
        computedValue: NaN,
      });
      const node = new ObjectValueNode(undefined, 'order', { type: 'object' }, [
        total,
      ]);

      expect(node.hasWarnings).toBe(true);
    });
  });

  describe('type checks', () => {
    it('isObject returns true', () => {
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' });

      expect(node.isObject()).toBe(true);
    });

    it('isArray returns false', () => {
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' });

      expect(node.isArray()).toBe(false);
    });

    it('isPrimitive returns false', () => {
      const node = new ObjectValueNode(undefined, 'user', { type: 'object' });

      expect(node.isPrimitive()).toBe(false);
    });
  });
});
