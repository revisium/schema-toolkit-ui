import { evaluateWithContext } from '@revisium/formula';
import { createValueModel } from '../../index';
import { FormulaEngine } from '../../formula';
import { resetNodeIdCounter } from '../../node';
import type { SchemaDefinition } from '../../core';

const createTree = (schema: SchemaDefinition, value: unknown) =>
  createValueModel(schema, value, { formulaEngine: false });

beforeEach(() => {
  resetNodeIdCounter();
});

describe('FormulaEngine - array of primitives', () => {
  const schema: SchemaDefinition = {
    type: 'object',
    properties: {
      values: {
        type: 'array',
        items: { type: 'number', default: 0 },
        default: [],
      },
      total: {
        type: 'number',
        default: 0,
        readOnly: true,
        'x-formula': { version: 1, expression: 'sum(values)' },
      },
      count: {
        type: 'number',
        default: 0,
        readOnly: true,
        'x-formula': { version: 1, expression: 'count(values)' },
      },
    },
  };

  it('recalculates sum when array item value changes', () => {
    const tree = createTree(schema, {
      values: [10, 20, 30],
      total: 0,
      count: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(60);

    // Change first item value
    tree.setValue('values[0]', 100);
    expect(tree.getValue('total')).toBe(150); // 100 + 20 + 30

    // Change last item value
    tree.setValue('values[2]', 50);
    expect(tree.getValue('total')).toBe(170); // 100 + 20 + 50

    engine.dispose();
  });

  it('recalculates when array item is added', () => {
    const tree = createTree(schema, {
      values: [10, 20],
      total: 0,
      count: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(30);
    expect(tree.getValue('count')).toBe(2);

    // Add item
    const valuesArray = tree.get('values');
    if (valuesArray?.isArray()) {
      valuesArray.pushValue(30);
    }

    expect(tree.getValue('total')).toBe(60);
    expect(tree.getValue('count')).toBe(3);

    engine.dispose();
  });

  it('recalculates when array item is removed', () => {
    const tree = createTree(schema, {
      values: [10, 20, 30],
      total: 0,
      count: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(60);
    expect(tree.getValue('count')).toBe(3);

    // Remove middle item
    const valuesArray = tree.get('values');
    if (valuesArray?.isArray()) {
      valuesArray.removeAt(1);
    }

    expect(tree.getValue('total')).toBe(40); // 10 + 30
    expect(tree.getValue('count')).toBe(2);

    engine.dispose();
  });

  it('recalculates when array item is inserted', () => {
    const tree = createTree(schema, {
      values: [10, 30],
      total: 0,
      count: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(40);

    // Insert in middle
    const valuesArray = tree.get('values');
    if (valuesArray?.isArray()) {
      valuesArray.insertValueAt(1, 20);
    }

    expect(tree.getValue('total')).toBe(60);
    expect(tree.getValue('count')).toBe(3);

    // Now change the inserted value
    tree.setValue('values[1]', 100);
    expect(tree.getValue('total')).toBe(140); // 10 + 100 + 30

    engine.dispose();
  });
});

describe('FormulaEngine', () => {
  it('evaluates formulas on initialization', () => {
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

    const tree = createTree(schema, {
      price: 100,
      quantity: 5,
      total: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(500);

    engine.dispose();
  });

  it('evaluates chain of dependent formulas', () => {
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

    const tree = createTree(schema, {
      price: 100,
      subtotal: 0,
      total: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('subtotal')).toBe(200);
    expect(tree.getValue('total')).toBe(210);

    engine.dispose();
  });

  it('recalculates when dependency changes', () => {
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

    const tree = createTree(schema, {
      price: 100,
      quantity: 5,
      total: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(500);

    tree.setValue('price', 200);

    expect(tree.getValue('total')).toBe(1000);

    engine.dispose();
  });

  it('recalculates cascade when root dependency changes', () => {
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

    const tree = createTree(schema, {
      price: 100,
      subtotal: 0,
      total: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('subtotal')).toBe(200);
    expect(tree.getValue('total')).toBe(210);

    tree.setValue('price', 50);

    expect(tree.getValue('subtotal')).toBe(100);
    expect(tree.getValue('total')).toBe(110);

    engine.dispose();
  });

  it('evaluates formulas in array items', () => {
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

    const tree = createTree(schema, {
      items: [
        { price: 100, quantity: 2, total: 0 },
        { price: 50, quantity: 3, total: 0 },
      ],
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('items[0].total')).toBe(200);
    expect(tree.getValue('items[1].total')).toBe(150);

    engine.dispose();
  });

  it('sets warning for NaN result', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        a: { type: 'number', default: 0 },
        b: { type: 'number', default: 0 },
        result: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'a / b' },
        },
      },
    };

    const tree = createTree(schema, { a: 0, b: 0, result: 0 });
    const engine = new FormulaEngine(tree);

    const resultNode = tree.get('result');
    expect(resultNode?.isPrimitive() && resultNode.formulaWarning?.type).toBe(
      'nan',
    );

    engine.dispose();
  });

  it('sets warning for Infinity result', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        a: { type: 'number', default: 0 },
        b: { type: 'number', default: 0 },
        result: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'a / b' },
        },
      },
    };

    const tree = createTree(schema, { a: 1, b: 0, result: 0 });
    const engine = new FormulaEngine(tree);

    const resultNode = tree.get('result');
    expect(resultNode?.isPrimitive() && resultNode.formulaWarning?.type).toBe(
      'infinity',
    );

    engine.dispose();
  });

  it('clears warning when result becomes valid', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        a: { type: 'number', default: 0 },
        b: { type: 'number', default: 0 },
        result: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'a / b' },
        },
      },
    };

    const tree = createTree(schema, { a: 0, b: 0, result: 0 });
    const engine = new FormulaEngine(tree);

    const resultNode = tree.get('result');
    expect(
      resultNode?.isPrimitive() && resultNode.formulaWarning,
    ).not.toBeNull();

    tree.setValue('a', 10);
    tree.setValue('b', 2);

    expect(resultNode?.isPrimitive() && resultNode.formulaWarning).toBeNull();
    expect(tree.getValue('result')).toBe(5);

    engine.dispose();
  });

  it('disposes reactions properly', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        price: { type: 'number', default: 0 },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * 2' },
        },
      },
    };

    const tree = createTree(schema, { price: 100, total: 0 });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(200);

    engine.dispose();

    // After dispose, changes should not trigger recalculation
    tree.setValue('price', 50);
    expect(tree.getValue('total')).toBe(200); // Still old value
  });
});

