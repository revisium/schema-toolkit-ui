import { resetNodeIdCounter } from '@revisium/schema-toolkit';
import { RowEditorVM } from '../RowEditorVM';

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

  function createObjectRoot(value: Record<string, unknown> = {}) {
    const vm = new RowEditorVM(objectSchema, {
      name: '',
      age: 0,
      active: false,
      ...value,
    });
    const root = vm.root;
    if (!root.isObject()) {
      throw new Error('Expected object root');
    }
    return root;
  }

  describe('children', () => {
    it('creates child VMs for each property', () => {
      const vm = createObjectRoot({ name: 'John', age: 25, active: true });

      expect(vm.children).toHaveLength(3);
    });

    it('child VMs have correct names', () => {
      const vm = createObjectRoot();

      const names = vm.children.map((c) => c.name);
      expect(names).toContain('name');
      expect(names).toContain('age');
      expect(names).toContain('active');
    });

    it('child VMs have this as parent', () => {
      const vm = createObjectRoot();

      for (const child of vm.children) {
        expect(child.parent).toBe(vm);
      }
    });

    it('creates primitive accessors for primitive children', () => {
      const vm = createObjectRoot();

      for (const child of vm.children) {
        expect(child.isPrimitive()).toBe(true);
      }
    });
  });

  describe('child()', () => {
    it('returns child by name', () => {
      const vm = createObjectRoot({ name: 'John' });

      const child = vm.child('name');

      expect(child).toBeDefined();
      expect(child?.name).toBe('name');
    });

    it('returns undefined for non-existent child', () => {
      const vm = createObjectRoot();

      const child = vm.child('nonexistent');

      expect(child).toBeUndefined();
    });
  });

  describe('isDirty', () => {
    it('returns false when no changes', () => {
      const vm = createObjectRoot({ name: 'John' });

      expect(vm.isDirty).toBe(false);
    });

    it('returns true when child value changed', () => {
      const vm = createObjectRoot({ name: 'John' });

      const nameChild = vm.child('name');
      if (nameChild?.isPrimitive()) {
        nameChild.setValue('Jane');
      }

      expect(vm.isDirty).toBe(true);
    });
  });

  describe('type guards', () => {
    it('isPrimitive returns false', () => {
      const vm = createObjectRoot();

      expect(vm.isPrimitive()).toBe(false);
    });

    it('isObject returns true', () => {
      const vm = createObjectRoot();

      expect(vm.isObject()).toBe(true);
    });

    it('isArray returns false', () => {
      const vm = createObjectRoot();

      expect(vm.isArray()).toBe(false);
    });
  });

  describe('nested objects', () => {
    it('creates object accessor for nested objects', () => {
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

      const vm = new RowEditorVM(nestedSchema, { address: { city: 'NYC' } });

      const addressVM = vm.root.isObject()
        ? vm.root.child('address')
        : undefined;
      expect(addressVM?.isObject()).toBe(true);
    });
  });
});
