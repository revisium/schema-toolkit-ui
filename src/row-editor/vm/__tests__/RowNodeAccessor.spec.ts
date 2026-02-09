import { resetNodeIdCounter } from '@revisium/schema-toolkit';
import { RowEditorVM } from '../RowEditorVM';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('RowNodeAccessor', () => {
  const objectSchema = {
    type: 'object' as const,
    properties: {
      field: { type: 'string' as const, default: '' },
    },
    additionalProperties: false,
    required: ['field'],
  };

  function createVM(value: Record<string, unknown> = {}) {
    return new RowEditorVM(objectSchema, { field: '', ...value });
  }

  describe('constructor', () => {
    it('wraps a ValueNode', () => {
      const vm = createVM({ field: 'test' });
      const root = vm.root;

      expect(root.id).toBeDefined();
      expect(root.isObject()).toBe(true);
    });

    it('provides parent reference for children', () => {
      const vm = createVM();
      const root = vm.root;

      if (root.isObject()) {
        for (const child of root.children) {
          expect(child.parent).toBe(root);
        }
      }
    });
  });

  describe('expand/collapse', () => {
    it('starts expanded by default', () => {
      const vm = createVM();

      expect(vm.root.isExpanded).toBe(true);
    });

    it('can be collapsed', () => {
      const vm = createVM();

      vm.root.collapse();

      expect(vm.root.isExpanded).toBe(false);
    });

    it('can be expanded', () => {
      const vm = createVM();
      vm.root.collapse();

      vm.root.expand();

      expect(vm.root.isExpanded).toBe(true);
    });

    it('toggles expanded state', () => {
      const vm = createVM();

      vm.root.toggleExpanded();
      expect(vm.root.isExpanded).toBe(false);

      vm.root.toggleExpanded();
      expect(vm.root.isExpanded).toBe(true);
    });
  });

  describe('focus', () => {
    it('starts not focused', () => {
      const vm = createVM();

      expect(vm.root.isFocused).toBe(false);
    });

    it('can be focused', () => {
      const vm = createVM();

      vm.root.setFocused(true);

      expect(vm.root.isFocused).toBe(true);
    });

    it('can be unfocused', () => {
      const vm = createVM();
      vm.root.setFocused(true);

      vm.root.setFocused(false);

      expect(vm.root.isFocused).toBe(false);
    });
  });
});
