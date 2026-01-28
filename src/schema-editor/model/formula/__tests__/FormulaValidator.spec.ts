import { SchemaTree } from '../../tree/SchemaTree';
import { SchemaParser } from '../../schema/SchemaParser';
import { ParsedFormula } from '..';
import { FormulaValidator } from '../../validation/FormulaValidator';
import { SimplePath } from '../../path/SimplePath';
import type { JsonObjectSchema } from '../../schema/JsonSchema';

describe('FormulaValidator', () => {
  describe('validate', () => {
    it('should return empty array when no formulas exist', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
        },
        additionalProperties: false,
        required: ['name'],
      };

      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const tree = new SchemaTree(root);
      const validator = new FormulaValidator(tree);

      const errors = validator.validate();

      expect(errors).toHaveLength(0);
    });

    it('should return empty array when formula dependencies are valid', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        properties: {
          price: { type: 'number', default: 0 },
          quantity: { type: 'number', default: 0 },
          total: { type: 'number', default: 0, readOnly: true },
        },
        additionalProperties: false,
        required: ['price', 'quantity', 'total'],
      };

      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const tree = new SchemaTree(root);

      const totalNode = root.property('total');
      const formula = new ParsedFormula(
        tree,
        totalNode.id(),
        'price * quantity',
      );
      totalNode.setFormula(formula);
      tree.registerFormula(totalNode.id(), formula);

      const validator = new FormulaValidator(tree);
      const errors = validator.validate();

      expect(errors).toHaveLength(0);
    });

    it('should return error when formula dependency becomes missing after field removal', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        properties: {
          price: { type: 'number', default: 0 },
          quantity: { type: 'number', default: 0 },
          total: { type: 'number', default: 0, readOnly: true },
        },
        additionalProperties: false,
        required: ['price', 'quantity', 'total'],
      };

      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const tree = new SchemaTree(root);

      const totalNode = root.property('total');
      const formula = new ParsedFormula(
        tree,
        totalNode.id(),
        'price * quantity',
      );
      totalNode.setFormula(formula);
      tree.registerFormula(totalNode.id(), formula);

      tree.removeNodeAt(new SimplePath('quantity'));

      const validator = new FormulaValidator(tree);
      const errors = validator.validate();

      expect(errors).toHaveLength(1);
      expect(errors[0].nodeId).toBe(totalNode.id());
      expect(errors[0].message).toContain('Cannot resolve formula dependency');
      expect(errors[0].fieldPath).toBe('total');
    });

    it('should validate formulas in nested objects', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        properties: {
          item: {
            type: 'object',
            properties: {
              price: { type: 'number', default: 0 },
              discount: { type: 'number', default: 0 },
              total: { type: 'number', default: 0, readOnly: true },
            },
            additionalProperties: false,
            required: ['price', 'discount', 'total'],
          },
        },
        additionalProperties: false,
        required: ['item'],
      };

      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const tree = new SchemaTree(root);

      const totalNode = root.property('item').property('total');
      const formula = new ParsedFormula(
        tree,
        totalNode.id(),
        'price - discount',
      );
      totalNode.setFormula(formula);
      tree.registerFormula(totalNode.id(), formula);

      tree.removeNodeAt(new SimplePath('item.discount'));

      const validator = new FormulaValidator(tree);
      const errors = validator.validate();

      expect(errors).toHaveLength(1);
      expect(errors[0].fieldPath).toBe('item.total');
    });

    it('should validate formulas in array items', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            default: [],
            items: {
              type: 'object',
              properties: {
                price: { type: 'number', default: 0 },
                tax: { type: 'number', default: 0 },
                computed: { type: 'number', default: 0, readOnly: true },
              },
              additionalProperties: false,
              required: ['price', 'tax', 'computed'],
            },
          },
        },
        additionalProperties: false,
        required: ['items'],
      };

      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const tree = new SchemaTree(root);

      const computedNode = root.property('items').items().property('computed');
      const formula = new ParsedFormula(tree, computedNode.id(), 'price + tax');
      computedNode.setFormula(formula);
      tree.registerFormula(computedNode.id(), formula);

      tree.removeNodeAt(new SimplePath('items[*].tax'));

      const validator = new FormulaValidator(tree);
      const errors = validator.validate();

      expect(errors).toHaveLength(1);
      expect(errors[0].fieldPath).toBe('items[*].computed');
    });
  });

  describe('validateNode', () => {
    it('should return null when node has no formula', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
        },
        additionalProperties: false,
        required: ['name'],
      };

      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const tree = new SchemaTree(root);
      const validator = new FormulaValidator(tree);

      const nameNode = root.property('name');
      const error = validator.validateNode(nameNode.id());

      expect(error).toBeNull();
    });

    it('should return null when formula dependencies are valid', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        properties: {
          a: { type: 'number', default: 0 },
          b: { type: 'number', default: 0 },
        },
        additionalProperties: false,
        required: ['a', 'b'],
      };

      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const tree = new SchemaTree(root);

      const bNode = root.property('b');
      const formula = new ParsedFormula(tree, bNode.id(), 'a + 1');
      bNode.setFormula(formula);
      tree.registerFormula(bNode.id(), formula);

      const validator = new FormulaValidator(tree);
      const error = validator.validateNode(bNode.id());

      expect(error).toBeNull();
    });

    it('should return error when formula dependency becomes missing', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        properties: {
          source: { type: 'number', default: 0 },
          result: { type: 'number', default: 0 },
        },
        additionalProperties: false,
        required: ['source', 'result'],
      };

      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const tree = new SchemaTree(root);

      const resultNode = root.property('result');
      const formula = new ParsedFormula(tree, resultNode.id(), 'source + 1');
      resultNode.setFormula(formula);
      tree.registerFormula(resultNode.id(), formula);

      tree.removeNodeAt(new SimplePath('source'));

      const validator = new FormulaValidator(tree);
      const error = validator.validateNode(resultNode.id(), 'result');

      expect(error).not.toBeNull();
      if (error) {
        expect(error.nodeId).toBe(resultNode.id());
        expect(error.message).toContain('Cannot resolve formula dependency');
        expect(error.fieldPath).toBe('result');
      }
    });

    it('should include fieldPath when provided', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        properties: {
          dep: { type: 'number', default: 0 },
          x: { type: 'number', default: 0 },
        },
        additionalProperties: false,
        required: ['dep', 'x'],
      };

      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const tree = new SchemaTree(root);

      const xNode = root.property('x');
      const formula = new ParsedFormula(tree, xNode.id(), 'dep * 2');
      xNode.setFormula(formula);
      tree.registerFormula(xNode.id(), formula);

      tree.removeNodeAt(new SimplePath('dep'));

      const validator = new FormulaValidator(tree);
      const error = validator.validateNode(xNode.id(), 'nested.path.x');

      expect(error!.fieldPath).toBe('nested.path.x');
    });

    it('should not include fieldPath when empty string', () => {
      const schema: JsonObjectSchema = {
        type: 'object',
        properties: {
          dep: { type: 'number', default: 0 },
          x: { type: 'number', default: 0 },
        },
        additionalProperties: false,
        required: ['dep', 'x'],
      };

      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const tree = new SchemaTree(root);

      const xNode = root.property('x');
      const formula = new ParsedFormula(tree, xNode.id(), 'dep * 2');
      xNode.setFormula(formula);
      tree.registerFormula(xNode.id(), formula);

      tree.removeNodeAt(new SimplePath('dep'));

      const validator = new FormulaValidator(tree);
      const error = validator.validateNode(xNode.id(), '');

      expect(error!.fieldPath).toBeUndefined();
    });
  });
});