describe('FormulaEngine - reactive updates', () => {
  it('recalculates single formula when its dependency changes', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        price: { type: 'number', default: 0 },
        doubled: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * 2' },
        },
      },
    };

    const tree = createTree(schema, { price: 10, doubled: 0 });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('doubled')).toBe(20);

    tree.setValue('price', 25);
    expect(tree.getValue('doubled')).toBe(50);

    tree.setValue('price', 0);
    expect(tree.getValue('doubled')).toBe(0);

    engine.dispose();
  });

  it('recalculates multiple formulas depending on same value', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        value: { type: 'number', default: 0 },
        doubled: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'value * 2' },
        },
        tripled: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'value * 3' },
        },
        squared: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'value * value' },
        },
      },
    };

    const tree = createTree(schema, {
      value: 5,
      doubled: 0,
      tripled: 0,
      squared: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('doubled')).toBe(10);
    expect(tree.getValue('tripled')).toBe(15);
    expect(tree.getValue('squared')).toBe(25);

    tree.setValue('value', 4);

    expect(tree.getValue('doubled')).toBe(8);
    expect(tree.getValue('tripled')).toBe(12);
    expect(tree.getValue('squared')).toBe(16);

    engine.dispose();
  });

  it('recalculates chain A -> B -> C', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        a: { type: 'number', default: 0 },
        b: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'a + 1' },
        },
        c: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'b + 1' },
        },
      },
    };

    const tree = createTree(schema, { a: 1, b: 0, c: 0 });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('a')).toBe(1);
    expect(tree.getValue('b')).toBe(2);
    expect(tree.getValue('c')).toBe(3);

    tree.setValue('a', 10);

    expect(tree.getValue('b')).toBe(11);
    expect(tree.getValue('c')).toBe(12);

    engine.dispose();
  });

  it('recalculates long chain A -> B -> C -> D -> E', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        a: { type: 'number', default: 0 },
        b: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'a * 2' },
        },
        c: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'b + 1' },
        },
        d: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'c * 2' },
        },
        e: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'd + 100' },
        },
      },
    };

    const tree = createTree(schema, { a: 1, b: 0, c: 0, d: 0, e: 0 });
    const engine = new FormulaEngine(tree);

    // a=1, b=2, c=3, d=6, e=106
    expect(tree.getValue('e')).toBe(106);

    tree.setValue('a', 5);
    // a=5, b=10, c=11, d=22, e=122
    expect(tree.getValue('b')).toBe(10);
    expect(tree.getValue('c')).toBe(11);
    expect(tree.getValue('d')).toBe(22);
    expect(tree.getValue('e')).toBe(122);

    engine.dispose();
  });

  it('handles formula with multiple dependencies', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        x: { type: 'number', default: 0 },
        y: { type: 'number', default: 0 },
        z: { type: 'number', default: 0 },
        sum: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'x + y + z' },
        },
      },
    };

    const tree = createTree(schema, { x: 1, y: 2, z: 3, sum: 0 });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('sum')).toBe(6);

    tree.setValue('x', 10);
    expect(tree.getValue('sum')).toBe(15);

    tree.setValue('y', 20);
    expect(tree.getValue('sum')).toBe(33);

    tree.setValue('z', 30);
    expect(tree.getValue('sum')).toBe(60);

    engine.dispose();
  });
});

