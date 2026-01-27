import { SchemaValidator } from '../validation/SchemaValidator';
import { SchemaParser, resetIdCounter } from '../schema/SchemaParser';
import {
  createSchema,
  stringField,
  numberField,
  objectField,
  arrayField,
} from './test-helpers';

beforeEach(() => {
  resetIdCounter();
});

const parseSchema = (properties: Record<string, unknown>) => {
  const schema = createSchema(properties);
  const parser = new SchemaParser();
  return parser.parse(schema);
};

describe('SchemaValidator', () => {
  const validator = new SchemaValidator();

  describe('validate', () => {
    it('returns empty array for valid schema', () => {
      const root = parseSchema({
        name: stringField(),
        age: numberField(),
      });

      const errors = validator.validate(root);

      expect(errors).toEqual([]);
    });

    it('detects empty field name', () => {
      const root = parseSchema({ name: stringField() });
      root.children()[0].setName('');

      const errors = validator.validate(root);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('empty-name');
      expect(errors[0].message).toBe('Field name is required');
    });

    it('detects duplicate field names', () => {
      const root = parseSchema({
        name: stringField(),
        other: stringField(),
      });
      root.children()[1].setName('name');

      const errors = validator.validate(root);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('duplicate-name');
      expect(errors[0].message).toContain('Duplicate field name: name');
    });

    it('detects invalid field name starting with number', () => {
      const root = parseSchema({ name: stringField() });
      root.children()[0].setName('123abc');

      const errors = validator.validate(root);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('invalid-name');
    });

    it('detects invalid field name starting with __', () => {
      const root = parseSchema({ name: stringField() });
      root.children()[0].setName('__reserved');

      const errors = validator.validate(root);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('invalid-name');
    });

    it('detects invalid field name with special characters', () => {
      const root = parseSchema({ name: stringField() });
      root.children()[0].setName('field@name');

      const errors = validator.validate(root);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('invalid-name');
    });

    it('allows valid field names', () => {
      const root = parseSchema({
        _private: stringField(),
        camelCase: stringField(),
        with_underscore: stringField(),
        'with-hyphen': stringField(),
        ABC123: stringField(),
      });

      const errors = validator.validate(root);

      expect(errors).toEqual([]);
    });

    it('validates nested object fields', () => {
      const root = parseSchema({
        user: objectField({
          name: stringField(),
        }),
      });
      const userNode = root.children()[0];
      userNode.children()[0].setName('');

      const errors = validator.validate(root);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('empty-name');
    });

    it('validates array items', () => {
      const root = parseSchema({
        items: arrayField(
          objectField({
            name: stringField(),
          }),
        ),
      });
      const itemsNode = root.children()[0];
      const itemNode = itemsNode.items();
      itemNode.children()[0].setName('');

      const errors = validator.validate(root);

      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('empty-name');
    });

    it('returns nodeId for each error', () => {
      const root = parseSchema({ name: stringField() });
      const nameNode = root.children()[0];
      nameNode.setName('');

      const errors = validator.validate(root);

      expect(errors[0].nodeId).toBe(nameNode.id());
    });

    it('detects multiple errors', () => {
      const root = parseSchema({
        name: stringField(),
        other: stringField(),
        third: stringField(),
      });
      root.children()[0].setName('');
      root.children()[1].setName('123invalid');
      root.children()[2].setName('__reserved');

      const errors = validator.validate(root);

      expect(errors).toHaveLength(3);
    });
  });
});
