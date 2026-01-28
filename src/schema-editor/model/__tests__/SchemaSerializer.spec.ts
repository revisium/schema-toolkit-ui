import { SchemaSerializer } from '../schema/SchemaSerializer';
import { NodeFactory } from '../node/NodeFactory';
import { StringNode } from '../node/StringNode';
import { NumberNode } from '../node/NumberNode';
import { BooleanNode } from '../node/BooleanNode';
import { NULL_NODE } from '../node/NullNode';
import type { Formula } from '../formula/Formula';
import type { ASTNode } from '@revisium/formula';

const createMockFormula = (expression: string): Formula => ({
  version: () => 1,
  expression: () => expression,
  ast: () => ({ type: 'NumberLiteral', value: 0 }) as ASTNode,
  dependencies: () => [],
});

describe('SchemaSerializer', () => {
  let serializer: SchemaSerializer;

  beforeEach(() => {
    serializer = new SchemaSerializer();
  });

  describe('serialize object', () => {
    it('serializes empty object', () => {
      const node = NodeFactory.object('root');
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'object',
        required: [],
        properties: {},
        additionalProperties: false,
      });
    });

    it('serializes object with children', () => {
      const node = NodeFactory.object('root', [
        NodeFactory.string('name'),
        NodeFactory.number('age'),
      ]);
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'object',
        required: ['name', 'age'],
        properties: {
          name: { type: 'string', default: '' },
          age: { type: 'number', default: 0 },
        },
        additionalProperties: false,
      });
    });

    it('serializes nested objects', () => {
      const address = NodeFactory.object('address', [
        NodeFactory.string('city'),
      ]);
      const node = NodeFactory.object('root', [address]);
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'object',
        required: ['address'],
        properties: {
          address: {
            type: 'object',
            required: ['city'],
            properties: {
              city: { type: 'string', default: '' },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      });
    });
  });

  describe('serialize array', () => {
    it('serializes array with string items', () => {
      const node = NodeFactory.array('tags', NodeFactory.string(''));
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'array',
        items: { type: 'string', default: '' },
      });
    });

    it('serializes array with object items', () => {
      const itemSchema = NodeFactory.object('', [NodeFactory.string('name')]);
      const node = NodeFactory.array('items', itemSchema);
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'array',
        items: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', default: '' },
          },
          additionalProperties: false,
        },
      });
    });
  });

  describe('serialize ref', () => {
    it('serializes ref node', () => {
      const node = NodeFactory.ref('file', { $ref: 'File' });
      const result = serializer.serialize(node);

      expect(result).toEqual({
        $ref: 'File',
      });
    });

    it('serializes ref with metadata', () => {
      const node = NodeFactory.ref('file', { $ref: 'File' });
      node.setMetadata({
        title: 'My File',
        description: 'A file reference',
        deprecated: true,
      });
      const result = serializer.serialize(node);

      expect(result).toEqual({
        $ref: 'File',
        title: 'My File',
        description: 'A file reference',
        deprecated: true,
      });
    });
  });

  describe('serialize string', () => {
    it('serializes basic string', () => {
      const node = NodeFactory.string('name');
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'string',
        default: '',
      });
    });

    it('serializes string with default value', () => {
      const node = new StringNode('id', 'greeting', { defaultValue: 'Hello' });
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'string',
        default: 'Hello',
      });
    });

    it('serializes string with foreignKey', () => {
      const node = NodeFactory.string('userId', { foreignKey: 'users' });
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'string',
        default: '',
        foreignKey: 'users',
      });
    });

    it('serializes string with contentMediaType', () => {
      const node = NodeFactory.string('content', {
        contentMediaType: 'text/markdown',
      });
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'string',
        default: '',
        contentMediaType: 'text/markdown',
      });
    });

    it('serializes string with format', () => {
      const node = new StringNode('id', 'date');
      node.setFormat('date-time');
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'string',
        default: '',
        format: 'date-time',
      });
    });

    it('serializes string with enum', () => {
      const node = new StringNode('id', 'status');
      node.setEnumValues(['active', 'inactive']);
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'string',
        default: '',
        enum: ['active', 'inactive'],
      });
    });

    it('serializes string with formula', () => {
      const node = new StringNode('id', 'computed');
      node.setFormula(createMockFormula('"Hello, " + name'));
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'string',
        default: '',
        readOnly: true,
        'x-formula': { version: 1, expression: '"Hello, " + name' },
      });
    });
  });

  describe('serialize number', () => {
    it('serializes basic number', () => {
      const node = NodeFactory.number('age');
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'number',
        default: 0,
      });
    });

    it('serializes number with default value', () => {
      const node = new NumberNode('id', 'count', { defaultValue: 10 });
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'number',
        default: 10,
      });
    });

    it('serializes number with formula', () => {
      const node = new NumberNode('id', 'total');
      node.setFormula(createMockFormula('price * quantity'));
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'number',
        default: 0,
        readOnly: true,
        'x-formula': { version: 1, expression: 'price * quantity' },
      });
    });
  });

  describe('serialize boolean', () => {
    it('serializes basic boolean', () => {
      const node = NodeFactory.boolean('active');
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'boolean',
        default: false,
      });
    });

    it('serializes boolean with default value', () => {
      const node = new BooleanNode('id', 'enabled', { defaultValue: true });
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'boolean',
        default: true,
      });
    });

    it('serializes boolean with formula', () => {
      const node = new BooleanNode('id', 'isPositive');
      node.setFormula(createMockFormula('value > 0'));
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'boolean',
        default: false,
        readOnly: true,
        'x-formula': { version: 1, expression: 'value > 0' },
      });
    });
  });

  describe('metadata', () => {
    it('serializes object with metadata', () => {
      const node = NodeFactory.object('user');
      node.setMetadata({
        title: 'User',
        description: 'A user object',
        deprecated: true,
      });
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'object',
        required: [],
        properties: {},
        additionalProperties: false,
        title: 'User',
        description: 'A user object',
        deprecated: true,
      });
    });

    it('serializes string with metadata', () => {
      const node = NodeFactory.string('name');
      node.setMetadata({ description: 'User name' });
      const result = serializer.serialize(node);

      expect(result).toEqual({
        type: 'string',
        default: '',
        description: 'User name',
      });
    });
  });

  describe('error handling', () => {
    it('throws error for null node', () => {
      expect(() => serializer.serialize(NULL_NODE)).toThrow(
        'Cannot serialize null node',
      );
    });
  });
});
