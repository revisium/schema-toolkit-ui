import { TreeMutator } from '../tree/TreeMutator';
import { NodeFactory } from '../node/NodeFactory';
import { EMPTY_PATH, jsonPointerToPath } from '../path';

describe('TreeMutator', () => {
  let mutator: TreeMutator;

  beforeEach(() => {
    mutator = new TreeMutator();
  });

  describe('setNodeAt()', () => {
    it('adds node at simple path', () => {
      const root = NodeFactory.object('root');
      const newNode = NodeFactory.string('field');

      mutator.setNodeAt(root, jsonPointerToPath('/properties/field'), newNode);

      expect(root.properties()).toHaveLength(1);
      expect(root.property('field').name()).toBe('field');
    });

    it('adds node at nested path', () => {
      const child = NodeFactory.object('parent');
      const root = NodeFactory.object('root', [child]);
      const newNode = NodeFactory.string('value');

      mutator.setNodeAt(
        root,
        jsonPointerToPath('/properties/parent/properties/value'),
        newNode,
      );

      expect(child.properties()).toHaveLength(1);
      expect(child.property('value').name()).toBe('value');
    });

    it('throws error when trying to replace root', () => {
      const root = NodeFactory.object('root');
      const newNode = NodeFactory.string('field');

      expect(() => mutator.setNodeAt(root, EMPTY_PATH, newNode)).toThrow(
        'Cannot replace root node',
      );
    });

    it('sets items on array node', () => {
      const arrayNode = NodeFactory.array('items', NodeFactory.string(''));
      const root = NodeFactory.object('root', [arrayNode]);
      const newItems = NodeFactory.object('');

      mutator.setNodeAt(
        root,
        jsonPointerToPath('/properties/items/items'),
        newItems,
      );

      expect(arrayNode.items().isObject()).toBe(true);
    });

    it('sets nested node in array items', () => {
      const itemsNode = NodeFactory.object('');
      const arrayNode = NodeFactory.array('items', itemsNode);
      const root = NodeFactory.object('root', [arrayNode]);
      const newField = NodeFactory.string('name');

      mutator.setNodeAt(
        root,
        jsonPointerToPath('/properties/items/items/properties/name'),
        newField,
      );

      expect(itemsNode.property('name').name()).toBe('name');
    });

    it('does nothing if intermediate path does not exist', () => {
      const root = NodeFactory.object('root');
      const newNode = NodeFactory.string('value');

      mutator.setNodeAt(
        root,
        jsonPointerToPath('/properties/nonexistent/properties/value'),
        newNode,
      );

      expect(root.properties()).toHaveLength(0);
    });

    it('replaces existing node preserving order', () => {
      const first = NodeFactory.string('first');
      const second = NodeFactory.string('second');
      const third = NodeFactory.string('third');
      const root = NodeFactory.object('root', [first, second, third]);

      const replacement = NodeFactory.number('second');
      mutator.setNodeAt(
        root,
        jsonPointerToPath('/properties/second'),
        replacement,
      );

      expect(root.properties()).toHaveLength(3);
      const names = root.properties().map((c) => c.name());
      expect(names).toEqual(['first', 'second', 'third']);
      expect(root.property('second').nodeType()).toBe('number');
    });
  });

  describe('removeNodeAt()', () => {
    it('removes node at simple path', () => {
      const child = NodeFactory.string('field');
      const root = NodeFactory.object('root', [child]);

      mutator.removeNodeAt(root, jsonPointerToPath('/properties/field'));

      expect(root.properties()).toHaveLength(0);
    });

    it('removes node at nested path', () => {
      const nestedChild = NodeFactory.string('value');
      const parent = NodeFactory.object('parent', [nestedChild]);
      const root = NodeFactory.object('root', [parent]);

      mutator.removeNodeAt(
        root,
        jsonPointerToPath('/properties/parent/properties/value'),
      );

      expect(parent.properties()).toHaveLength(0);
      expect(root.property('parent').properties()).toHaveLength(0);
    });

    it('throws error when trying to remove root', () => {
      const root = NodeFactory.object('root');

      expect(() => mutator.removeNodeAt(root, EMPTY_PATH)).toThrow(
        'Cannot remove root node',
      );
    });

    it('removes items from array node', () => {
      const itemsNode = NodeFactory.string('');
      const arrayNode = NodeFactory.array('items', itemsNode);
      const root = NodeFactory.object('root', [arrayNode]);

      mutator.removeNodeAt(root, jsonPointerToPath('/properties/items/items'));

      expect(arrayNode.items().isNull()).toBe(true);
    });

    it('removes nested node from array items', () => {
      const nestedChild = NodeFactory.string('name');
      const itemsNode = NodeFactory.object('', [nestedChild]);
      const arrayNode = NodeFactory.array('items', itemsNode);
      const root = NodeFactory.object('root', [arrayNode]);

      mutator.removeNodeAt(
        root,
        jsonPointerToPath('/properties/items/items/properties/name'),
      );

      expect(itemsNode.properties()).toHaveLength(0);
    });

    it('does nothing if path does not exist', () => {
      const root = NodeFactory.object('root');

      mutator.removeNodeAt(root, jsonPointerToPath('/properties/nonexistent'));

      expect(root.properties()).toHaveLength(0);
    });

    it('does nothing if intermediate node does not exist', () => {
      const root = NodeFactory.object('root');

      mutator.removeNodeAt(
        root,
        jsonPointerToPath('/properties/parent/properties/child'),
      );

      expect(root.properties()).toHaveLength(0);
    });

    it('does nothing if array items do not exist', () => {
      const arrayNode = NodeFactory.array('items', NodeFactory.string(''));
      const root = NodeFactory.object('root', [arrayNode]);

      mutator.removeNodeAt(
        root,
        jsonPointerToPath('/properties/items/items/properties/nonexistent'),
      );
    });
  });
});