describe('FormulaEngine - nested objects', () => {
  it('recalculates when nested dependency changes', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        item: {
          type: 'object',
          properties: {
            price: { type: 'number', default: 0 },
            quantity: { type: 'number', default: 0 },
          },
        },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'item.price * item.quantity' },
        },
      },
    };

    const tree = createTree(schema, {
      item: { price: 100, quantity: 5 },
      total: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(500);

    tree.setValue('item.price', 200);
    expect(tree.getValue('total')).toBe(1000);

    tree.setValue('item.quantity', 3);
    expect(tree.getValue('total')).toBe(600);

    engine.dispose();
  });

  it('handles formula inside nested object', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        order: {
          type: 'object',
          properties: {
            price: { type: 'number', default: 0 },
            quantity: { type: 'number', default: 0 },
            subtotal: {
              type: 'number',
              default: 0,
              readOnly: true,
              'x-formula': { version: 1, expression: 'price * quantity' },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      order: { price: 50, quantity: 4, subtotal: 0 },
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('order.subtotal')).toBe(200);

    tree.setValue('order.price', 75);
    expect(tree.getValue('order.subtotal')).toBe(300);

    engine.dispose();
  });
});

describe('FormulaEngine - arrays', () => {
  it('recalculates array item formula when item value changes', () => {
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

    const tree = createTree(schema, {
      items: [
        { price: 100, quantity: 2, total: 0 },
        { price: 50, quantity: 3, total: 0 },
      ],
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('items[0].total')).toBe(200);
    expect(tree.getValue('items[1].total')).toBe(150);

    tree.setValue('items[0].price', 150);
    expect(tree.getValue('items[0].total')).toBe(300);
    expect(tree.getValue('items[1].total')).toBe(150); // unchanged

    tree.setValue('items[1].quantity', 10);
    expect(tree.getValue('items[0].total')).toBe(300); // unchanged
    expect(tree.getValue('items[1].total')).toBe(500);

    engine.dispose();
  });

  it('recalculates all items in array', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'number', default: 0 },
              doubled: {
                type: 'number',
                default: 0,
                readOnly: true,
                'x-formula': { version: 1, expression: 'value * 2' },
              },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      items: [
        { value: 1, doubled: 0 },
        { value: 2, doubled: 0 },
        { value: 3, doubled: 0 },
      ],
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('items[0].doubled')).toBe(2);
    expect(tree.getValue('items[1].doubled')).toBe(4);
    expect(tree.getValue('items[2].doubled')).toBe(6);

    tree.setValue('items[0].value', 10);
    expect(tree.getValue('items[0].doubled')).toBe(20);

    tree.setValue('items[2].value', 100);
    expect(tree.getValue('items[2].doubled')).toBe(200);

    engine.dispose();
  });

  it('handles nested arrays', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        matrix: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                x: { type: 'number', default: 0 },
                y: { type: 'number', default: 0 },
                sum: {
                  type: 'number',
                  default: 0,
                  readOnly: true,
                  'x-formula': { version: 1, expression: 'x + y' },
                },
              },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      matrix: [
        [
          { x: 1, y: 2, sum: 0 },
          { x: 3, y: 4, sum: 0 },
        ],
        [{ x: 5, y: 6, sum: 0 }],
      ],
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('matrix[0][0].sum')).toBe(3);
    expect(tree.getValue('matrix[0][1].sum')).toBe(7);
    expect(tree.getValue('matrix[1][0].sum')).toBe(11);

    tree.setValue('matrix[0][0].x', 10);
    expect(tree.getValue('matrix[0][0].sum')).toBe(12);

    engine.dispose();
  });
});

