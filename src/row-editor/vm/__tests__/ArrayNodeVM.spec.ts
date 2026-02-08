import { resetNodeIdCounter } from '@revisium/schema-toolkit';
import { RowEditorVM } from '../RowEditorVM';
import type {
  ArrayNodeVM as IArrayNodeVM,
  PrimitiveNodeVM as IPrimitiveNodeVM,
} from '../types';

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

  function createArrayAccessor(values: string[] = []): IArrayNodeVM {
    const vm = new RowEditorVM(stringArraySchema, { items: values });
    const root = vm.root;
    if (root.isObject()) {
      const itemsChild = root.child('items');
      if (itemsChild?.isArray()) {
        return itemsChild;
      }
    }
    throw new Error('Expected array child');
  }

  describe('items', () => {
    it('creates item VMs for each element', () => {
      const vm = createArrayAccessor(['a', 'b', 'c']);

      expect(vm.items).toHaveLength(3);
    });

    it('item VMs have index as name', () => {
      const vm = createArrayAccessor(['a', 'b']);

      expect(vm.items[0].name).toBe('0');
      expect(vm.items[1].name).toBe('1');
    });

    it('item VMs have this as parent', () => {
      const vm = createArrayAccessor(['a', 'b']);

      for (const item of vm.items) {
        expect(item.parent).toBe(vm);
      }
    });

    it('creates primitive accessors for primitive items', () => {
      const vm = createArrayAccessor(['a']);

      expect(vm.items[0].isPrimitive()).toBe(true);
    });
  });

  describe('length', () => {
    it('returns number of items', () => {
      const vm = createArrayAccessor(['a', 'b', 'c']);

      expect(vm.length).toBe(3);
    });

    it('returns 0 for empty array', () => {
      const vm = createArrayAccessor([]);

      expect(vm.length).toBe(0);
    });
  });

  describe('at()', () => {
    it('returns item at index', () => {
      const vm = createArrayAccessor(['a', 'b', 'c']);

      const item = vm.at(1);

      expect(item).toBeDefined();
      if (item?.isPrimitive()) {
        expect(item.value).toBe('b');
      }
    });

    it('returns undefined for out of bounds index', () => {
      const vm = createArrayAccessor(['a']);

      expect(vm.at(5)).toBeUndefined();
      expect(vm.at(-1)).toBeUndefined();
    });
  });

  describe('pushValue()', () => {
    it('adds item to end', () => {
      const vm = createArrayAccessor(['a', 'b']);

      vm.pushValue('c');

      expect(vm.length).toBe(3);
      const lastItem = vm.at(2);
      if (lastItem?.isPrimitive()) {
        expect(lastItem.value).toBe('c');
      }
    });

    it('updates items array', () => {
      const vm = createArrayAccessor([]);

      vm.pushValue('first');

      expect(vm.items).toHaveLength(1);
    });
  });

  describe('removeAt()', () => {
    it('removes item at index', () => {
      const vm = createArrayAccessor(['a', 'b', 'c']);

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
      const vm = createArrayAccessor(['a', 'b', 'c']);

      vm.removeAt(0);

      expect(vm.items[0].name).toBe('1');
      expect(vm.items[1].name).toBe('2');
    });
  });

  describe('move()', () => {
    it('moves item from one index to another', () => {
      const vm = createArrayAccessor(['a', 'b', 'c']);

      vm.move(0, 2);

      const values = vm.items.map((item) =>
        item.isPrimitive() ? item.value : null,
      );
      expect(values).toEqual(['b', 'c', 'a']);
    });

    it('items keep original names after move', () => {
      const vm = createArrayAccessor(['a', 'b', 'c']);

      vm.move(0, 2);

      expect(vm.items[0].name).toBe('1');
      expect(vm.items[1].name).toBe('2');
      expect(vm.items[2].name).toBe('0');
    });
  });

  describe('isDirty', () => {
    it('returns false when no changes', () => {
      const vm = createArrayAccessor(['a', 'b']);

      expect(vm.isDirty).toBe(false);
    });

    it('returns true when item added', () => {
      const vm = createArrayAccessor(['a']);

      vm.pushValue('b');

      expect(vm.isDirty).toBe(true);
    });

    it('returns true when item removed', () => {
      const vm = createArrayAccessor(['a', 'b']);

      vm.removeAt(0);

      expect(vm.isDirty).toBe(true);
    });

    it('returns true when item value changed', () => {
      const vm = createArrayAccessor(['a']);

      const item = vm.at(0);
      if (item?.isPrimitive()) {
        item.setValue('changed');
      }

      expect(vm.isDirty).toBe(true);
    });
  });

  describe('type guards', () => {
    it('isPrimitive returns false', () => {
      const vm = createArrayAccessor();

      expect(vm.isPrimitive()).toBe(false);
    });

    it('isObject returns false', () => {
      const vm = createArrayAccessor();

      expect(vm.isObject()).toBe(false);
    });

    it('isArray returns true', () => {
      const vm = createArrayAccessor();

      expect(vm.isArray()).toBe(true);
    });
  });

  describe('array of objects', () => {
    it('creates object accessors for object items', () => {
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

      const vm = new RowEditorVM(objectArraySchema, {
        people: [{ name: 'John' }, { name: 'Jane' }],
      });
      const root = vm.root;
      if (!root.isObject()) {
        throw new Error('Expected object root');
      }
      const peopleVM = root.child('people');
      if (!peopleVM?.isArray()) {
        throw new Error('Expected array child');
      }

      expect(peopleVM.items[0].isObject()).toBe(true);
      expect(peopleVM.items[1].isObject()).toBe(true);
    });
  });
});
