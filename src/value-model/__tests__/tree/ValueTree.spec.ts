import { ValueTree } from '../../tree';
import {
  ObjectValueNode,
  ArrayValueNode,
  StringValueNode,
  NumberValueNode,
  BooleanValueNode,
  resetNodeIdCounter,
} from '../../node';
import { Path } from '../../core';
import { createValueModel } from '../../factory';

beforeEach(() => {
  resetNodeIdCounter();
});

// Helper to create simple object tree
function createSimpleTree() {
  const name = new StringValueNode(
    'name-id',
    'name',
    { type: 'string' },
    'John',
  );
  const age = new NumberValueNode('age-id', 'age', { type: 'number' }, 25);
  const root = new ObjectValueNode('root-id', '', { type: 'object' }, [
    name,
    age,
  ]);
  return new ValueTree(root);
}

// Helper to create nested object tree
function createNestedTree() {
  const city = new StringValueNode(
    'city-id',
    'city',
    { type: 'string' },
    'NYC',
  );
  const address = new ObjectValueNode(
    'address-id',
    'address',
    { type: 'object' },
    [city],
  );
  const name = new StringValueNode(
    'name-id',
    'name',
    { type: 'string' },
    'John',
  );
  const root = new ObjectValueNode('root-id', '', { type: 'object' }, [
    name,
    address,
  ]);
  return new ValueTree(root);
}

// Helper to create array tree
function createArrayTree() {
  const items = [
    new ObjectValueNode('item-0', '0', { type: 'object' }, [
      new StringValueNode('item-0-name', 'name', { type: 'string' }, 'Item A'),
      new NumberValueNode('item-0-price', 'price', { type: 'number' }, 100),
    ]),
    new ObjectValueNode('item-1', '1', { type: 'object' }, [
      new StringValueNode('item-1-name', 'name', { type: 'string' }, 'Item B'),
      new NumberValueNode('item-1-price', 'price', { type: 'number' }, 200),
    ]),
  ];
  const array = new ArrayValueNode(
    'items-id',
    'items',
    { type: 'array' },
    items,
  );
  const root = new ObjectValueNode('root-id', '', { type: 'object' }, [array]);
  return new ValueTree(root);
}

