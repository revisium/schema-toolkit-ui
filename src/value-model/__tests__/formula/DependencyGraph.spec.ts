import { createValueModel } from '../../index';
import { FormulaCollector, DependencyGraph } from '../../formula';
import { resetNodeIdCounter } from '../../node';
import type { SchemaDefinition } from '../../core';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('DependencyGraph', () => {
  it('builds dependency map', () => {
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

    const graph = new DependencyGraph();
    const depMap = graph.buildDependencyMap(formulas);

    const priceNode = tree.get('price');
    const quantityNode = tree.get('quantity');
    const totalFormula = formulas.find((f) => f.node.name === 'total');

    expect(priceNode).toBeDefined();
    expect(quantityNode).toBeDefined();
    expect(totalFormula).toBeDefined();

    if (
      priceNode?.isPrimitive() &&
      quantityNode?.isPrimitive() &&
      totalFormula
    ) {
      expect(depMap.get(priceNode)?.has(totalFormula)).toBe(true);
      expect(depMap.get(quantityNode)?.has(totalFormula)).toBe(true);
    }
  });

  it('builds evaluation order with dependencies', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        price: { type: 'number', default: 0 },
        subtotal: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * 2' },
        },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'subtotal + 10' },
        },
      },
    };

    const tree = createValueModel(schema, {
      price: 100,
      subtotal: 0,
      total: 0,
    });
    const collector = new FormulaCollector();
    const formulas = collector.collect(tree.root);

    const graph = new DependencyGraph();
    const order = graph.buildEvaluationOrder(formulas);

    const subtotalIndex = order.findIndex((f) => f.node.name === 'subtotal');
    const totalIndex = order.findIndex((f) => f.node.name === 'total');

    expect(subtotalIndex).toBeLessThan(totalIndex);
  });

  it('gets affected formulas for changed node', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        price: { type: 'number', default: 0 },
        subtotal: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * 2' },
        },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'subtotal + 10' },
        },
      },
    };

    const tree = createValueModel(schema, {
      price: 100,
      subtotal: 0,
      total: 0,
    });
    const collector = new FormulaCollector();
    const formulas = collector.collect(tree.root);

    const graph = new DependencyGraph();
    const depMap = graph.buildDependencyMap(formulas);
    const order = graph.buildEvaluationOrder(formulas);

    const priceNode = tree.get('price');
    expect(priceNode?.isPrimitive()).toBe(true);

    if (!priceNode?.isPrimitive()) {
      throw new Error('Expected primitive node');
    }
    const affected = graph.getAffectedFormulas(priceNode, depMap, order);
    const affectedNames = affected.map((f) => f.node.name);

    expect(affectedNames).toContain('subtotal');
    expect(affectedNames).toContain('total');

    const subtotalIndex = affected.findIndex((f) => f.node.name === 'subtotal');
    const totalIndex = affected.findIndex((f) => f.node.name === 'total');
    expect(subtotalIndex).toBeLessThan(totalIndex);
  });
});
