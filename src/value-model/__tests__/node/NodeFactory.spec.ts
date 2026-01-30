import { jest } from '@jest/globals';
import {
  createNodeFactory,
  NodeFactoryRegistry,
  NodeFactory,
  resetNodeIdCounter,
} from '../../node';
import type { SchemaDefinition } from '../../core';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('NodeFactoryRegistry', () => {
  it('registers and retrieves factory', () => {
    const registry = new NodeFactoryRegistry();
    const factory = jest.fn();

    registry.register('custom', factory);

    expect(registry.get('custom')).toBe(factory);
  });

  it('has returns true for registered type', () => {
    const registry = new NodeFactoryRegistry();
    registry.register('custom', jest.fn());

    expect(registry.has('custom')).toBe(true);
    expect(registry.has('unknown')).toBe(false);
  });

  it('supports chaining', () => {
    const registry = new NodeFactoryRegistry();

    const result = registry.register('a', jest.fn()).register('b', jest.fn());

    expect(result).toBe(registry);
  });
});

describe('NodeFactory', () => {
  let factory: NodeFactory;

  beforeEach(() => {
    factory = createNodeFactory();
  });

  describe('primitive types', () => {
    it('creates string node', () => {
      const schema: SchemaDefinition = { type: 'string' };
      const node = factory.create('name', schema, 'John');

      expect(node.isPrimitive()).toBe(true);
      expect(node.name).toBe('name');
      expect(node.getPlainValue()).toBe('John');
    });

    it('creates string node with default value', () => {
      const schema: SchemaDefinition = { type: 'string', default: 'default' };
      const node = factory.create('name', schema, undefined);

      expect(node.getPlainValue()).toBe('default');
    });

    it('creates number node', () => {
      const schema: SchemaDefinition = { type: 'number' };
      const node = factory.create('age', schema, 25);

      expect(node.isPrimitive()).toBe(true);
      expect(node.getPlainValue()).toBe(25);
    });

    it('creates number node with default', () => {
      const schema: SchemaDefinition = { type: 'number', default: 0 };
      const node = factory.create('count', schema, undefined);

      expect(node.getPlainValue()).toBe(0);
    });

    it('creates boolean node', () => {
      const schema: SchemaDefinition = { type: 'boolean' };
      const node = factory.create('active', schema, true);

      expect(node.isPrimitive()).toBe(true);
      expect(node.getPlainValue()).toBe(true);
    });

    it('creates boolean node with default', () => {
      const schema: SchemaDefinition = { type: 'boolean', default: false };
      const node = factory.create('enabled', schema, undefined);

      expect(node.getPlainValue()).toBe(false);
    });
  });

  describe('object type', () => {
    it('creates empty object node', () => {
      const schema: SchemaDefinition = { type: 'object', properties: {} };
      const node = factory.create('user', schema, {});

      expect(node.isObject()).toBe(true);
      expect(node.getPlainValue()).toEqual({});
    });

    it('creates object node with properties', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      };
      const node = factory.create('user', schema, { name: 'John', age: 25 });

      expect(node.isObject()).toBe(true);
      expect(node.getPlainValue()).toEqual({ name: 'John', age: 25 });
    });

    it('creates nested object', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: {
              city: { type: 'string' },
            },
          },
        },
      };
      const node = factory.create('user', schema, {
        address: { city: 'NYC' },
      });

      expect(node.getPlainValue()).toEqual({
        address: { city: 'NYC' },
      });
    });

    it('uses default values for missing properties', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string', default: 'Unknown' },
        },
      };
      const node = factory.create('user', schema, {});

      expect(node.getPlainValue()).toEqual({ name: 'Unknown' });
    });

    it('handles null value as empty object', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
        },
      };
      const node = factory.create('user', schema, null);

      expect(node.getPlainValue()).toEqual({ name: '' });
    });
  });

  describe('array type', () => {
    it('creates empty array node', () => {
      const schema: SchemaDefinition = {
        type: 'array',
        items: { type: 'string' },
      };
      const node = factory.create('tags', schema, []);

      expect(node.isArray()).toBe(true);
      expect(node.getPlainValue()).toEqual([]);
    });

    it('creates array of strings', () => {
      const schema: SchemaDefinition = {
        type: 'array',
        items: { type: 'string' },
      };
      const node = factory.create('tags', schema, ['a', 'b', 'c']);

      expect(node.getPlainValue()).toEqual(['a', 'b', 'c']);
    });

    it('creates array of numbers', () => {
      const schema: SchemaDefinition = {
        type: 'array',
        items: { type: 'number' },
      };
      const node = factory.create('scores', schema, [1, 2, 3]);

      expect(node.getPlainValue()).toEqual([1, 2, 3]);
    });

    it('creates array of objects', () => {
      const schema: SchemaDefinition = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
          },
        },
      };
      const node = factory.create('items', schema, [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
      ]);

      expect(node.getPlainValue()).toEqual([
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
      ]);
    });

    it('creates nested arrays', () => {
      const schema: SchemaDefinition = {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'number' },
        },
      };
      const node = factory.create('matrix', schema, [
        [1, 2],
        [3, 4],
      ]);

      expect(node.getPlainValue()).toEqual([
        [1, 2],
        [3, 4],
      ]);
    });

    it('handles null value as empty array', () => {
      const schema: SchemaDefinition = {
        type: 'array',
        items: { type: 'string' },
      };
      const node = factory.create('tags', schema, null);

      expect(node.getPlainValue()).toEqual([]);
    });

    it('handles undefined value as empty array', () => {
      const schema: SchemaDefinition = {
        type: 'array',
        items: { type: 'string' },
      };
      const node = factory.create('tags', schema, undefined);

      expect(node.getPlainValue()).toEqual([]);
    });
  });

  describe('createTree', () => {
    it('creates root with empty name', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };
      const node = factory.createTree(schema, { name: 'John' });

      expect(node.name).toBe('');
      expect(node.getPlainValue()).toEqual({ name: 'John' });
    });

    it('creates array as root', () => {
      const schema: SchemaDefinition = {
        type: 'array',
        items: { type: 'number' },
      };
      const node = factory.createTree(schema, [1, 2, 3]);

      expect(node.isArray()).toBe(true);
      expect(node.getPlainValue()).toEqual([1, 2, 3]);
    });

    it('creates primitive as root', () => {
      const schema: SchemaDefinition = { type: 'string' };
      const node = factory.createTree(schema, 'hello');

      expect(node.isPrimitive()).toBe(true);
      expect(node.getPlainValue()).toBe('hello');
    });
  });

  describe('custom id', () => {
    it('uses provided id', () => {
      const schema: SchemaDefinition = { type: 'string' };
      const node = factory.create('name', schema, 'John', 'custom-id');

      expect(node.id).toBe('custom-id');
    });

    it('generates id when not provided', () => {
      const schema: SchemaDefinition = { type: 'string' };
      const node = factory.create('name', schema, 'John');

      expect(node.id).toBe('node-1');
    });
  });

  describe('complex schema', () => {
    it('creates complex nested structure', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              addresses: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    city: { type: 'string' },
                    zip: { type: 'string' },
                  },
                },
              },
            },
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      };

      const value = {
        user: {
          name: 'John',
          addresses: [
            { city: 'NYC', zip: '10001' },
            { city: 'LA', zip: '90001' },
          ],
        },
        tags: ['admin', 'user'],
      };

      const node = factory.createTree(schema, value);

      expect(node.getPlainValue()).toEqual(value);
    });
  });

  describe('error handling', () => {
    it('throws for unknown schema type', () => {
      const registry = new NodeFactoryRegistry();
      const factory = new NodeFactory(registry);

      expect(() => factory.create('field', { type: 'unknown' }, null)).toThrow(
        'Unknown schema type: unknown',
      );
    });

    it('defaults to object when type is missing', () => {
      const schema: SchemaDefinition = {
        properties: {
          name: { type: 'string' },
        },
      };
      const node = factory.create('data', schema, { name: 'John' });

      expect(node.isObject()).toBe(true);
    });
  });

  describe('parent relationships', () => {
    it('sets parent on object children', () => {
      const schema: SchemaDefinition = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      };
      const node = factory.create('user', schema, { name: 'John' });

      if (node.isObject()) {
        const nameNode = node.child('name');
        expect(nameNode?.parent).toBe(node);
      }
    });

    it('sets parent on array items', () => {
      const schema: SchemaDefinition = {
        type: 'array',
        items: { type: 'number' },
      };
      const node = factory.create('items', schema, [1, 2]);

      if (node.isArray()) {
        const item = node.at(0);
        expect(item?.parent).toBe(node);
      }
    });
  });
});