describe('FormulaEngine - string formulas', () => {
  it('evaluates string concatenation', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        firstName: { type: 'string', default: '' },
        lastName: { type: 'string', default: '' },
        fullName: {
          type: 'string',
          default: '',
          readOnly: true,
          'x-formula': { version: 1, expression: 'firstName + " " + lastName' },
        },
      },
    };

    const tree = createTree(schema, {
      firstName: 'John',
      lastName: 'Doe',
      fullName: '',
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('fullName')).toBe('John Doe');

    tree.setValue('firstName', 'Jane');
    expect(tree.getValue('fullName')).toBe('Jane Doe');

    engine.dispose();
  });
});

describe('FormulaEngine - array structure changes', () => {
  it('reinitializes formulas when array item is added', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              price: { type: 'number', default: 0 },
              doubled: {
                type: 'number',
                default: 0,
                readOnly: true,
                'x-formula': { version: 1, expression: 'price * 2' },
              },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      items: [{ price: 100, doubled: 0 }],
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('items[0].doubled')).toBe(200);

    // Add new item
    const items = tree.get('items');
    if (items?.isArray()) {
      items.pushValue({ price: 50, doubled: 0 });
    }

    // New item formula should be evaluated
    expect(tree.getValue('items[1].doubled')).toBe(100);

    // Existing item should still work
    tree.setValue('items[0].price', 150);
    expect(tree.getValue('items[0].doubled')).toBe(300);

    engine.dispose();
  });

  it('reinitializes formulas when array item is inserted in middle', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'number', default: 0 },
              computed: {
                type: 'number',
                default: 0,
                readOnly: true,
                'x-formula': { version: 1, expression: 'value + 10' },
              },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      items: [
        { value: 1, computed: 0 },
        { value: 3, computed: 0 },
      ],
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('items[0].computed')).toBe(11);
    expect(tree.getValue('items[1].computed')).toBe(13);

    // Insert in middle
    const items = tree.get('items');
    if (items?.isArray()) {
      items.insertValueAt(1, { value: 2, computed: 0 });
    }

    // All formulas should be correctly evaluated
    expect(tree.getValue('items[0].computed')).toBe(11);
    expect(tree.getValue('items[1].computed')).toBe(12); // newly inserted
    expect(tree.getValue('items[2].computed')).toBe(13);

    // Reactive updates should still work
    tree.setValue('items[1].value', 20);
    expect(tree.getValue('items[1].computed')).toBe(30);

    engine.dispose();
  });

  it('reinitializes formulas when array item is removed', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              price: { type: 'number', default: 0 },
              doubled: {
                type: 'number',
                default: 0,
                readOnly: true,
                'x-formula': { version: 1, expression: 'price * 2' },
              },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      items: [
        { price: 10, doubled: 0 },
        { price: 20, doubled: 0 },
        { price: 30, doubled: 0 },
      ],
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('items[0].doubled')).toBe(20);
    expect(tree.getValue('items[1].doubled')).toBe(40);
    expect(tree.getValue('items[2].doubled')).toBe(60);

    // Remove middle item
    const items = tree.get('items');
    if (items?.isArray()) {
      items.removeAt(1);
    }

    // Remaining formulas should work
    expect(tree.getValue('items[0].doubled')).toBe(20);
    expect(tree.getValue('items[1].doubled')).toBe(60); // was [2], now [1]

    // Reactive updates should still work
    tree.setValue('items[0].price', 100);
    expect(tree.getValue('items[0].doubled')).toBe(200);

    engine.dispose();
  });
});

