import { createRowModel, resetNodeIdCounter } from '@revisium/schema-toolkit';
import {
  ObjectNodeVMImpl as ObjectNodeVM,
  PrimitiveNodeVMImpl as PrimitiveNodeVM,
} from '../index';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('ObjectNodeVM', () => {
  const objectSchema = {
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const, default: '' },
      age: { type: 'number' as const, default: 0 },
      active: { type: 'boolean' as const, default: false },
    },
    additionalProperties: false,
    required: ['name', 'age', 'active'],
  };

  function createObjectRow(value: Record<string, unknown> = {}) {
    return createRowModel({
      rowId: 'test',
      schema: objectSchema,
      data: {
        name: '',
        age: 0,
        active: false,
        ...value,
      },
    });
  }

  describe('children', () => {
    it('creates child VMs for each property', () => {
      const row = createObjectRow({ name: 'John', age: 25, active: true });
      const vm = new ObjectNodeVM(row.tree.root, null);

      expect(vm.children).toHaveLength(3);
    });

    it('child VMs have correct names', () => {
      const row = createObjectRow();
      const vm = new ObjectNodeVM(row.tree.root, null);

      const names = vm.children.map((c) => c.name);
      expect(names).toContain('name');
      expect(names).toContain('age');
      expect(names).toContain('active');
    });

    it('child VMs have this as parent', () => {
      const row = createObjectRow();
      const vm = new ObjectNodeVM(row.tree.root, null);

      for (const child of vm.children) {
        expect(child.parent).toBe(vm);
      }
    });

    it('creates PrimitiveNodeVM for primitive children', () => {
      const row = createObjectRow();
      const vm = new ObjectNodeVM(row.tree.root, null);

      for (const child of vm.children) {
        expect(child).toBeInstanceOf(PrimitiveNodeVM);
      }
    });
  });

  describe('child()', () => {
    it('returns child by name', () => {
      const row = createObjectRow({ name: 'John' });
      const vm = new ObjectNodeVM(row.tree.root, null);

      const child = vm.child('name');

      expect(child).toBeDefined();
      expect(child?.name).toBe('name');
    });

    it('returns undefined for non-existent child', () => {
      const row = createObjectRow();
      const vm = new ObjectNodeVM(row.tree.root, null);

      const child = vm.child('nonexistent');

      expect(child).toBeUndefined();
    });
  });

  describe('isDirty', () => {
    it('returns false when no changes', () => {
      const row = createObjectRow({ name: 'John' });
      const vm = new ObjectNodeVM(row.tree.root, null);

      expect(vm.isDirty).toBe(false);
    });

    it('returns true when child value changed', () => {
      const row = createObjectRow({ name: 'John' });
      const vm = new ObjectNodeVM(row.tree.root, null);

      const nameChild = vm.child('name');
      if (nameChild?.isPrimitive()) {
        nameChild.setValue('Jane');
      }

      expect(vm.isDirty).toBe(true);
    });
  });

  describe('type guards', () => {
    it('isPrimitive returns false', () => {
      const row = createObjectRow();
      const vm = new ObjectNodeVM(row.tree.root, null);

      expect(vm.isPrimitive()).toBe(false);
    });

    it('isObject returns true', () => {
      const row = createObjectRow();
      const vm = new ObjectNodeVM(row.tree.root, null);

      expect(vm.isObject()).toBe(true);
    });

    it('isArray returns false', () => {
      const row = createObjectRow();
      const vm = new ObjectNodeVM(row.tree.root, null);

      expect(vm.isArray()).toBe(false);
    });
  });

  describe('nested objects', () => {
    it('creates ObjectNodeVM for nested objects', () => {
      const nestedSchema = {
        type: 'object' as const,
        properties: {
          address: {
            type: 'object' as const,
            properties: {
              city: { type: 'string' as const, default: '' },
            },
            additionalProperties: false,
            required: ['city'],
          },
        },
        additionalProperties: false,
        required: ['address'],
      };

      const row = createRowModel({
        rowId: 'test',
        schema: nestedSchema,
        data: { address: { city: 'NYC' } },
      });
      const vm = new ObjectNodeVM(row.tree.root, null);

      const addressVM = vm.child('address');
      expect(addressVM).toBeInstanceOf(ObjectNodeVM);
      expect(addressVM?.isObject()).toBe(true);
    });
  });
});
