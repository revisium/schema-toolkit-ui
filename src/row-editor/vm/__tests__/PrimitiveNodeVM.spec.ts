import { resetNodeIdCounter } from '@revisium/schema-toolkit';
import { RowEditorVM } from '../RowEditorVM';
import type { PrimitiveNodeVM as IPrimitiveNodeVM } from '../types';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('PrimitiveNodeVM', () => {
  function createPrimitiveAccessor(
    schema: Record<string, unknown>,
    fieldName: string,
    value?: Record<string, unknown>,
  ): IPrimitiveNodeVM {
    const objectSchema = {
      type: 'object' as const,
      properties: { [fieldName]: schema },
      additionalProperties: false,
      required: [fieldName],
    };
    const vm = new RowEditorVM(
      objectSchema,
      value ?? { [fieldName]: (schema as { default?: unknown }).default },
    );
    const root = vm.root;
    if (root.isObject()) {
      const child = root.child(fieldName);
      if (child?.isPrimitive()) {
        return child;
      }
    }
    throw new Error('Expected primitive child');
  }

  describe('with string value', () => {
    it('exposes string value', () => {
      const vm = createPrimitiveAccessor(
        { type: 'string', default: '' },
        'name',
        { name: 'John' },
      );

      expect(vm.value).toBe('John');
    });

    it('exposes default value', () => {
      const vm = createPrimitiveAccessor(
        { type: 'string', default: 'default' },
        'name',
      );

      expect(vm.defaultValue).toBe('default');
    });

    it('sets string value', () => {
      const vm = createPrimitiveAccessor(
        { type: 'string', default: '' },
        'name',
        { name: 'John' },
      );

      vm.setValue('Jane');

      expect(vm.value).toBe('Jane');
    });

    it('tracks dirty state', () => {
      const vm = createPrimitiveAccessor(
        { type: 'string', default: '' },
        'name',
        { name: 'John' },
      );

      expect(vm.isDirty).toBe(false);

      vm.setValue('Jane');

      expect(vm.isDirty).toBe(true);
    });
  });

  describe('with number value', () => {
    it('exposes number value', () => {
      const vm = createPrimitiveAccessor(
        { type: 'number', default: 0 },
        'age',
        { age: 25 },
      );

      expect(vm.value).toBe(25);
    });

    it('sets number value', () => {
      const vm = createPrimitiveAccessor(
        { type: 'number', default: 0 },
        'age',
        { age: 25 },
      );

      vm.setValue(30);

      expect(vm.value).toBe(30);
    });
  });

  describe('with boolean value', () => {
    it('exposes boolean value', () => {
      const vm = createPrimitiveAccessor(
        { type: 'boolean', default: false },
        'active',
        { active: true },
      );

      expect(vm.value).toBe(true);
    });

    it('sets boolean value', () => {
      const vm = createPrimitiveAccessor(
        { type: 'boolean', default: false },
        'active',
        { active: false },
      );

      vm.setValue(true);

      expect(vm.value).toBe(true);
    });
  });

  describe('readOnly', () => {
    it('returns false when not readOnly', () => {
      const vm = createPrimitiveAccessor(
        { type: 'string', default: '' },
        'name',
      );

      expect(vm.isReadOnly).toBe(false);
    });

    it('returns true when schema is readOnly', () => {
      const vm = createPrimitiveAccessor(
        { type: 'string', default: '', readOnly: true },
        'name',
      );

      expect(vm.isReadOnly).toBe(true);
    });

    it('returns true when has formula', () => {
      const vm = createPrimitiveAccessor(
        {
          type: 'number',
          default: 0,
          'x-formula': { version: 1, expression: 'a + b' },
        },
        'total',
      );

      expect(vm.isReadOnly).toBe(true);
    });
  });

  describe('type guards', () => {
    it('isPrimitive returns true', () => {
      const vm = createPrimitiveAccessor(
        { type: 'string', default: '' },
        'name',
      );

      expect(vm.isPrimitive()).toBe(true);
    });

    it('isObject returns false', () => {
      const vm = createPrimitiveAccessor(
        { type: 'string', default: '' },
        'name',
      );

      expect(vm.isObject()).toBe(false);
    });

    it('isArray returns false', () => {
      const vm = createPrimitiveAccessor(
        { type: 'string', default: '' },
        'name',
      );

      expect(vm.isArray()).toBe(false);
    });
  });
});