describe('FormulaEngine - array formulas with absolute paths', () => {
  it('formula can reference root level field', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        taxRate: { type: 'number', default: 0 },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              price: { type: 'number', default: 0 },
              priceWithTax: {
                type: 'number',
                default: 0,
                readOnly: true,
                'x-formula': {
                  version: 1,
                  expression: 'price * (1 + /taxRate)',
                },
              },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      taxRate: 0.1,
      items: [
        { price: 100, priceWithTax: 0 },
        { price: 200, priceWithTax: 0 },
      ],
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('items[0].priceWithTax')).toBeCloseTo(110);
    expect(tree.getValue('items[1].priceWithTax')).toBeCloseTo(220);

    // Change root field - all formulas recalculate
    tree.setValue('taxRate', 0.2);

    expect(tree.getValue('items[0].priceWithTax')).toBeCloseTo(120);
    expect(tree.getValue('items[1].priceWithTax')).toBeCloseTo(240);

    engine.dispose();
  });

  it('formula can reference parent field with relative path', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        discount: { type: 'number', default: 0 },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              price: { type: 'number', default: 0 },
              discountedPrice: {
                type: 'number',
                default: 0,
                readOnly: true,
                'x-formula': {
                  version: 1,
                  expression: 'price * (1 - ../discount)',
                },
              },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      discount: 0.2,
      items: [{ price: 100, discountedPrice: 0 }],
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('items[0].discountedPrice')).toBe(80);

    tree.setValue('discount', 0.5);

    expect(tree.getValue('items[0].discountedPrice')).toBe(50);

    engine.dispose();
  });

  it('handles formula referencing other array items by absolute index', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'number', default: 0 },
            },
          },
        },
        sumFirstTwo: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': {
            version: 1,
            expression: 'items[0].value + items[1].value',
          },
        },
      },
    };

    const tree = createTree(schema, {
      items: [{ value: 10 }, { value: 20 }, { value: 30 }],
      sumFirstTwo: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('sumFirstTwo')).toBe(30);

    tree.setValue('items[0].value', 100);
    expect(tree.getValue('sumFirstTwo')).toBe(120);

    tree.setValue('items[1].value', 200);
    expect(tree.getValue('sumFirstTwo')).toBe(300);

    engine.dispose();
  });
});

describe('evaluateWithContext (formula library)', () => {
  it('evaluates simple arithmetic', () => {
    const result = evaluateWithContext('price * quantity', {
      rootData: { price: 100, quantity: 5 },
    });
    expect(result).toBe(500);
  });

  it('evaluates with nested data access', () => {
    const result = evaluateWithContext('item.price * item.quantity', {
      rootData: { item: { price: 50, quantity: 3 } },
    });
    expect(result).toBe(150);
  });

  it('evaluates with itemData context', () => {
    const result = evaluateWithContext('price * quantity', {
      rootData: { items: [{ price: 10, quantity: 2 }] },
      itemData: { price: 10, quantity: 2 },
    });
    expect(result).toBe(20);
  });

  it('returns NaN for 0/0', () => {
    const result = evaluateWithContext('a / b', {
      rootData: { a: 0, b: 0 },
    });
    expect(Number.isNaN(result)).toBe(true);
  });

  it('returns Infinity for n/0', () => {
    const result = evaluateWithContext('a / b', {
      rootData: { a: 1, b: 0 },
    });
    expect(result).toBe(Infinity);
  });
});

describe('FormulaEngine - prev/next context', () => {
  it('formula can reference prev item in array using @prev', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'number', default: 0 },
              runningTotal: {
                type: 'number',
                default: 0,
                readOnly: true,
                'x-formula': {
                  version: 1,
                  expression:
                    '#index == 0 ? value : @prev.runningTotal + value',
                },
              },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      items: [
        { value: 10, runningTotal: 0 },
        { value: 20, runningTotal: 0 },
        { value: 15, runningTotal: 0 },
        { value: 5, runningTotal: 0 },
      ],
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('items[0].runningTotal')).toBe(10);
    expect(tree.getValue('items[1].runningTotal')).toBe(30);
    expect(tree.getValue('items[2].runningTotal')).toBe(45);
    expect(tree.getValue('items[3].runningTotal')).toBe(50);

    engine.dispose();
  });
});

