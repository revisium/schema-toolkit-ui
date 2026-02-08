import { StringValueNode, resetNodeIdCounter } from '@revisium/schema-toolkit';
import { BaseNodeVM } from '../BaseNodeVM';

class TestNodeVM extends BaseNodeVM {
  isPrimitive(): boolean {
    return false;
  }
  isObject(): boolean {
    return false;
  }
  isArray(): boolean {
    return false;
  }
}

beforeEach(() => {
  resetNodeIdCounter();
});

describe('BaseNodeVM', () => {
  function createStringNode(name: string, value: string) {
    return new StringValueNode(undefined, name, { type: 'string' }, value);
  }

  describe('constructor', () => {
    it('wraps a ValueNode', () => {
      const node = createStringNode('field', 'test');
      const vm = new TestNodeVM(node, null);

      expect(vm.node).toBe(node);
      expect(vm.id).toBe(node.id);
      expect(vm.name).toBe('field');
    });

    it('accepts parent VM', () => {
      const parentNode = createStringNode('parent', '');
      const childNode = createStringNode('child', '');
      const parentVM = new TestNodeVM(parentNode, null);
      const childVM = new TestNodeVM(childNode, parentVM);

      expect(childVM.parent).toBe(parentVM);
    });
  });

  describe('expand/collapse', () => {
    it('starts expanded by default', () => {
      const node = createStringNode('field', 'test');
      const vm = new TestNodeVM(node, null);

      expect(vm.isExpanded).toBe(true);
    });

    it('can be collapsed', () => {
      const node = createStringNode('field', 'test');
      const vm = new TestNodeVM(node, null);

      vm.collapse();

      expect(vm.isExpanded).toBe(false);
    });

    it('can be expanded', () => {
      const node = createStringNode('field', 'test');
      const vm = new TestNodeVM(node, null);
      vm.collapse();

      vm.expand();

      expect(vm.isExpanded).toBe(true);
    });

    it('toggles expanded state', () => {
      const node = createStringNode('field', 'test');
      const vm = new TestNodeVM(node, null);

      vm.toggleExpanded();
      expect(vm.isExpanded).toBe(false);

      vm.toggleExpanded();
      expect(vm.isExpanded).toBe(true);
    });
  });

  describe('focus', () => {
    it('starts not focused', () => {
      const node = createStringNode('field', 'test');
      const vm = new TestNodeVM(node, null);

      expect(vm.isFocused).toBe(false);
    });

    it('can be focused', () => {
      const node = createStringNode('field', 'test');
      const vm = new TestNodeVM(node, null);

      vm.setFocused(true);

      expect(vm.isFocused).toBe(true);
    });

    it('can be unfocused', () => {
      const node = createStringNode('field', 'test');
      const vm = new TestNodeVM(node, null);
      vm.setFocused(true);

      vm.setFocused(false);

      expect(vm.isFocused).toBe(false);
    });
  });
});
