import { jest } from '@jest/globals';
import { stringTypeDescriptor } from '../types/StringTypeDescriptor';
import { numberTypeDescriptor } from '../types/NumberTypeDescriptor';
import { booleanTypeDescriptor } from '../types/BooleanTypeDescriptor';
import { objectTypeDescriptor } from '../types/ObjectTypeDescriptor';
import { arrayTypeDescriptor } from '../types/ArrayTypeDescriptor';
import { refTypeDescriptor } from '../types/RefTypeDescriptor';
import {
  PRIMITIVE_CAPABILITIES,
  OBJECT_CAPABILITIES,
  ARRAY_CAPABILITIES,
  REF_CAPABILITIES,
} from '../registry';
import type { ParseContext, SerializeContext } from '../registry';
import type { JsonSchemaType } from '../schema/JsonSchema';
import { NodeFactory } from '../factory/NodeFactory';
import { EMPTY_METADATA } from '../node/NodeMetadata';

let idCounter = 0;

const createParseContext = (): ParseContext => ({
  generateId: () => `node-${++idCounter}`,
  parseNode: jest.fn(),
  addPendingFormula: jest.fn(),
});

const createSerializeContext = (): SerializeContext => ({
  serialize: jest.fn(() => ({ type: 'string', default: '' }) as JsonSchemaType),
});

beforeEach(() => {
  idCounter = 0;
});

describe('stringTypeDescriptor', () => {
  it('has correct type and capabilities', () => {
    expect(stringTypeDescriptor.type).toBe('string');
    expect(stringTypeDescriptor.capabilities).toBe(PRIMITIVE_CAPABILITIES);
  });

  describe('canParse()', () => {
    it('returns true for string schema', () => {
      expect(
        stringTypeDescriptor.canParse({ type: 'string', default: '' }),
      ).toBe(true);
    });

    it('returns false for other schemas', () => {
      expect(
        stringTypeDescriptor.canParse({ type: 'number', default: 0 }),
      ).toBe(false);
      expect(stringTypeDescriptor.canParse({ $ref: 'File' })).toBe(false);
    });
  });

  describe('parse()', () => {
    it('parses basic string schema', () => {
      const ctx = createParseContext();
      const node = stringTypeDescriptor.parse(
        { type: 'string', default: 'hello' },
        'name',
        EMPTY_METADATA,
        ctx,
      );

      expect(node.name()).toBe('name');
      expect(node.defaultValue()).toBe('hello');
    });

    it('parses string with foreignKey', () => {
      const ctx = createParseContext();
      const node = stringTypeDescriptor.parse(
        { type: 'string', default: '', foreignKey: 'users' },
        'userId',
        EMPTY_METADATA,
        ctx,
      );

      expect(node.foreignKey()).toBe('users');
    });

    it('adds pending formula', () => {
      const ctx = createParseContext();
      stringTypeDescriptor.parse(
        {
          type: 'string',
          default: '',
          readOnly: true,
          'x-formula': { version: 1, expression: 'a + b' },
        },
        'computed',
        EMPTY_METADATA,
        ctx,
      );

      expect(ctx.addPendingFormula).toHaveBeenCalledWith('node-1', 'a + b');
    });
  });

  describe('serialize()', () => {
    it('serializes basic string node', () => {
      const ctx = createSerializeContext();
      const node = NodeFactory.string('name');

      const result = stringTypeDescriptor.serialize(node, ctx);

      expect(result).toEqual({ type: 'string', default: '' });
    });

    it('serializes string with foreignKey', () => {
      const ctx = createSerializeContext();
      const node = NodeFactory.string('userId', { foreignKey: 'users' });

      const result = stringTypeDescriptor.serialize(node, ctx);

      expect(result.foreignKey).toBe('users');
    });
  });

  describe('getDefaultValue()', () => {
    it('returns schema default', () => {
      expect(
        stringTypeDescriptor.getDefaultValue({
          type: 'string',
          default: 'test',
        }),
      ).toBe('test');
    });
  });

  describe('parseDefaultValueString()', () => {
    it('returns string as-is', () => {
      expect(stringTypeDescriptor.parseDefaultValueString('hello')).toBe(
        'hello',
      );
    });
  });
});

describe('numberTypeDescriptor', () => {
  it('has correct type and capabilities', () => {
    expect(numberTypeDescriptor.type).toBe('number');
    expect(numberTypeDescriptor.capabilities).toBe(PRIMITIVE_CAPABILITIES);
  });

  describe('canParse()', () => {
    it('returns true for number schema', () => {
      expect(
        numberTypeDescriptor.canParse({ type: 'number', default: 0 }),
      ).toBe(true);
    });
  });

  describe('parse()', () => {
    it('parses number schema', () => {
      const ctx = createParseContext();
      const node = numberTypeDescriptor.parse(
        { type: 'number', default: 42 },
        'count',
        EMPTY_METADATA,
        ctx,
      );

      expect(node.name()).toBe('count');
      expect(node.defaultValue()).toBe(42);
    });
  });

  describe('parseDefaultValueString()', () => {
    it('parses valid number', () => {
      expect(numberTypeDescriptor.parseDefaultValueString('42')).toBe(42);
      expect(numberTypeDescriptor.parseDefaultValueString('3.14')).toBe(3.14);
    });

    it('returns undefined for invalid number', () => {
      expect(
        numberTypeDescriptor.parseDefaultValueString('abc'),
      ).toBeUndefined();
      expect(numberTypeDescriptor.parseDefaultValueString('')).toBeUndefined();
    });
  });
});