describe('FormulaEngine - #parent context', () => {
  it('formula can reference grandparent array index using #parent.parent.index', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        level1: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              level2: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    level3: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          value: { type: 'string', default: '' },
                          currentIndex: {
                            type: 'number',
                            default: 0,
                            readOnly: true,
                            'x-formula': { version: 1, expression: '#index' },
                          },
                          parentIndex: {
                            type: 'number',
                            default: 0,
                            readOnly: true,
                            'x-formula': {
                              version: 1,
                              expression: '#parent.index',
                            },
                          },
                          grandparentIndex: {
                            type: 'number',
                            default: 0,
                            readOnly: true,
                            'x-formula': {
                              version: 1,
                              expression: '#parent.parent.index',
                            },
                          },
                          rootIndex: {
                            type: 'number',
                            default: 0,
                            readOnly: true,
                            'x-formula': {
                              version: 1,
                              expression: '#root.index',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      level1: [
        {
          level2: [
            {
              level3: [{ value: 'A' }, { value: 'B' }],
            },
            {
              level3: [{ value: 'C' }],
            },
          ],
        },
        {
          level2: [
            {
              level3: [{ value: 'D' }],
            },
          ],
        },
      ],
    });
    const engine = new FormulaEngine(tree);

    // level1[0].level2[0].level3[0]: root=0, grandparent=0, parent=0, current=0
    expect(tree.getValue('level1[0].level2[0].level3[0].rootIndex')).toBe(0);
    expect(
      tree.getValue('level1[0].level2[0].level3[0].grandparentIndex'),
    ).toBe(0);
    expect(tree.getValue('level1[0].level2[0].level3[0].parentIndex')).toBe(0);
    expect(tree.getValue('level1[0].level2[0].level3[0].currentIndex')).toBe(0);

    // level1[0].level2[0].level3[1]: root=0, grandparent=0, parent=0, current=1
    expect(tree.getValue('level1[0].level2[0].level3[1].currentIndex')).toBe(1);

    // level1[0].level2[1].level3[0]: root=0, grandparent=0, parent=1, current=0
    expect(tree.getValue('level1[0].level2[1].level3[0].parentIndex')).toBe(1);
    expect(
      tree.getValue('level1[0].level2[1].level3[0].grandparentIndex'),
    ).toBe(0);

    // level1[1].level2[0].level3[0]: root=1, grandparent=1, parent=0, current=0
    expect(tree.getValue('level1[1].level2[0].level3[0].rootIndex')).toBe(1);
    expect(
      tree.getValue('level1[1].level2[0].level3[0].grandparentIndex'),
    ).toBe(1);
    expect(tree.getValue('level1[1].level2[0].level3[0].parentIndex')).toBe(0);

    engine.dispose();
  });

  it('formula can reference parent array index using #parent.index', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        orders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', default: '' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    product: { type: 'string', default: '' },
                    orderIndex: {
                      type: 'number',
                      default: 0,
                      readOnly: true,
                      'x-formula': { version: 1, expression: '#parent.index' },
                    },
                    itemIndex: {
                      type: 'number',
                      default: 0,
                      readOnly: true,
                      'x-formula': { version: 1, expression: '#index' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    };

    const tree = createTree(schema, {
      orders: [
        {
          name: 'Order A',
          items: [{ product: 'Widget' }, { product: 'Gadget' }],
        },
        {
          name: 'Order B',
          items: [{ product: 'Gizmo' }],
        },
      ],
    });
    const engine = new FormulaEngine(tree);

    // Order A items
    expect(tree.getValue('orders[0].items[0].orderIndex')).toBe(0);
    expect(tree.getValue('orders[0].items[0].itemIndex')).toBe(0);
    expect(tree.getValue('orders[0].items[1].orderIndex')).toBe(0);
    expect(tree.getValue('orders[0].items[1].itemIndex')).toBe(1);

    // Order B items
    expect(tree.getValue('orders[1].items[0].orderIndex')).toBe(1);
    expect(tree.getValue('orders[1].items[0].itemIndex')).toBe(0);

    engine.dispose();
  });
});

