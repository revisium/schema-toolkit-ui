import { createValueModel } from '../../index';
import { resetNodeIdCounter } from '../../internal';
import { FormulaCollector } from '../../formula';
import type { SchemaDefinition } from '../../core';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('FormulaCollector', () => {
  it('collects formula fields from simple tree', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        price: { type: 'number', default: 0 },
        quantity: { type: 'number', default: 0 },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * quantity' },
        },
      },
    };

    const tree = createValueModel(schema, {
      price: 100,
      quantity: 5,
      total: 0,
    });
    const collector = new FormulaCollector();
    const formulas = collector.collect(tree.root);

    expect(formulas.length).toBe(1);
    expect(formulas[0]?.node.name).toBe('total');
    expect(formulas[0]?.expression).toBe('price * quantity');
  });

  it('collects formulas from nested structure', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        item: {
          type: 'object',
          properties: {
            price: { type: 'number', default: 0 },
            tax: {
              type: 'number',
              default: 0,
              readOnly: true,
              'x-formula': { version: 1, expression: 'price * 0.1' },
            },
          },
        },
        grandTotal: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'item.price + item.tax' },
        },
      },
    };

    const tree = createValueModel(schema, {
      item: { price: 100, tax: 0 },
      grandTotal: 0,
    });
    const collector = new FormulaCollector();
    const formulas = collector.collect(tree.root);

    expect(formulas.length).toBe(2);
    const names = formulas.map((f) => f.node.name);
    expect(names).toContain('tax');
    expect(names).toContain('grandTotal');
  });

  it('collects formulas from array items', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              price: { type: 'number', default: 0 },
              quantity: { type: 'number', default: 0 },
              total: {
                type: 'number',
                default: 0,
                readOnly: true,
                'x-formula': { version: 1, expression: 'price * quantity' },
              },
            },
          },
        },
      },
    };

    const tree = createValueModel(schema, {
      items: [
        { price: 100, quantity: 2, total: 0 },
        { price: 50, quantity: 3, total: 0 },
      ],
    });
    const collector = new FormulaCollector();
    const formulas = collector.collect(tree.root);

    expect(formulas.length).toBe(2);
    expect(formulas.every((f) => f.node.name === 'total')).toBe(true);
    expect(formulas.every((f) => f.arrayLevels.length > 0)).toBe(true);
  });

  it('extracts dependencies from expression', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        a: { type: 'number', default: 0 },
        b: { type: 'number', default: 0 },
        c: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'a + b' },
        },
      },
    };

    const tree = createValueModel(schema, { a: 1, b: 2, c: 0 });
    const collector = new FormulaCollector();
    const formulas = collector.collect(tree.root);

    const field = formulas.find((f) => f.node.name === 'c');
    const depNames = field?.dependencyNodes.map((n) => n.name);
    expect(depNames).toContain('a');
    expect(depNames).toContain('b');
  });
});
