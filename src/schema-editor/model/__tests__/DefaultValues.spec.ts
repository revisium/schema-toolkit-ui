import {
  getDefaultValueFromSchema,
  getDefaultValueExample,
} from '../utils/DefaultValues';
import type { JsonSchemaType } from '../schema/JsonSchema';

describe('DefaultValues', () => {
  describe('getDefaultValueFromSchema', () => {
    it('returns null for $ref schema', () => {
      const schema: JsonSchemaType = { $ref: 'File' };
      expect(getDefaultValueFromSchema(schema)).toBeNull();
    });

    it('returns empty string for string type without default', () => {
      const schema: JsonSchemaType = { type: 'string' };
      expect(getDefaultValueFromSchema(schema)).toBe('');
    });

    it('returns default value for string type with default', () => {
      const schema: JsonSchemaType = { type: 'string', default: 'hello' };
      expect(getDefaultValueFromSchema(schema)).toBe('hello');
    });

    it('returns 0 for number type without default', () => {
      const schema: JsonSchemaType = { type: 'number' };
      expect(getDefaultValueFromSchema(schema)).toBe(0);
    });

    it('returns default value for number type with default', () => {
      const schema: JsonSchemaType = { type: 'number', default: 42 };
      expect(getDefaultValueFromSchema(schema)).toBe(42);
    });

    it('returns false for boolean type without default', () => {
      const schema: JsonSchemaType = { type: 'boolean' };
      expect(getDefaultValueFromSchema(schema)).toBe(false);
    });

    it('returns default value for boolean type with default', () => {
      const schema: JsonSchemaType = { type: 'boolean', default: true };
      expect(getDefaultValueFromSchema(schema)).toBe(true);
    });

    it('returns default value for array type with default', () => {
      const schema: JsonSchemaType = {
        type: 'array',
        items: { type: 'string', default: '' },
        default: ['a', 'b'],
      };
      expect(getDefaultValueFromSchema(schema)).toEqual(['a', 'b']);
    });

    it('returns array with item default for array type without default', () => {
      const schema: JsonSchemaType = {
        type: 'array',
        items: { type: 'string', default: 'item' },
      };
      expect(getDefaultValueFromSchema(schema)).toEqual(['item']);
    });

    it('returns empty array for array type without items', () => {
      const schema: JsonSchemaType = { type: 'array' };
      expect(getDefaultValueFromSchema(schema)).toEqual([]);
    });

    it('returns default value for object type with default', () => {
      const schema: JsonSchemaType = {
        type: 'object',
        properties: {},
        default: { foo: 'bar' },
      };
      expect(getDefaultValueFromSchema(schema)).toEqual({ foo: 'bar' });
    });

    it('returns object with property defaults for object type', () => {
      const schema: JsonSchemaType = {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          age: { type: 'number', default: 0 },
        },
      };
      expect(getDefaultValueFromSchema(schema)).toEqual({ name: '', age: 0 });
    });

    it('returns empty object for object type without properties', () => {
      const schema: JsonSchemaType = { type: 'object' };
      expect(getDefaultValueFromSchema(schema)).toEqual({});
    });

    it('returns null for unknown type', () => {
      const schema = { type: 'unknown' } as JsonSchemaType;
      expect(getDefaultValueFromSchema(schema)).toBeNull();
    });

    it('returns null for schema without type or $ref', () => {
      const schema = {} as JsonSchemaType;
      expect(getDefaultValueFromSchema(schema)).toBeNull();
    });
  });

  describe('getDefaultValueExample', () => {
    it('returns example for string field', () => {
      const result = getDefaultValueExample({
        op: 'add',
        path: '/properties/name',
        value: { type: 'string', default: 'test' },
      });
      expect(result).toEqual({
        value: 'test',
        type: 'string',
        foreignKeyTableId: undefined,
      });
    });

    it('returns example with foreignKeyTableId for foreign key field', () => {
      const result = getDefaultValueExample({
        op: 'add',
        path: '/properties/categoryId',
        value: {
          type: 'string',
          default: '',
          foreignKey: 'categories',
        } as JsonSchemaType,
      });
      expect(result).toEqual({
        value: '',
        type: 'string',
        foreignKeyTableId: 'categories',
      });
    });

    it('returns example for ref field', () => {
      const result = getDefaultValueExample({
        op: 'add',
        path: '/properties/file',
        value: { $ref: 'File' },
      });
      expect(result).toEqual({
        value: null,
        type: 'ref',
        foreignKeyTableId: undefined,
      });
    });

    it('returns null for non-add operation', () => {
      const result = getDefaultValueExample({
        op: 'add',
        path: '/properties/name',
        value: { type: 'string' },
      });
      expect(result).not.toBeNull();
    });
  });
});