describe('FormulaEngine - negative array index', () => {
  it('formula with negative index reacts to value changes', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'number', default: 0 },
            },
          },
        },
        lastItem: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': {
            version: 1,
            expression: 'count(items) > 0 ? items[-1].value : 0',
          },
        },
      },
    };

    const tree = createTree(schema, {
      items: [{ value: 10 }, { value: 20 }, { value: 30 }],
      lastItem: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('lastItem')).toBe(30);

    // Change the last item's value
    tree.setValue('items[2].value', 100);
    expect(tree.getValue('lastItem')).toBe(100);

    engine.dispose();
  });
});

describe('FormulaEngine - wildcard property access', () => {
  it('evaluates sum with wildcard property access items[*].price', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', default: '' },
              price: { type: 'number', default: 0 },
            },
          },
          default: [],
        },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'sum(items[*].price)' },
        },
      },
    };

    const tree = createTree(schema, {
      items: [
        { name: 'A', price: 10 },
        { name: 'B', price: 20 },
        { name: 'C', price: 30 },
      ],
      total: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(60);

    tree.setValue('items[0].price', 100);
    expect(tree.getValue('total')).toBe(150);

    engine.dispose();
  });

  it('evaluates avg with wildcard property access', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              rating: { type: 'number', default: 0 },
            },
          },
          default: [],
        },
        averageRating: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': {
            version: 1,
            expression: 'count(items) > 0 ? avg(items[*].rating) : 0',
          },
        },
      },
    };

    const tree = createTree(schema, {
      items: [{ rating: 10 }, { rating: 20 }, { rating: 30 }],
      averageRating: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('averageRating')).toBe(20);

    engine.dispose();
  });

  it('evaluates deeply nested wildcard property access', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        values: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nested: {
                type: 'object',
                properties: {
                  value: { type: 'number', default: 0 },
                },
              },
            },
          },
          default: [],
        },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': {
            version: 1,
            expression: 'sum(values[*].nested.value)',
          },
        },
      },
    };

    const tree = createTree(schema, {
      values: [
        { nested: { value: 1 } },
        { nested: { value: 2 } },
        { nested: { value: 3 } },
      ],
      total: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(6);

    tree.setValue('values[1].nested.value', 10);
    expect(tree.getValue('total')).toBe(14);

    engine.dispose();
  });

  it('evaluates nested arrays with multiple wildcards', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        orders: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', default: 0 },
                  },
                },
                default: [],
              },
            },
          },
          default: [],
        },
        grandTotal: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': {
            version: 1,
            expression: 'sum(orders[*].items[*].amount)',
          },
        },
      },
    };

    const tree = createTree(schema, {
      orders: [
        { items: [{ amount: 10 }, { amount: 20 }] },
        { items: [{ amount: 30 }] },
      ],
      grandTotal: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('grandTotal')).toBe(60);

    tree.setValue('orders[0].items[0].amount', 100);
    expect(tree.getValue('grandTotal')).toBe(150);

    engine.dispose();
  });

  it('recalculates when array item is added with wildcard formula', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              price: { type: 'number', default: 0 },
            },
          },
          default: [],
        },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'sum(items[*].price)' },
        },
      },
    };

    const tree = createTree(schema, {
      items: [{ price: 10 }, { price: 20 }],
      total: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(30);

    const itemsArray = tree.get('items');
    if (itemsArray?.isArray()) {
      itemsArray.pushValue({ price: 30 });
    }

    expect(tree.getValue('total')).toBe(60);

    engine.dispose();
  });

  it('recalculates when array item is removed with wildcard formula', () => {
    const schema: SchemaDefinition = {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              price: { type: 'number', default: 0 },
            },
          },
          default: [],
        },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'sum(items[*].price)' },
        },
      },
    };

    const tree = createTree(schema, {
      items: [{ price: 10 }, { price: 20 }, { price: 30 }],
      total: 0,
    });
    const engine = new FormulaEngine(tree);

    expect(tree.getValue('total')).toBe(60);

    const itemsArray = tree.get('items');
    if (itemsArray?.isArray()) {
      itemsArray.removeAt(1);
    }

    expect(tree.getValue('total')).toBe(40);

    engine.dispose();
  });
});
