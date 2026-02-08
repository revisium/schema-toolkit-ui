import { resetNodeIdCounter } from '@revisium/schema-toolkit';
import { RowEditorVM } from '../RowEditorVM';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('RowEditorVM', () => {
  const simpleSchema = {
    type: 'object' as const,
    properties: {
      name: { type: 'string' as const, default: '' },
      age: { type: 'number' as const, default: 0 },
    },
    additionalProperties: false,
    required: ['name', 'age'],
  };

  describe('constructor', () => {
    it('creates root VM from schema and value', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      expect(vm.root).toBeDefined();
      expect(vm.root.isObject()).toBe(true);
    });

    it('creates empty value model when value not provided', () => {
      const vm = new RowEditorVM(simpleSchema);

      expect(vm.root).toBeDefined();
    });
  });

  describe('root', () => {
    it('provides access to root ObjectNodeVM', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        expect(nameChild?.isPrimitive()).toBe(true);
        if (nameChild?.isPrimitive()) {
          expect(nameChild.value).toBe('John');
        }
      }
    });
  });

  describe('isDirty', () => {
    it('returns false initially', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      expect(vm.isDirty).toBe(false);
    });

    it('returns true after value change', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      expect(vm.isDirty).toBe(true);
    });
  });

  describe('getValue', () => {
    it('returns plain object value', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      const value = vm.getValue();

      expect(value).toEqual({ name: 'John', age: 25 });
    });

    it('returns updated value after changes', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      expect(vm.getValue()).toEqual({ name: 'Jane', age: 25 });
    });
  });

  describe('commit', () => {
    it('commits changes', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      vm.commit();

      expect(vm.isDirty).toBe(false);
    });
  });

  describe('revert', () => {
    it('reverts changes', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      vm.revert();

      expect(vm.isDirty).toBe(false);
      expect(vm.getValue()).toEqual({ name: 'John', age: 25 });
    });
  });

  describe('isValid', () => {
    it('returns true when no errors', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      expect(vm.isValid).toBe(true);
    });
  });

  describe('errors', () => {
    it('returns empty array when valid', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      expect(vm.errors).toEqual([]);
    });
  });

  describe('mode', () => {
    it('defaults to editing mode', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      expect(vm.mode).toBe('editing');
    });

    it('can be set to creating mode', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        {
          mode: 'creating',
        },
      );

      expect(vm.mode).toBe('creating');
    });

    it('can be set to reading mode', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        {
          mode: 'reading',
        },
      );

      expect(vm.mode).toBe('reading');
    });
  });

  describe('isReadOnly', () => {
    it('returns false in editing mode', () => {
      const vm = new RowEditorVM(simpleSchema, {}, { mode: 'editing' });

      expect(vm.isReadOnly).toBe(false);
    });

    it('returns true in reading mode', () => {
      const vm = new RowEditorVM(simpleSchema, {}, { mode: 'reading' });

      expect(vm.isReadOnly).toBe(true);
    });

    it('returns false in creating mode', () => {
      const vm = new RowEditorVM(simpleSchema, {}, { mode: 'creating' });

      expect(vm.isReadOnly).toBe(false);
    });
  });
});