describe('ValueTree', () => {
  describe('construction', () => {
    it('creates tree with root node', () => {
      const root = new ObjectValueNode(undefined, '', { type: 'object' });
      const tree = new ValueTree(root);

      expect(tree.root).toBe(root);
    });
  });

  describe('access by id', () => {
    it('nodeById returns root by id', () => {
      const tree = createSimpleTree();

      expect(tree.nodeById('root-id')).toBe(tree.root);
    });

    it('nodeById returns child by id', () => {
      const tree = createSimpleTree();

      const node = tree.nodeById('name-id');

      expect(node?.name).toBe('name');
      expect(node?.getPlainValue()).toBe('John');
    });

    it('nodeById returns nested node by id', () => {
      const tree = createNestedTree();

      const node = tree.nodeById('city-id');

      expect(node?.name).toBe('city');
      expect(node?.getPlainValue()).toBe('NYC');
    });

    it('nodeById returns undefined for unknown id', () => {
      const tree = createSimpleTree();

      expect(tree.nodeById('unknown')).toBeUndefined();
    });

    it('nodeById returns array item by id', () => {
      const tree = createArrayTree();

      const node = tree.nodeById('item-0-price');

      expect(node?.name).toBe('price');
      expect(node?.getPlainValue()).toBe(100);
    });
  });

  describe('access by path', () => {
    it('get returns root for empty path', () => {
      const tree = createSimpleTree();

      expect(tree.get('')).toBe(tree.root);
    });

    it('get returns child by simple path', () => {
      const tree = createSimpleTree();

      const node = tree.get('name');

      expect(node?.getPlainValue()).toBe('John');
    });

    it('get returns nested node', () => {
      const tree = createNestedTree();

      const node = tree.get('address.city');

      expect(node?.getPlainValue()).toBe('NYC');
    });

    it('get returns array item by index', () => {
      const tree = createArrayTree();

      const node = tree.get('items[0]');

      expect(node?.isObject()).toBe(true);
    });

    it('get returns array item property', () => {
      const tree = createArrayTree();

      const node = tree.get('items[0].price');

      expect(node?.getPlainValue()).toBe(100);
    });

    it('get returns undefined for non-existent path', () => {
      const tree = createSimpleTree();

      expect(tree.get('missing')).toBeUndefined();
      expect(tree.get('name.invalid')).toBeUndefined();
    });

    it('get returns undefined for out of bounds index', () => {
      const tree = createArrayTree();

      expect(tree.get('items[10]')).toBeUndefined();
    });
  });

  describe('pathOf', () => {
    it('returns empty path for root', () => {
      const tree = createSimpleTree();

      const path = tree.pathOf(tree.root);

      expect(path.isEmpty()).toBe(true);
    });

    it('returns path for child node', () => {
      const tree = createSimpleTree();
      const node = tree.nodeById('name-id')!;

      const path = tree.pathOf(node);

      expect(path.asSimple()).toBe('name');
    });

    it('returns path for nested node', () => {
      const tree = createNestedTree();
      const node = tree.nodeById('city-id')!;

      const path = tree.pathOf(node);

      expect(path.asSimple()).toBe('address.city');
    });

    it('returns path for array item', () => {
      const tree = createArrayTree();
      const node = tree.nodeById('item-0')!;

      const path = tree.pathOf(node);

      expect(path.asSimple()).toBe('items[0]');
    });

    it('returns path for nested array item property', () => {
      const tree = createArrayTree();
      const node = tree.nodeById('item-1-price')!;

      const path = tree.pathOf(node);

      expect(path.asSimple()).toBe('items[1].price');
    });

    it('accepts node id string', () => {
      const tree = createSimpleTree();

      const path = tree.pathOf('name-id');

      expect(path.asSimple()).toBe('name');
    });

    it('returns empty path for unknown id', () => {
      const tree = createSimpleTree();

      const path = tree.pathOf('unknown');

      expect(path.isEmpty()).toBe(true);
    });
  });

  describe('getValue / getPlainValue', () => {
    it('getValue returns value at path', () => {
      const tree = createSimpleTree();

      expect(tree.getValue('name')).toBe('John');
      expect(tree.getValue('age')).toBe(25);
    });

    it('getValue returns nested value', () => {
      const tree = createNestedTree();

      expect(tree.getValue('address.city')).toBe('NYC');
    });

    it('getValue returns array item', () => {
      const tree = createArrayTree();

      expect(tree.getValue('items[0].price')).toBe(100);
    });

    it('getPlainValue returns full tree as plain object', () => {
      const tree = createSimpleTree();

      expect(tree.getPlainValue()).toEqual({
        name: 'John',
        age: 25,
      });
    });

    it('getPlainValue returns nested structure', () => {
      const tree = createNestedTree();

      expect(tree.getPlainValue()).toEqual({
        name: 'John',
        address: {
          city: 'NYC',
        },
      });
    });

    it('getPlainValue returns array structure', () => {
      const tree = createArrayTree();

      expect(tree.getPlainValue()).toEqual({
        items: [
          { name: 'Item A', price: 100 },
          { name: 'Item B', price: 200 },
        ],
      });
    });
  });

  describe('setValue', () => {
    it('sets value at path', () => {
      const tree = createSimpleTree();

      tree.setValue('name', 'Jane');

      expect(tree.getValue('name')).toBe('Jane');
    });

    it('tracks change', () => {
      const tree = createSimpleTree();

      tree.setValue('name', 'Jane');

      expect(tree.hasChanges).toBe(true);
      expect(tree.changes).toHaveLength(1);
      expect(tree.changes[0]).toEqual({
        type: 'setValue',
        path: Path.fromString('name'),
        value: 'Jane',
        oldValue: 'John',
      });
    });

    it('throws for non-existent path', () => {
      const tree = createSimpleTree();

      expect(() => tree.setValue('missing', 'value')).toThrow(
        'Path not found: missing',
      );
    });

    it('throws for non-primitive node', () => {
      const tree = createNestedTree();

      expect(() => tree.setValue('address', {})).toThrow(
        'Cannot set value on non-primitive node: address',
      );
    });
  });

  describe('validation', () => {
    it('allErrors returns errors from all nodes', () => {
      const name = new StringValueNode(undefined, 'name', {
        type: 'string',
        required: true,
      });
      const age = new NumberValueNode(
        undefined,
        'age',
        {
          type: 'number',
          minimum: 18,
        },
        10,
      );
      const root = new ObjectValueNode(undefined, '', { type: 'object' }, [
        name,
        age,
      ]);
      const tree = new ValueTree(root);

      const errors = tree.allErrors;

      expect(errors).toHaveLength(2);
    });

    it('allWarnings returns warnings from all nodes', () => {
      const total = new NumberValueNode(undefined, 'total', { type: 'number' });
      total.setFormulaWarning({
        type: 'nan',
        message: 'NaN',
        expression: 'test',
        computedValue: NaN,
      });
      const root = new ObjectValueNode(undefined, '', { type: 'object' }, [
        total,
      ]);
      const tree = new ValueTree(root);

      expect(tree.allWarnings).toHaveLength(1);
    });

    it('isValid is true when no errors', () => {
      const tree = createSimpleTree();

      expect(tree.isValid).toBe(true);
    });

    it('isValid is false when has errors', () => {
      const name = new StringValueNode(undefined, 'name', {
        type: 'string',
        required: true,
      });
      const root = new ObjectValueNode(undefined, '', { type: 'object' }, [
        name,
      ]);
      const tree = new ValueTree(root);

      expect(tree.isValid).toBe(false);
    });

    it('isValid is true even with warnings', () => {
      const total = new NumberValueNode(
        undefined,
        'total',
        { type: 'number' },
        100,
      );
      total.setFormulaWarning({
        type: 'nan',
        message: 'test',
        expression: 'test',
        computedValue: NaN,
      });
      const root = new ObjectValueNode(undefined, '', { type: 'object' }, [
        total,
      ]);
      const tree = new ValueTree(root);

      expect(tree.isValid).toBe(true);
    });

    it('hasDiagnostics is true when has errors or warnings', () => {
      const total = new NumberValueNode(undefined, 'total', { type: 'number' });
      total.setFormulaWarning({
        type: 'nan',
        message: 'test',
        expression: 'test',
        computedValue: NaN,
      });
      const root = new ObjectValueNode(undefined, '', { type: 'object' }, [
        total,
      ]);
      const tree = new ValueTree(root);

      expect(tree.hasDiagnostics).toBe(true);
    });

    it('errorsByPath groups errors by path', () => {
      const name = new StringValueNode(undefined, 'name', {
        type: 'string',
        required: true,
      });
      const age = new NumberValueNode(
        undefined,
        'age',
        {
          type: 'number',
          minimum: 18,
        },
        10,
      );
      const root = new ObjectValueNode(undefined, '', { type: 'object' }, [
        name,
        age,
      ]);
      const tree = new ValueTree(root);

      const byPath = tree.errorsByPath;

      expect(byPath.get('name')).toHaveLength(1);
      expect(byPath.get('age')).toHaveLength(1);
    });
  });

  describe('change tracking', () => {
    it('starts with no changes', () => {
      const tree = createSimpleTree();

      expect(tree.hasChanges).toBe(false);
      expect(tree.changes).toHaveLength(0);
    });

    it('tracks setValue changes', () => {
      const tree = createSimpleTree();

      tree.setValue('name', 'Jane');
      tree.setValue('age', 30);

      expect(tree.changes).toHaveLength(2);
    });

    it('clearChanges resets tracking', () => {
      const tree = createSimpleTree();
      tree.setValue('name', 'Jane');

      tree.clearChanges();

      expect(tree.hasChanges).toBe(false);
      expect(tree.changes).toHaveLength(0);
    });

    it('trackChange allows manual tracking', () => {
      const tree = createSimpleTree();

      tree.trackChange({
        type: 'arrayPush',
        path: Path.fromString('items'),
        value: { name: 'New Item' },
      });

      expect(tree.changes).toHaveLength(1);
    });
  });

  describe('getPatches', () => {
    it('generates replace patch for setValue', () => {
      const tree = createSimpleTree();

      tree.setValue('name', 'Jane');

      const patches = tree.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        op: 'replace',
        path: '/name',
        value: 'Jane',
      });
    });

    it('generates patch for nested path', () => {
      const tree = createNestedTree();

      tree.setValue('address.city', 'LA');

      const patches = tree.getPatches();
      expect(patches[0]).toEqual({
        op: 'replace',
        path: '/address/city',
        value: 'LA',
      });
    });

    it('generates patch for array item', () => {
      const tree = createArrayTree();

      tree.setValue('items[0].price', 150);

      const patches = tree.getPatches();
      expect(patches[0]).toEqual({
        op: 'replace',
        path: '/items/0/price',
        value: 150,
      });
    });

    it('generates multiple patches', () => {
      const tree = createSimpleTree();

      tree.setValue('name', 'Jane');
      tree.setValue('age', 30);

      const patches = tree.getPatches();
      expect(patches).toHaveLength(2);
    });
  });
});

