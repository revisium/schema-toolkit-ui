import { createValueModel, StringValueNode } from '../../index';
import { resetNodeIdCounter } from '../../internal';
import type { SchemaDefinition } from '../../core';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('TreeIndex - path cache invalidation', () => {
  const schema: SchemaDefinition = {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', default: '' },
          },
        },
      },
    },
  };

  it('returns correct path after array insert at beginning', () => {
    const tree = createValueModel(schema, {
      items: [{ name: 'first' }, { name: 'second' }],
    });

    const originalSecond = tree.get('items[1]');
    expect(originalSecond?.getPlainValue()).toEqual({ name: 'second' });

    const items = tree.get('items');
    if (items?.isArray()) {
      items.insertValueAt(0, { name: 'new' });
    }

    expect(tree.pathOf(originalSecond!).asSimple()).toBe('items[2]');
    expect(tree.get('items[0]')?.getPlainValue()).toEqual({ name: 'new' });
    expect(tree.get('items[1]')?.getPlainValue()).toEqual({ name: 'first' });
    expect(tree.get('items[2]')?.getPlainValue()).toEqual({ name: 'second' });
  });

  it('returns correct path after array remove', () => {
    const tree = createValueModel(schema, {
      items: [{ name: 'first' }, { name: 'second' }, { name: 'third' }],
    });

    const originalThird = tree.get('items[2]');
    expect(originalThird?.getPlainValue()).toEqual({ name: 'third' });

    const items = tree.get('items');
    if (items?.isArray()) {
      items.removeAt(0);
    }

    expect(tree.pathOf(originalThird!).asSimple()).toBe('items[1]');
    expect(tree.get('items[0]')?.getPlainValue()).toEqual({ name: 'second' });
    expect(tree.get('items[1]')?.getPlainValue()).toEqual({ name: 'third' });
  });

  it('returns correct path after array move', () => {
    const tree = createValueModel(schema, {
      items: [{ name: 'first' }, { name: 'second' }, { name: 'third' }],
    });

    const originalFirst = tree.get('items[0]');
    const originalThird = tree.get('items[2]');

    const items = tree.get('items');
    if (items?.isArray()) {
      items.move(0, 2);
    }

    expect(tree.pathOf(originalFirst!).asSimple()).toBe('items[2]');
    expect(tree.pathOf(originalThird!).asSimple()).toBe('items[1]');
  });

  it('returns correct path after pushValue', () => {
    const tree = createValueModel(schema, {
      items: [{ name: 'first' }],
    });

    const items = tree.get('items');
    if (items?.isArray()) {
      items.pushValue({ name: 'second' });
    }

    const newItem = tree.get('items[1]');
    expect(newItem).toBeDefined();
    expect(tree.pathOf(newItem!).asSimple()).toBe('items[1]');
  });

  it('nested node paths update after parent array mutation', () => {
    const tree = createValueModel(schema, {
      items: [{ name: 'first' }, { name: 'second' }],
    });

    const nestedName = tree.get('items[1].name');
    expect(nestedName?.getPlainValue()).toBe('second');
    expect(tree.pathOf(nestedName!).asSimple()).toBe('items[1].name');

    const items = tree.get('items');
    if (items?.isArray()) {
      items.insertValueAt(0, { name: 'new' });
    }

    expect(tree.pathOf(nestedName!).asSimple()).toBe('items[2].name');
  });
});

describe('TreeIndex - object mutations', () => {
  const schema: SchemaDefinition = {
    type: 'object',
    properties: {
      data: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
        },
      },
    },
  };

  it('nodeById still finds node after object child add', () => {
    const tree = createValueModel(schema, {
      data: { name: 'test' },
    });

    const data = tree.get('data');
    if (data?.isObject()) {
      const newChild = new StringValueNode(
        undefined,
        'newField',
        { type: 'string', default: '' },
        'value',
      );
      data.addChild(newChild);

      expect(tree.nodeById(newChild.id)).toBe(newChild);
    }
  });
});
