import { jest } from '@jest/globals';
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

  describe('patches', () => {
    it('generates patch when value changes', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      expect(vm.patches).toEqual([
        { op: 'replace', path: '/name', value: 'Jane' },
      ]);
    });

    it('generates single patch when setValue called with same then different value', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('John');
          nameChild.setValue('Jane');
        }
      }

      expect(vm.patches).toHaveLength(1);
      expect(vm.patches).toEqual([
        { op: 'replace', path: '/name', value: 'Jane' },
      ]);
    });
  });

  describe('rowId', () => {
    it('defaults to empty string', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      expect(vm.rowId).toBe('');
      expect(vm.initialRowId).toBe('');
    });

    it('uses provided rowId', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1' },
      );

      expect(vm.rowId).toBe('row-1');
      expect(vm.initialRowId).toBe('row-1');
    });

    it('tracks changes via setRowId', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1' },
      );

      vm.setRowId('row-2');

      expect(vm.rowId).toBe('row-2');
      expect(vm.initialRowId).toBe('row-1');
      expect(vm.isRowIdChanged).toBe(true);
    });

    it('isRowIdChanged returns false when unchanged', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1' },
      );

      expect(vm.isRowIdChanged).toBe(false);
    });

    it('isRowIdChanged returns false when set back to initial', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1' },
      );

      vm.setRowId('row-2');
      vm.setRowId('row-1');

      expect(vm.isRowIdChanged).toBe(false);
    });
  });

  describe('hasChanges', () => {
    it('returns false initially', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1' },
      );

      expect(vm.hasChanges).toBe(false);
    });

    it('returns true when only rowId changed', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1' },
      );

      vm.setRowId('row-2');

      expect(vm.isDirty).toBe(false);
      expect(vm.hasChanges).toBe(true);
    });

    it('returns true when only data changed', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1' },
      );

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      expect(vm.isRowIdChanged).toBe(false);
      expect(vm.hasChanges).toBe(true);
    });

    it('returns true when both rowId and data changed', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1' },
      );

      vm.setRowId('row-2');
      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      expect(vm.hasChanges).toBe(true);
    });
  });

  describe('save', () => {
    it('calls onSave with rowId, value and patches', () => {
      const onSave = jest.fn();
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1', onSave },
      );

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      vm.save();

      expect(onSave).toHaveBeenCalledWith('row-1', { name: 'Jane', age: 25 }, [
        { op: 'replace', path: '/name', value: 'Jane' },
      ]);
    });

    it('passes current rowId after rename', () => {
      const onSave = jest.fn();
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1', onSave },
      );

      vm.setRowId('row-renamed');
      vm.save();

      expect(onSave).toHaveBeenCalledWith(
        'row-renamed',
        expect.anything(),
        expect.anything(),
      );
    });

    it('commits data after save', () => {
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { rowId: 'row-1', onSave: jest.fn() },
      );

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      vm.save();

      expect(vm.isDirty).toBe(false);
    });
  });

  describe('markAsSaved', () => {
    it('commits data changes', () => {
      const vm = new RowEditorVM(simpleSchema, { name: 'John', age: 25 });

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      expect(vm.isDirty).toBe(true);

      vm.markAsSaved();

      expect(vm.isDirty).toBe(false);
      expect(vm.patches).toEqual([]);
    });

    it('does not call onSave', () => {
      const onSave = jest.fn();
      const vm = new RowEditorVM(
        simpleSchema,
        { name: 'John', age: 25 },
        { onSave },
      );

      if (vm.root.isObject()) {
        const nameChild = vm.root.child('name');
        if (nameChild?.isPrimitive()) {
          nameChild.setValue('Jane');
        }
      }

      vm.markAsSaved();

      expect(onSave).not.toHaveBeenCalled();
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
