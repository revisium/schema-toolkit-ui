import {
  ArrayValueNode,
  ObjectValueNode,
  StringValueNode,
  NumberValueNode,
  resetNodeIdCounter,
  createNodeFactory,
} from '../../node';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('ArrayValueNode', () => {
  describe('construction', () => {
    it('creates empty array node', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });

      expect(node.name).toBe('items');
      expect(node.type).toBe('array');
      expect(node.length).toBe(0);
    });

    it('creates array node with items', () => {
      const item1 = new StringValueNode(
        undefined,
        '0',
        { type: 'string' },
        'a',
      );
      const item2 = new StringValueNode(
        undefined,
        '1',
        { type: 'string' },
        'b',
      );
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item1,
        item2,
      ]);

      expect(node.length).toBe(2);
      expect(node.at(0)).toBe(item1);
      expect(node.at(1)).toBe(item2);
    });

    it('sets parent on items', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(item.parent).toBe(node);
    });
  });

  describe('value', () => {
    it('returns array of item nodes', () => {
      const item = new StringValueNode(
        undefined,
        '0',
        { type: 'string' },
        'test',
      );
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(node.value).toHaveLength(1);
      expect(node.value[0]).toBe(item);
    });

    it('returns empty array for empty node', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });

      expect(node.value).toEqual([]);
    });
  });

  describe('at', () => {
    it('returns item at index', () => {
      const item = new StringValueNode(
        undefined,
        '0',
        { type: 'string' },
        'test',
      );
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(node.at(0)).toBe(item);
    });

    it('returns undefined for out of bounds index', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });

      expect(node.at(0)).toBeUndefined();
      expect(node.at(-1)).toBeUndefined();
    });
  });

  describe('push', () => {
    it('adds item to end of array', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });
      const item = new StringValueNode(
        undefined,
        '0',
        { type: 'string' },
        'test',
      );

      node.push(item);

      expect(node.length).toBe(1);
      expect(node.at(0)).toBe(item);
    });

    it('sets parent on pushed item', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });
      const item = new StringValueNode(undefined, '0', { type: 'string' });

      node.push(item);

      expect(item.parent).toBe(node);
    });

    it('pushes multiple items', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });
      const item1 = new StringValueNode(
        undefined,
        '0',
        { type: 'string' },
        'a',
      );
      const item2 = new StringValueNode(
        undefined,
        '1',
        { type: 'string' },
        'b',
      );

      node.push(item1);
      node.push(item2);

      expect(node.length).toBe(2);
    });
  });

  describe('insertAt', () => {
    it('inserts item at specific index', () => {
      const item1 = new StringValueNode(
        undefined,
        '0',
        { type: 'string' },
        'a',
      );
      const item2 = new StringValueNode(
        undefined,
        '1',
        { type: 'string' },
        'c',
      );
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item1,
        item2,
      ]);
      const newItem = new StringValueNode(
        undefined,
        '2',
        { type: 'string' },
        'b',
      );

      node.insertAt(1, newItem);

      expect(node.length).toBe(3);
      expect(node.at(0)?.getPlainValue()).toBe('a');
      expect(node.at(1)?.getPlainValue()).toBe('b');
      expect(node.at(2)?.getPlainValue()).toBe('c');
    });

    it('inserts at beginning', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' }, 'b');
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);
      const newItem = new StringValueNode(
        undefined,
        '1',
        { type: 'string' },
        'a',
      );

      node.insertAt(0, newItem);

      expect(node.at(0)?.getPlainValue()).toBe('a');
      expect(node.at(1)?.getPlainValue()).toBe('b');
    });

    it('inserts at end (same as push)', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });
      const item = new StringValueNode(undefined, '0', { type: 'string' }, 'a');

      node.insertAt(0, item);

      expect(node.length).toBe(1);
    });

    it('throws for negative index', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });
      const item = new StringValueNode(undefined, '0', { type: 'string' });

      expect(() => node.insertAt(-1, item)).toThrow('Index out of bounds: -1');
    });

    it('throws for index greater than length', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });
      const item = new StringValueNode(undefined, '0', { type: 'string' });

      expect(() => node.insertAt(2, item)).toThrow('Index out of bounds: 2');
    });

    it('sets parent on inserted item', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });
      const item = new StringValueNode(undefined, '0', { type: 'string' });

      node.insertAt(0, item);

      expect(item.parent).toBe(node);
    });
  });

  describe('removeAt', () => {
    it('removes item at index', () => {
      const item1 = new StringValueNode(
        undefined,
        '0',
        { type: 'string' },
        'a',
      );
      const item2 = new StringValueNode(
        undefined,
        '1',
        { type: 'string' },
        'b',
      );
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item1,
        item2,
      ]);

      node.removeAt(0);

      expect(node.length).toBe(1);
      expect(node.at(0)?.getPlainValue()).toBe('b');
    });

    it('clears parent on removed item', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      node.removeAt(0);

      expect(item.parent).toBeNull();
    });

    it('throws for negative index', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });

      expect(() => node.removeAt(-1)).toThrow('Index out of bounds: -1');
    });

    it('throws for index >= length', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });

      expect(() => node.removeAt(0)).toThrow('Index out of bounds: 0');
    });
  });

  describe('move', () => {
    it('moves item from one index to another', () => {
      const items = ['a', 'b', 'c', 'd'].map(
        (v, i) =>
          new StringValueNode(undefined, String(i), { type: 'string' }, v),
      );
      const node = new ArrayValueNode(
        undefined,
        'items',
        { type: 'array' },
        items,
      );

      node.move(0, 2);

      expect(node.getPlainValue()).toEqual(['b', 'c', 'a', 'd']);
    });

    it('moves item backward', () => {
      const items = ['a', 'b', 'c'].map(
        (v, i) =>
          new StringValueNode(undefined, String(i), { type: 'string' }, v),
      );
      const node = new ArrayValueNode(
        undefined,
        'items',
        { type: 'array' },
        items,
      );

      node.move(2, 0);

      expect(node.getPlainValue()).toEqual(['c', 'a', 'b']);
    });

    it('does nothing when from === to', () => {
      const items = ['a', 'b', 'c'].map(
        (v, i) =>
          new StringValueNode(undefined, String(i), { type: 'string' }, v),
      );
      const node = new ArrayValueNode(
        undefined,
        'items',
        { type: 'array' },
        items,
      );

      node.move(1, 1);

      expect(node.getPlainValue()).toEqual(['a', 'b', 'c']);
    });

    it('throws for negative fromIndex', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(() => node.move(-1, 0)).toThrow('Source index out of bounds: -1');
    });

    it('throws for fromIndex >= length', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(() => node.move(1, 0)).toThrow('Source index out of bounds: 1');
    });

    it('throws for negative toIndex', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(() => node.move(0, -1)).toThrow('Target index out of bounds: -1');
    });

    it('throws for toIndex >= length', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(() => node.move(0, 1)).toThrow('Target index out of bounds: 1');
    });
  });

  describe('replaceAt', () => {
    it('replaces item at index', () => {
      const item1 = new StringValueNode(
        undefined,
        '0',
        { type: 'string' },
        'old',
      );
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item1,
      ]);
      const newItem = new StringValueNode(
        undefined,
        '1',
        { type: 'string' },
        'new',
      );

      node.replaceAt(0, newItem);

      expect(node.length).toBe(1);
      expect(node.at(0)?.getPlainValue()).toBe('new');
    });

    it('clears parent on old item', () => {
      const oldItem = new StringValueNode(undefined, '0', { type: 'string' });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        oldItem,
      ]);
      const newItem = new StringValueNode(undefined, '1', { type: 'string' });

      node.replaceAt(0, newItem);

      expect(oldItem.parent).toBeNull();
    });

    it('sets parent on new item', () => {
      const oldItem = new StringValueNode(undefined, '0', { type: 'string' });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        oldItem,
      ]);
      const newItem = new StringValueNode(undefined, '1', { type: 'string' });

      node.replaceAt(0, newItem);

      expect(newItem.parent).toBe(node);
    });

    it('throws for invalid index', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });
      const item = new StringValueNode(undefined, '0', { type: 'string' });

      expect(() => node.replaceAt(0, item)).toThrow('Index out of bounds: 0');
    });
  });

  describe('clear', () => {
    it('removes all items', () => {
      const items = [
        new StringValueNode(undefined, '0', { type: 'string' }, 'a'),
        new StringValueNode(undefined, '1', { type: 'string' }, 'b'),
      ];
      const node = new ArrayValueNode(
        undefined,
        'items',
        { type: 'array' },
        items,
      );

      node.clear();

      expect(node.length).toBe(0);
    });

    it('clears parent on all items', () => {
      const item1 = new StringValueNode(undefined, '0', { type: 'string' });
      const item2 = new StringValueNode(undefined, '1', { type: 'string' });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item1,
        item2,
      ]);

      node.clear();

      expect(item1.parent).toBeNull();
      expect(item2.parent).toBeNull();
    });

    it('does nothing on empty array', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });

      node.clear();

      expect(node.length).toBe(0);
    });
  });

  describe('getPlainValue', () => {
    it('returns array of primitive values', () => {
      const items = ['a', 'b', 'c'].map(
        (v, i) =>
          new StringValueNode(undefined, String(i), { type: 'string' }, v),
      );
      const node = new ArrayValueNode(
        undefined,
        'items',
        { type: 'array' },
        items,
      );

      expect(node.getPlainValue()).toEqual(['a', 'b', 'c']);
    });

    it('returns array of objects', () => {
      const item = new ObjectValueNode(undefined, '0', { type: 'object' }, [
        new StringValueNode(undefined, 'name', { type: 'string' }, 'John'),
        new NumberValueNode(undefined, 'age', { type: 'number' }, 25),
      ]);
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(node.getPlainValue()).toEqual([{ name: 'John', age: 25 }]);
    });

    it('returns nested arrays', () => {
      const inner1 = new ArrayValueNode(undefined, '0', { type: 'array' }, [
        new NumberValueNode(undefined, '0', { type: 'number' }, 1),
        new NumberValueNode(undefined, '1', { type: 'number' }, 2),
      ]);
      const inner2 = new ArrayValueNode(undefined, '1', { type: 'array' }, [
        new NumberValueNode(undefined, '0', { type: 'number' }, 3),
        new NumberValueNode(undefined, '1', { type: 'number' }, 4),
      ]);
      const node = new ArrayValueNode(undefined, 'matrix', { type: 'array' }, [
        inner1,
        inner2,
      ]);

      expect(node.getPlainValue()).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('returns empty array for empty node', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });

      expect(node.getPlainValue()).toEqual([]);
    });
  });

  describe('validation - errors aggregation', () => {
    it('collects errors from items', () => {
      const item1 = new StringValueNode(undefined, '0', {
        type: 'string',
        required: true,
      });
      const item2 = new NumberValueNode(
        undefined,
        '1',
        {
          type: 'number',
          minimum: 10,
        },
        5,
      );
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item1,
        item2,
      ]);

      const errors = node.errors;

      expect(errors).toHaveLength(2);
    });

    it('returns empty when all items valid', () => {
      const items = ['a', 'b'].map(
        (v, i) =>
          new StringValueNode(undefined, String(i), { type: 'string' }, v),
      );
      const node = new ArrayValueNode(
        undefined,
        'items',
        { type: 'array' },
        items,
      );

      expect(node.errors).toHaveLength(0);
    });

    it('collects nested object errors', () => {
      const item = new ObjectValueNode(undefined, '0', { type: 'object' }, [
        new StringValueNode(undefined, 'name', {
          type: 'string',
          required: true,
        }),
      ]);
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(node.errors).toHaveLength(1);
    });
  });

  describe('validation - warnings aggregation', () => {
    it('collects warnings from items', () => {
      const item = new NumberValueNode(undefined, '0', { type: 'number' });
      item.setFormulaWarning({
        type: 'nan',
        message: 'test',
        expression: 'test',
        computedValue: NaN,
      });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(node.warnings).toHaveLength(1);
    });
  });

  describe('isValid and hasWarnings', () => {
    it('isValid is true when all items valid', () => {
      const items = ['a', 'b'].map(
        (v, i) =>
          new StringValueNode(undefined, String(i), { type: 'string' }, v),
      );
      const node = new ArrayValueNode(
        undefined,
        'items',
        { type: 'array' },
        items,
      );

      expect(node.isValid).toBe(true);
    });

    it('isValid is false when any item invalid', () => {
      const item = new StringValueNode(undefined, '0', {
        type: 'string',
        required: true,
      });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(node.isValid).toBe(false);
    });

    it('hasWarnings is true when any item has warnings', () => {
      const item = new NumberValueNode(undefined, '0', { type: 'number' });
      item.setFormulaWarning({
        type: 'nan',
        message: 'test',
        expression: 'test',
        computedValue: NaN,
      });
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      expect(node.hasWarnings).toBe(true);
    });
  });

  describe('type checks', () => {
    it('isArray returns true', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });

      expect(node.isArray()).toBe(true);
    });

    it('isObject returns false', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });

      expect(node.isObject()).toBe(false);
    });

    it('isPrimitive returns false', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });

      expect(node.isPrimitive()).toBe(false);
    });
  });

  describe('smart array handling', () => {
    const factory = createNodeFactory();

    describe('pushValue', () => {
      it('creates and pushes node from value for string items', () => {
        const schema = {
          type: 'array',
          items: { type: 'string', default: '' },
        };
        const node = new ArrayValueNode(undefined, 'items', schema);
        node.setNodeFactory(factory);

        node.pushValue('hello');

        expect(node.length).toBe(1);
        expect(node.at(0)?.getPlainValue()).toBe('hello');
      });

      it('creates and pushes node from value for number items', () => {
        const schema = { type: 'array', items: { type: 'number', default: 0 } };
        const node = new ArrayValueNode(undefined, 'items', schema);
        node.setNodeFactory(factory);

        node.pushValue(42);

        expect(node.length).toBe(1);
        expect(node.at(0)?.getPlainValue()).toBe(42);
      });

      it('creates and pushes node from value for object items', () => {
        const schema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', default: '' },
              age: { type: 'number', default: 0 },
            },
          },
        };
        const node = new ArrayValueNode(undefined, 'items', schema);
        node.setNodeFactory(factory);

        node.pushValue({ name: 'John', age: 30 });

        expect(node.length).toBe(1);
        expect(node.at(0)?.getPlainValue()).toEqual({ name: 'John', age: 30 });
      });

      it('uses default value when no value provided', () => {
        const schema = {
          type: 'array',
          items: { type: 'string', default: 'default' },
        };
        const node = new ArrayValueNode(undefined, 'items', schema);
        node.setNodeFactory(factory);

        node.pushValue();

        expect(node.length).toBe(1);
        expect(node.at(0)?.getPlainValue()).toBe('default');
      });

      it('throws when no factory set', () => {
        const schema = { type: 'array', items: { type: 'string' } };
        const node = new ArrayValueNode(undefined, 'items', schema);

        expect(() => node.pushValue('test')).toThrow('NodeFactory not set');
      });

      it('throws when no items schema', () => {
        const schema = { type: 'array' };
        const node = new ArrayValueNode(undefined, 'items', schema);
        node.setNodeFactory(factory);

        expect(() => node.pushValue('test')).toThrow('No items schema');
      });

      it('sets parent on created node', () => {
        const schema = {
          type: 'array',
          items: { type: 'string', default: '' },
        };
        const node = new ArrayValueNode(undefined, 'items', schema);
        node.setNodeFactory(factory);

        node.pushValue('test');

        expect(node.at(0)?.parent).toBe(node);
      });
    });

    describe('insertValueAt', () => {
      it('creates and inserts node at specific index', () => {
        const schema = {
          type: 'array',
          items: { type: 'string', default: '' },
        };
        const existing = new StringValueNode(
          undefined,
          '0',
          { type: 'string' },
          'first',
        );
        const node = new ArrayValueNode(undefined, 'items', schema, [existing]);
        node.setNodeFactory(factory);

        node.insertValueAt(0, 'inserted');

        expect(node.length).toBe(2);
        expect(node.at(0)?.getPlainValue()).toBe('inserted');
        expect(node.at(1)?.getPlainValue()).toBe('first');
      });

      it('creates object node at specific index', () => {
        const schema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', default: 0 },
            },
          },
        };
        const node = new ArrayValueNode(undefined, 'items', schema);
        node.setNodeFactory(factory);

        node.insertValueAt(0, { id: 123 });

        expect(node.at(0)?.getPlainValue()).toEqual({ id: 123 });
      });

      it('uses default value when no value provided', () => {
        const schema = {
          type: 'array',
          items: { type: 'number', default: 99 },
        };
        const node = new ArrayValueNode(undefined, 'items', schema);
        node.setNodeFactory(factory);

        node.insertValueAt(0);

        expect(node.at(0)?.getPlainValue()).toBe(99);
      });

      it('throws when no factory set', () => {
        const schema = { type: 'array', items: { type: 'string' } };
        const node = new ArrayValueNode(undefined, 'items', schema);

        expect(() => node.insertValueAt(0, 'test')).toThrow(
          'NodeFactory not set',
        );
      });

      it('throws for invalid index', () => {
        const schema = {
          type: 'array',
          items: { type: 'string', default: '' },
        };
        const node = new ArrayValueNode(undefined, 'items', schema);
        node.setNodeFactory(factory);

        expect(() => node.insertValueAt(-1, 'test')).toThrow(
          'Index out of bounds',
        );
      });
    });

    describe('nested arrays', () => {
      it('creates nested array items', () => {
        const schema = {
          type: 'array',
          items: {
            type: 'array',
            items: { type: 'number', default: 0 },
          },
        };
        const node = new ArrayValueNode(undefined, 'matrix', schema);
        node.setNodeFactory(factory);

        node.pushValue([1, 2, 3]);

        expect(node.length).toBe(1);
        expect(node.at(0)?.getPlainValue()).toEqual([1, 2, 3]);
      });
    });

    describe('propagates factory to children', () => {
      it('pushValue child can use pushValue', () => {
        const schema = {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tags: {
                type: 'array',
                items: { type: 'string', default: '' },
              },
            },
          },
        };
        const node = new ArrayValueNode(undefined, 'items', schema);
        node.setNodeFactory(factory);

        node.pushValue({ tags: [] });

        const item = node.at(0);
        expect(item?.isObject()).toBe(true);
        if (item?.isObject()) {
          const tagsNode = item.child('tags');
          expect(tagsNode?.isArray()).toBe(true);
          if (tagsNode?.isArray()) {
            tagsNode.pushValue('tag1');
            expect(tagsNode.length).toBe(1);
            expect(tagsNode.at(0)?.getPlainValue()).toBe('tag1');
          }
        }
      });
    });
  });

  describe('dirty tracking', () => {
    it('isDirty is false initially', () => {
      const items = ['a', 'b'].map(
        (v, i) =>
          new StringValueNode(undefined, String(i), { type: 'string' }, v),
      );
      const node = new ArrayValueNode(
        undefined,
        'items',
        { type: 'array' },
        items,
      );

      expect(node.isDirty).toBe(false);
    });

    it('isDirty is true after push', () => {
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' });
      const item = new StringValueNode(undefined, '0', { type: 'string' }, 'a');

      node.push(item);

      expect(node.isDirty).toBe(true);
    });

    it('isDirty is true after removeAt', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' }, 'a');
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      node.removeAt(0);

      expect(node.isDirty).toBe(true);
    });

    it('isDirty is true after move', () => {
      const items = ['a', 'b', 'c'].map(
        (v, i) =>
          new StringValueNode(undefined, String(i), { type: 'string' }, v),
      );
      const node = new ArrayValueNode(
        undefined,
        'items',
        { type: 'array' },
        items,
      );

      node.move(0, 2);

      expect(node.isDirty).toBe(true);
    });

    it('isDirty is true when child is dirty', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' }, 'a');
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);

      item.setValue('b');

      expect(node.isDirty).toBe(true);
    });

    it('commit resets isDirty', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' }, 'a');
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);
      item.setValue('b');

      node.commit();

      expect(node.isDirty).toBe(false);
      expect(item.isDirty).toBe(false);
    });

    it('revert restores child values', () => {
      const item = new StringValueNode(undefined, '0', { type: 'string' }, 'a');
      const node = new ArrayValueNode(undefined, 'items', { type: 'array' }, [
        item,
      ]);
      item.setValue('b');

      node.revert();

      expect(item.value).toBe('a');
      expect(node.isDirty).toBe(false);
    });
  });
});