describe('ValueTree - array mutations', () => {
  describe('manual array tracking', () => {
    it('tracks arrayPush', () => {
      const tree = createArrayTree();
      const items = tree.get('items') as ArrayValueNode;

      const newItem = new ObjectValueNode('new-item', '2', { type: 'object' }, [
        new StringValueNode(undefined, 'name', { type: 'string' }, 'Item C'),
        new NumberValueNode(undefined, 'price', { type: 'number' }, 300),
      ]);
      items.push(newItem);

      tree.trackChange({
        type: 'arrayPush',
        path: Path.fromString('items'),
        value: newItem.getPlainValue(),
      });

      const patches = tree.getPatches();
      expect(patches[0]).toEqual({
        op: 'add',
        path: '/items/-',
        value: { name: 'Item C', price: 300 },
      });
    });

    it('tracks arrayInsert', () => {
      const tree = createArrayTree();

      tree.trackChange({
        type: 'arrayInsert',
        path: Path.fromString('items'),
        index: 1,
        value: { name: 'Inserted' },
      });

      const patches = tree.getPatches();
      expect(patches[0]).toEqual({
        op: 'add',
        path: '/items/1',
        value: { name: 'Inserted' },
      });
    });

    it('tracks arrayRemove', () => {
      const tree = createArrayTree();

      tree.trackChange({
        type: 'arrayRemove',
        path: Path.fromString('items'),
        index: 0,
      });

      const patches = tree.getPatches();
      expect(patches[0]).toEqual({
        op: 'remove',
        path: '/items/0',
      });
    });

    it('tracks arrayMove', () => {
      const tree = createArrayTree();

      tree.trackChange({
        type: 'arrayMove',
        path: Path.fromString('items'),
        fromIndex: 0,
        toIndex: 1,
      });

      const patches = tree.getPatches();
      expect(patches[0]).toEqual({
        op: 'move',
        from: '/items/0',
        path: '/items/1',
      });
    });

    it('tracks arrayReplace', () => {
      const tree = createArrayTree();

      tree.trackChange({
        type: 'arrayReplace',
        path: Path.fromString('items'),
        index: 0,
        value: { name: 'Replaced', price: 999 },
      });

      const patches = tree.getPatches();
      expect(patches[0]).toEqual({
        op: 'replace',
        path: '/items/0',
        value: { name: 'Replaced', price: 999 },
      });
    });

    it('tracks arrayClear', () => {
      const tree = createArrayTree();

      tree.trackChange({
        type: 'arrayClear',
        path: Path.fromString('items'),
      });

      const patches = tree.getPatches();
      expect(patches[0]).toEqual({
        op: 'replace',
        path: '/items',
        value: [],
      });
    });
  });
});