describe('booleanTypeDescriptor', () => {
  it('has correct type and capabilities', () => {
    expect(booleanTypeDescriptor.type).toBe('boolean');
    expect(booleanTypeDescriptor.capabilities).toBe(PRIMITIVE_CAPABILITIES);
  });

  describe('parseDefaultValueString()', () => {
    it('parses true/false strings', () => {
      expect(booleanTypeDescriptor.parseDefaultValueString('true')).toBe(true);
      expect(booleanTypeDescriptor.parseDefaultValueString('TRUE')).toBe(true);
      expect(booleanTypeDescriptor.parseDefaultValueString('false')).toBe(
        false,
      );
      expect(booleanTypeDescriptor.parseDefaultValueString('FALSE')).toBe(
        false,
      );
    });

    it('returns undefined for invalid boolean', () => {
      expect(
        booleanTypeDescriptor.parseDefaultValueString('yes'),
      ).toBeUndefined();
      expect(booleanTypeDescriptor.parseDefaultValueString('')).toBeUndefined();
    });
  });
});

describe('objectTypeDescriptor', () => {
  it('has correct type and capabilities', () => {
    expect(objectTypeDescriptor.type).toBe('object');
    expect(objectTypeDescriptor.capabilities).toBe(OBJECT_CAPABILITIES);
  });

  describe('canParse()', () => {
    it('returns true for object schema', () => {
      const schema = {
        type: 'object' as const,
        properties: {},
        required: [],
        additionalProperties: false as const,
      };
      expect(objectTypeDescriptor.canParse(schema)).toBe(true);
    });
  });

  describe('parse()', () => {
    it('parses object schema with children', () => {
      const ctx = createParseContext();
      const childNode = NodeFactory.string('child');
      (ctx.parseNode as jest.Mock).mockReturnValue(childNode);

      const schema = {
        type: 'object' as const,
        properties: { name: { type: 'string' as const, default: '' } },
        required: ['name'],
        additionalProperties: false as const,
      };

      const node = objectTypeDescriptor.parse(
        schema,
        'root',
        EMPTY_METADATA,
        ctx,
      );

      expect(node.name()).toBe('root');
      expect(ctx.parseNode).toHaveBeenCalledWith(
        { type: 'string', default: '' },
        'name',
      );
    });
  });

  describe('serialize()', () => {
    it('serializes object node', () => {
      const ctx = createSerializeContext();
      const node = NodeFactory.object('user', [NodeFactory.string('name')]);
      (ctx.serialize as jest.Mock).mockReturnValue({
        type: 'string',
        default: '',
      });

      const result = objectTypeDescriptor.serialize(node, ctx);

      expect(result.type).toBe('object');
      expect(result.required).toContain('name');
      expect(result.properties.name).toBeDefined();
    });
  });
});

describe('arrayTypeDescriptor', () => {
  it('has correct type and capabilities', () => {
    expect(arrayTypeDescriptor.type).toBe('array');
    expect(arrayTypeDescriptor.capabilities).toBe(ARRAY_CAPABILITIES);
  });

  describe('parse()', () => {
    it('parses array schema', () => {
      const ctx = createParseContext();
      const itemsNode = NodeFactory.string('');
      (ctx.parseNode as jest.Mock).mockReturnValue(itemsNode);

      const schema = {
        type: 'array' as const,
        items: { type: 'string' as const, default: '' },
      };

      const node = arrayTypeDescriptor.parse(
        schema,
        'tags',
        EMPTY_METADATA,
        ctx,
      );

      expect(node.name()).toBe('tags');
      expect(ctx.parseNode).toHaveBeenCalledWith(
        { type: 'string', default: '' },
        '',
      );
    });
  });
});

describe('refTypeDescriptor', () => {
  it('has correct type and capabilities', () => {
    expect(refTypeDescriptor.type).toBe('ref');
    expect(refTypeDescriptor.capabilities).toBe(REF_CAPABILITIES);
  });

  describe('canParse()', () => {
    it('returns true for ref schema', () => {
      expect(refTypeDescriptor.canParse({ $ref: 'File' })).toBe(true);
    });

    it('returns false for non-ref schemas', () => {
      expect(refTypeDescriptor.canParse({ type: 'string', default: '' })).toBe(
        false,
      );
    });
  });

  describe('parse()', () => {
    it('parses ref schema', () => {
      const ctx = createParseContext();
      const node = refTypeDescriptor.parse(
        { $ref: 'File' },
        'avatar',
        EMPTY_METADATA,
        ctx,
      );

      expect(node.name()).toBe('avatar');
      expect(node.ref()).toBe('File');
    });
  });

  describe('serialize()', () => {
    it('serializes ref node', () => {
      const ctx = createSerializeContext();
      const node = NodeFactory.ref('file', { $ref: 'File' });

      const result = refTypeDescriptor.serialize(node, ctx);

      expect(result.$ref).toBe('File');
    });
  });
});
