import { createRowModel, resetNodeIdCounter } from '@revisium/schema-toolkit';
import {
  ArrayNodeVMImpl as ArrayNodeVM,
  PrimitiveNodeVMImpl as PrimitiveNodeVM,
} from '../index';
import type { PrimitiveNodeVM as IPrimitiveNodeVM } from '../types';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('ArrayNodeVM', () => {
  const stringArraySchema = {
    type: 'object' as const,
    properties: {
      items: {
        type: 'array' as const,
        items: { type: 'string' as const, default: '' },
        default: [],
      },
    },
    additionalProperties: false,
    required: ['items'],
  };

  function createArrayRow(values: string[] = []) {
    return createRowModel({
      rowId: 'test',
      schema: stringArraySchema,
      data: { items: values },
    });
  }

  function getArrayNode(values: string[] = []) {
    const row = createArrayRow(values);
    const itemsNode = row.tree.get('items');
    if (!itemsNode?.isArray()) {
      throw new Error('Expected array node');
    }
    return itemsNode;
  }

  describe('items', () => {
    it('creates item VMs for each element', () => {
      const node = getArrayNode(['a', 'b', 'c']);
      const vm = new ArrayNodeVM(node, null);

      expect(vm.items).toHaveLength(3);
    });

    it('item VMs have index as name', () => {
      const node = getArrayNode(['a', 'b']);
      const vm = new ArrayNodeVM(node, null);

      expect(vm.items[0].name).toBe('0');
      expect(vm.items[1].name).toBe('1');
    });

    it('item VMs have this as parent', () => {
      const node = getArrayNode(['a', 'b']);
      const vm = new ArrayNodeVM(node, null);

      for (const item of vm.items) {
        expect(item.parent).toBe(vm);
      }
    });

    it('creates PrimitiveNodeVM for primitive items', () => {
      const node = getArrayNode(['a']);
      const vm = new ArrayNodeVM(node, null);

      expect(vm.items[0]).toBeInstanceOf(PrimitiveNodeVM);
    });
  });

  describe('length', () => {
    it('returns number of items', () => {
      const node = getArrayNode(['a', 'b', 'c']);
      const vm = new ArrayNodeVM(node, null);

      expect(vm.length).toBe(3);
    });

    it('returns 0 for empty array', () => {
      const node = getArrayNode([]);
      const vm = new ArrayNodeVM(node, null);

      expect(vm.length).toBe(0);
    });
  });

  describe('at()', () => {
    it('returns item at index', () => {
      const node = getArrayNode(['a', 'b', 'c']);
      const vm = new ArrayNodeVM(node, null);

      const item = vm.at(1);

      expect(item).toBeDefined();
      if (item?.isPrimitive()) {
        expect(item.value).toBe('b');
      }
    });

    it('returns undefined for out of bounds index', () => {
      const node = getArrayNode(['a']);
      const vm = new ArrayNodeVM(node, null);

      expect(vm.at(5)).toBeUndefined();
      expect(vm.at(-1)).toBeUndefined();
    });
  });

  describe('pushValue()', () => {
    it('adds item to end', () => {
      const node = getArrayNode(['a', 'b']);
      const vm = new ArrayNodeVM(node, null);

      vm.pushValue('c');

      expect(vm.length).toBe(3);
      const lastItem = vm.at(2);
      if (lastItem?.isPrimitive()) {
        expect(lastItem.value).toBe('c');
      }
    });

    it('updates items array', () => {
      const node = getArrayNode([]);
      const vm = new ArrayNodeVM(node, null);

      vm.pushValue('first');

      expect(vm.items).toHaveLength(1);
    });
  });

  describe('removeAt()', () => {
    it('removes item at index', () => {
      const node = getArrayNode(['a', 'b', 'c']);
      const vm = new ArrayNodeVM(node, null);

      vm.removeAt(1);

      expect(vm.length).toBe(2);
      if (vm.at(0)?.isPrimitive()) {
        expect((vm.at(0) as IPrimitiveNodeVM).value).toBe('a');
      }
      if (vm.at(1)?.isPrimitive()) {
        expect((vm.at(1) as IPrimitiveNodeVM).value).toBe('c');
      }
    });

    it('items have their original names after removal', () => {
      const node = getArrayNode(['a', 'b', 'c']);
      const vm = new ArrayNodeVM(node, null);

      vm.removeAt(0);

      // Items keep their original index-based names from creation
      expect(vm.items[0].name).toBe('1');
      expect(vm.items[1].name).toBe('2');
    });
  });

  describe('move()', () => {
    it('moves item from one index to another', () => {
      const node = getArrayNode(['a', 'b', 'c']);
      const vm = new ArrayNodeVM(node, null);

      vm.move(0, 2);

      const values = vm.items.map((item) =>
        item.isPrimitive() ? item.value : null,
      );
      expect(values).toEqual(['b', 'c', 'a']);
    });

    it('items keep original names after move', () => {
      const node = getArrayNode(['a', 'b', 'c']);
      const vm = new ArrayNodeVM(node, null);

      vm.move(0, 2);

      // Items keep their original index-based names from creation
      expect(vm.items[0].name).toBe('1');
      expect(vm.items[1].name).toBe('2');
      expect(vm.items[2].name).toBe('0');
    });
  });

  describe('isDirty', () => {
    it('returns false when no changes', () => {
      const node = getArrayNode(['a', 'b']);
      const vm = new ArrayNodeVM(node, null);

      expect(vm.isDirty).toBe(false);
    });

    it('returns true when item added', () => {
      const node = getArrayNode(['a']);
      const vm = new ArrayNodeVM(node, null);

      vm.pushValue('b');

      expect(vm.isDirty).toBe(true);
    });

    it('returns true when item removed', () => {
      const node = getArrayNode(['a', 'b']);
      const vm = new ArrayNodeVM(node, null);

      vm.removeAt(0);

      expect(vm.isDirty).toBe(true);
    });

    it('returns true when item value changed', () => {
      const node = getArrayNode(['a']);
      const vm = new ArrayNodeVM(node, null);

      const item = vm.at(0);
      if (item?.isPrimitive()) {
        item.setValue('changed');
      }

      expect(vm.isDirty).toBe(true);
    });
  });

  describe('type guards', () => {
    it('isPrimitive returns false', () => {
      const node = getArrayNode();
      const vm = new ArrayNodeVM(node, null);

      expect(vm.isPrimitive()).toBe(false);
    });

    it('isObject returns false', () => {
      const node = getArrayNode();
      const vm = new ArrayNodeVM(node, null);

      expect(vm.isObject()).toBe(false);
    });

    it('isArray returns true', () => {
      const node = getArrayNode();
      const vm = new ArrayNodeVM(node, null);

      expect(vm.isArray()).toBe(true);
    });
  });

  describe('array of objects', () => {
    it('creates ObjectNodeVM for object items', () => {
      const objectArraySchema = {
        type: 'object' as const,
        properties: {
          people: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                name: { type: 'string' as const, default: '' },
              },
              additionalProperties: false,
              required: ['name'],
            },
            default: [],
          },
        },
        additionalProperties: false,
        required: ['people'],
      };

      const row = createRowModel({
        rowId: 'test',
        schema: objectArraySchema,
        data: { people: [{ name: 'John' }, { name: 'Jane' }] },
      });
      const peopleNode = row.tree.get('people');
      if (!peopleNode?.isArray()) {
        throw new Error('Expected array node');
      }

      const vm = new ArrayNodeVM(peopleNode, null);

      expect(vm.items[0].isObject()).toBe(true);
      expect(vm.items[1].isObject()).toBe(true);
    });
  });
});
