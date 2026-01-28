import { describe, it, expect, beforeEach } from '@jest/globals';
import { TreeNavigator } from '../tree/TreeNavigator';
import { SchemaParser, resetIdCounter } from '../schema/SchemaParser';
import { EMPTY_PATH, PathFromSegments } from '../path/Paths';
import { PropertySegment, ITEMS_SEGMENT } from '../path/PathSegment';
import {
  createSchema,
  stringField,
  numberField,
  objectField,
  arrayField,
} from './test-helpers';
import type { JsonObjectSchema } from '../schema/JsonSchema';

beforeEach(() => {
  resetIdCounter();
});

const parseSchema = (properties: Record<string, unknown>) => {
  const schema = createSchema(properties);
  const parser = new SchemaParser();
  return parser.parse(schema);
};

describe('TreeNavigator', () => {
  describe('navigateNode', () => {
    it('returns root for empty path', () => {
      const root = parseSchema({ name: stringField() });
      const result = TreeNavigator.navigateNode(root, EMPTY_PATH);
      expect(result).toBe(root);
    });

    it('returns child node for property path', () => {
      const root = parseSchema({ name: stringField() });
      const path = new PathFromSegments([new PropertySegment('name')]);

      const result = TreeNavigator.navigateNode(root, path);

      expect(result.isNull()).toBe(false);
      expect(result.name()).toBe('name');
      expect(result.nodeType()).toBe('string');
    });

    it('returns nested node for nested path', () => {
      const root = parseSchema({
        user: objectField({
          profile: objectField({
            age: numberField(),
          }),
        }),
      });
      const path = new PathFromSegments([
        new PropertySegment('user'),
        new PropertySegment('profile'),
        new PropertySegment('age'),
      ]);

      const result = TreeNavigator.navigateNode(root, path);

      expect(result.isNull()).toBe(false);
      expect(result.name()).toBe('age');
      expect(result.nodeType()).toBe('number');
    });

    it('returns array items node', () => {
      const root = parseSchema({
        items: arrayField(stringField()),
      });
      const path = new PathFromSegments([
        new PropertySegment('items'),
        ITEMS_SEGMENT,
      ]);

      const result = TreeNavigator.navigateNode(root, path);

      expect(result.isNull()).toBe(false);
      expect(result.nodeType()).toBe('string');
    });

    it('returns nested object in array items', () => {
      const root = parseSchema({
        users: arrayField(
          objectField({
            name: stringField(),
          }),
        ),
      });
      const path = new PathFromSegments([
        new PropertySegment('users'),
        ITEMS_SEGMENT,
        new PropertySegment('name'),
      ]);

      const result = TreeNavigator.navigateNode(root, path);

      expect(result.isNull()).toBe(false);
      expect(result.name()).toBe('name');
      expect(result.nodeType()).toBe('string');
    });

    it('returns NULL_NODE for non-existent property', () => {
      const root = parseSchema({ name: stringField() });
      const path = new PathFromSegments([new PropertySegment('unknown')]);

      const result = TreeNavigator.navigateNode(root, path);

      expect(result.isNull()).toBe(true);
    });

    it('returns NULL_NODE when accessing property on non-object', () => {
      const root = parseSchema({ name: stringField() });
      const path = new PathFromSegments([
        new PropertySegment('name'),
        new PropertySegment('nested'),
      ]);

      const result = TreeNavigator.navigateNode(root, path);

      expect(result.isNull()).toBe(true);
    });

    it('returns NULL_NODE when accessing items on non-array', () => {
      const root = parseSchema({ name: stringField() });
      const path = new PathFromSegments([
        new PropertySegment('name'),
        ITEMS_SEGMENT,
      ]);

      const result = TreeNavigator.navigateNode(root, path);

      expect(result.isNull()).toBe(true);
    });
  });

  describe('navigateSchema', () => {
    it('returns schema for empty path', () => {
      const schema = createSchema({ name: stringField() });
      const result = TreeNavigator.navigateSchema(schema, EMPTY_PATH);

      expect(result).toBe(schema);
    });

    it('returns property schema for property path', () => {
      const schema = createSchema({ name: stringField() });
      const path = new PathFromSegments([new PropertySegment('name')]);

      const result = TreeNavigator.navigateSchema(schema, path);

      expect(result).not.toBeNull();
      expect((result as { type: string }).type).toBe('string');
    });

    it('returns nested schema for nested path', () => {
      const schema = createSchema({
        user: objectField({
          profile: objectField({
            age: numberField(),
          }),
        }),
      });
      const path = new PathFromSegments([
        new PropertySegment('user'),
        new PropertySegment('profile'),
        new PropertySegment('age'),
      ]);

      const result = TreeNavigator.navigateSchema(schema, path);

      expect(result).not.toBeNull();
      expect((result as { type: string }).type).toBe('number');
    });

    it('returns items schema for array items path', () => {
      const schema = createSchema({
        items: arrayField(numberField()),
      });
      const path = new PathFromSegments([
        new PropertySegment('items'),
        ITEMS_SEGMENT,
      ]);

      const result = TreeNavigator.navigateSchema(schema, path);

      expect(result).not.toBeNull();
      expect((result as { type: string }).type).toBe('number');
    });

    it('returns nested object in array items', () => {
      const schema = createSchema({
        users: arrayField(
          objectField({
            name: stringField(),
          }),
        ),
      });
      const path = new PathFromSegments([
        new PropertySegment('users'),
        ITEMS_SEGMENT,
        new PropertySegment('name'),
      ]);

      const result = TreeNavigator.navigateSchema(schema, path);

      expect(result).not.toBeNull();
      expect((result as { type: string }).type).toBe('string');
    });

    it('returns null for non-existent property', () => {
      const schema = createSchema({ name: stringField() });
      const path = new PathFromSegments([new PropertySegment('unknown')]);

      const result = TreeNavigator.navigateSchema(schema, path);

      expect(result).toBeNull();
    });

    it('returns null when accessing property on non-object', () => {
      const schema = createSchema({ name: stringField() });
      const path = new PathFromSegments([
        new PropertySegment('name'),
        new PropertySegment('nested'),
      ]);

      const result = TreeNavigator.navigateSchema(schema, path);

      expect(result).toBeNull();
    });

    it('returns null when accessing items on non-array', () => {
      const schema = createSchema({ name: stringField() });
      const path = new PathFromSegments([
        new PropertySegment('name'),
        ITEMS_SEGMENT,
      ]);

      const result = TreeNavigator.navigateSchema(schema, path);

      expect(result).toBeNull();
    });

    it('returns null when schema has no properties', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        additionalProperties: false,
        required: [],
      };
      const path = new PathFromSegments([new PropertySegment('name')]);

      const result = TreeNavigator.navigateSchema(schema, path);

      expect(result).toBeNull();
    });

    it('returns null when array has no items', () => {
      const schema = createSchema({
        arr: { type: 'array' },
      });
      const path = new PathFromSegments([
        new PropertySegment('arr'),
        ITEMS_SEGMENT,
      ]);

      const result = TreeNavigator.navigateSchema(schema, path);

      expect(result).toBeNull();
    });
  });
});