describe('ValueTree - root types', () => {
  describe('array root', () => {
    it('supports array as root', () => {
      const items = [
        new StringValueNode(undefined, '0', { type: 'string' }, 'a'),
        new StringValueNode(undefined, '1', { type: 'string' }, 'b'),
      ];
      const root = new ArrayValueNode(undefined, '', { type: 'array' }, items);
      const tree = new ValueTree(root);

      expect(tree.root.isArray()).toBe(true);
      expect(tree.getPlainValue()).toEqual(['a', 'b']);
    });

    it('get works with array root', () => {
      const items = [
        new StringValueNode('item-0', '0', { type: 'string' }, 'first'),
      ];
      const root = new ArrayValueNode(undefined, '', { type: 'array' }, items);
      const tree = new ValueTree(root);

      expect(tree.get('[0]')?.getPlainValue()).toBe('first');
    });
  });

  describe('primitive root', () => {
    it('supports string as root', () => {
      const root = new StringValueNode(
        undefined,
        '',
        { type: 'string' },
        'hello',
      );
      const tree = new ValueTree(root);

      expect(tree.root.isPrimitive()).toBe(true);
      expect(tree.getPlainValue()).toBe('hello');
    });

    it('supports number as root', () => {
      const root = new NumberValueNode(undefined, '', { type: 'number' }, 42);
      const tree = new ValueTree(root);

      expect(tree.getPlainValue()).toBe(42);
    });

    it('supports boolean as root', () => {
      const root = new BooleanValueNode(
        undefined,
        '',
        { type: 'boolean' },
        true,
      );
      const tree = new ValueTree(root);

      expect(tree.getPlainValue()).toBe(true);
    });
  });
});

