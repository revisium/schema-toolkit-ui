import {
  StringValueNode,
  NumberValueNode,
  BooleanValueNode,
  resetNodeIdCounter,
} from '@revisium/schema-toolkit';
import { PrimitiveNodeVM } from '../PrimitiveNodeVM';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('PrimitiveNodeVM', () => {
  describe('with StringValueNode', () => {
    it('exposes string value', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.value).toBe('John');
    });

    it('exposes default value', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        default: 'default',
      });
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.defaultValue).toBe('default');
    });

    it('sets string value', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      const vm = new PrimitiveNodeVM(node, null);

      vm.setValue('Jane');

      expect(vm.value).toBe('Jane');
      expect(node.value).toBe('Jane');
    });

    it('tracks dirty state', () => {
      const node = new StringValueNode(
        undefined,
        'name',
        { type: 'string' },
        'John',
      );
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.isDirty).toBe(false);

      vm.setValue('Jane');

      expect(vm.isDirty).toBe(true);
    });
  });

  describe('with NumberValueNode', () => {
    it('exposes number value', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        { type: 'number' },
        25,
      );
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.value).toBe(25);
    });

    it('sets number value', () => {
      const node = new NumberValueNode(
        undefined,
        'age',
        { type: 'number' },
        25,
      );
      const vm = new PrimitiveNodeVM(node, null);

      vm.setValue(30);

      expect(vm.value).toBe(30);
    });
  });

  describe('with BooleanValueNode', () => {
    it('exposes boolean value', () => {
      const node = new BooleanValueNode(
        undefined,
        'active',
        { type: 'boolean' },
        true,
      );
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.value).toBe(true);
    });

    it('sets boolean value', () => {
      const node = new BooleanValueNode(
        undefined,
        'active',
        { type: 'boolean' },
        false,
      );
      const vm = new PrimitiveNodeVM(node, null);

      vm.setValue(true);

      expect(vm.value).toBe(true);
    });
  });

  describe('readOnly', () => {
    it('returns false when not readOnly', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.isReadOnly).toBe(false);
    });

    it('returns true when schema is readOnly', () => {
      const node = new StringValueNode(undefined, 'name', {
        type: 'string',
        readOnly: true,
      });
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.isReadOnly).toBe(true);
    });

    it('returns true when has formula', () => {
      const node = new NumberValueNode(undefined, 'total', {
        type: 'number',
        'x-formula': { version: 1, expression: 'a + b' },
      });
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.isReadOnly).toBe(true);
    });
  });

  describe('type guards', () => {
    it('isPrimitive returns true', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.isPrimitive()).toBe(true);
    });

    it('isObject returns false', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.isObject()).toBe(false);
    });

    it('isArray returns false', () => {
      const node = new StringValueNode(undefined, 'name', { type: 'string' });
      const vm = new PrimitiveNodeVM(node, null);

      expect(vm.isArray()).toBe(false);
    });
  });
});