describe('ValueTree - deep nesting', () => {
  it('handles deeply nested structures', () => {
    const deepValue = new StringValueNode(
      'deep-id',
      'value',
      { type: 'string' },
      'deep',
    );
    const level4 = new ObjectValueNode(
      undefined,
      'level4',
      { type: 'object' },
      [deepValue],
    );
    const level3 = new ObjectValueNode(
      undefined,
      'level3',
      { type: 'object' },
      [level4],
    );
    const level2 = new ObjectValueNode(
      undefined,
      'level2',
      { type: 'object' },
      [level3],
    );
    const level1 = new ObjectValueNode(
      undefined,
      'level1',
      { type: 'object' },
      [level2],
    );
    const root = new ObjectValueNode(undefined, '', { type: 'object' }, [
      level1,
    ]);
    const tree = new ValueTree(root);

    expect(tree.get('level1.level2.level3.level4.value')?.getPlainValue()).toBe(
      'deep',
    );
    expect(tree.pathOf('deep-id').asSimple()).toBe(
      'level1.level2.level3.level4.value',
    );
  });

  it('handles array of arrays', () => {
    const inner1 = new ArrayValueNode('inner-1', '0', { type: 'array' }, [
      new NumberValueNode('n-0-0', '0', { type: 'number' }, 1),
      new NumberValueNode('n-0-1', '1', { type: 'number' }, 2),
    ]);
    const inner2 = new ArrayValueNode('inner-2', '1', { type: 'array' }, [
      new NumberValueNode('n-1-0', '0', { type: 'number' }, 3),
      new NumberValueNode('n-1-1', '1', { type: 'number' }, 4),
    ]);
    const matrix = new ArrayValueNode(undefined, 'matrix', { type: 'array' }, [
      inner1,
      inner2,
    ]);
    const root = new ObjectValueNode(undefined, '', { type: 'object' }, [
      matrix,
    ]);
    const tree = new ValueTree(root);

    expect(tree.getPlainValue()).toEqual({
      matrix: [
        [1, 2],
        [3, 4],
      ],
    });
    expect(tree.get('matrix[0][1]')?.getPlainValue()).toBe(2);
    expect(tree.pathOf('n-1-1').asSimple()).toBe('matrix[1][1]');
  });
});

describe('ValueTree - dirty tracking', () => {
  it('isDirty is false initially', () => {
    const tree = createSimpleTree();

    expect(tree.isDirty).toBe(false);
  });

  it('isDirty is true after setValue', () => {
    const tree = createSimpleTree();

    tree.setValue('name', 'Jane');

    expect(tree.isDirty).toBe(true);
  });

  it('commit resets isDirty', () => {
    const tree = createSimpleTree();
    tree.setValue('name', 'Jane');

    tree.commit();

    expect(tree.isDirty).toBe(false);
    expect(tree.hasChanges).toBe(false);
  });

  it('commit preserves new values', () => {
    const tree = createSimpleTree();
    tree.setValue('name', 'Jane');

    tree.commit();

    expect(tree.getValue('name')).toBe('Jane');
  });

  it('revert restores original values', () => {
    const tree = createSimpleTree();
    tree.setValue('name', 'Jane');

    tree.revert();

    expect(tree.getValue('name')).toBe('John');
    expect(tree.isDirty).toBe(false);
    expect(tree.hasChanges).toBe(false);
  });

  it('revert works with nested structures', () => {
    const tree = createNestedTree();
    tree.setValue('address.city', 'LA');

    tree.revert();

    expect(tree.getValue('address.city')).toBe('NYC');
  });

  it('revert works with array items', () => {
    const tree = createArrayTree();
    tree.setValue('items[0].price', 999);

    tree.revert();

    expect(tree.getValue('items[0].price')).toBe(100);
  });
});

describe('ValueTree - smart array handling via createValueModel', () => {
  const schema = {
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
      },
      tags: {
        type: 'array',
        items: { type: 'string', default: '' },
      },
    },
  };

  it('arrays from createValueModel can use pushValue', () => {
    const tree = createValueModel(schema, { items: [], tags: [] });
    const items = tree.get('items');

    expect(items?.isArray()).toBe(true);
    if (items?.isArray()) {
      items.pushValue({ name: 'Product', price: 100 });

      expect(items.length).toBe(1);
      expect(items.at(0)?.getPlainValue()).toEqual({
        name: 'Product',
        price: 100,
      });
    }
  });

  it('arrays from createValueModel can use insertValueAt', () => {
    const tree = createValueModel(schema, {
      items: [{ name: 'First', price: 50 }],
      tags: [],
    });
    const items = tree.get('items');

    expect(items?.isArray()).toBe(true);
    if (items?.isArray()) {
      items.insertValueAt(0, { name: 'Inserted', price: 25 });

      expect(items.length).toBe(2);
      expect(items.at(0)?.getPlainValue()).toEqual({
        name: 'Inserted',
        price: 25,
      });
      expect(items.at(1)?.getPlainValue()).toEqual({
        name: 'First',
        price: 50,
      });
    }
  });

  it('pushValue uses default values from schema', () => {
    const tree = createValueModel(schema, { items: [], tags: [] });
    const items = tree.get('items');

    expect(items?.isArray()).toBe(true);
    if (items?.isArray()) {
      items.pushValue();

      expect(items.at(0)?.getPlainValue()).toEqual({ name: '', price: 0 });
    }
  });

  it('primitive arrays work with pushValue', () => {
    const tree = createValueModel(schema, { items: [], tags: [] });
    const tags = tree.get('tags');

    expect(tags?.isArray()).toBe(true);
    if (tags?.isArray()) {
      tags.pushValue('tag1');
      tags.pushValue('tag2');

      expect(tags.getPlainValue()).toEqual(['tag1', 'tag2']);
    }
  });

  it('nested arrays work with pushValue', () => {
    const nestedSchema = {
      type: 'object',
      properties: {
        matrix: {
          type: 'array',
          items: {
            type: 'array',
            items: { type: 'number', default: 0 },
          },
        },
      },
    };
    const tree = createValueModel(nestedSchema, { matrix: [] });
    const matrix = tree.get('matrix');

    expect(matrix?.isArray()).toBe(true);
    if (matrix?.isArray()) {
      matrix.pushValue([1, 2, 3]);

      expect(matrix.length).toBe(1);
      expect(matrix.at(0)?.getPlainValue()).toEqual([1, 2, 3]);
    }
  });

  it('deeply nested arrays work', () => {
    const tree = createValueModel(schema, {
      items: [{ name: 'Product', price: 100 }],
      tags: [],
    });

    const items = tree.get('items');
    expect(items?.isArray()).toBe(true);
    if (items?.isArray()) {
      items.pushValue({ name: 'Another', price: 200 });

      expect(tree.getPlainValue()).toEqual({
        items: [
          { name: 'Product', price: 100 },
          { name: 'Another', price: 200 },
        ],
        tags: [],
      });
    }
  });
});
