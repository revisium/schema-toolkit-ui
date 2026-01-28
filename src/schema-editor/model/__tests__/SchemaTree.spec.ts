import { SchemaTree } from '../tree/SchemaTree';
import { SchemaParser, resetIdCounter } from '../schema/SchemaParser';
import { NodeFactory } from '../node/NodeFactory';
import { ParsedFormula } from '../formula/ParsedFormula';
import { NumberNode } from '../node/NumberNode';
import {
  createSchema,
  numberField,
  objectField,
  stringField,
  arrayField,
  formulaField,
  withDescription,
} from './test-helpers';

beforeEach(() => {
  resetIdCounter();
});

const createTree = (properties: Record<string, unknown>): SchemaTree => {
  const schema = createSchema(properties);
  const parser = new SchemaParser();
  const root = parser.parse(schema);
  return new SchemaTree(root);
};

describe('SchemaTree', () => {
  describe('nodeById', () => {
    it('returns root node by id', () => {
      const tree = createTree({ name: stringField() });
      const root = tree.root();
      expect(tree.nodeById(root.id())).toBe(root);
    });

    it('returns child node by id', () => {
      const tree = createTree({ name: stringField() });
      const nameNode = tree.root().properties()[0];
      expect(tree.nodeById(nameNode.id()).name()).toBe('name');
    });

    it('returns NULL_NODE for unknown id', () => {
      const tree = createTree({ name: stringField() });
      const result = tree.nodeById('unknown-id');
      expect(result.isNull()).toBe(true);
    });
  });

  describe('pathOf', () => {
    it('returns empty path for root', () => {
      const tree = createTree({ name: stringField() });
      const path = tree.pathOf(tree.root().id());
      expect(path.isEmpty()).toBe(true);
    });

    it('returns correct path for child', () => {
      const tree = createTree({ name: stringField() });
      const nameNode = tree.root().properties()[0];
      const path = tree.pathOf(nameNode.id());
      expect(path.asJsonPointer()).toBe('/properties/name');
    });

    it('returns correct path for nested child', () => {
      const tree = createTree({
        user: objectField({
          address: objectField({
            city: stringField(),
          }),
        }),
      });
      const userNode = tree.root().properties()[0];
      const addressNode = userNode.properties()[0];
      const cityNode = addressNode.properties()[0];

      expect(tree.pathOf(cityNode.id()).asJsonPointer()).toBe(
        '/properties/user/properties/address/properties/city',
      );
    });
  });

  describe('renameNode', () => {
    it('renames a field', () => {
      const tree = createTree({ name: stringField() });
      const nameNode = tree.root().properties()[0];

      tree.renameNode(nameNode.id(), 'title');

      expect(nameNode.name()).toBe('title');
      expect(tree.root().property('title').isNull()).toBe(false);
      expect(tree.root().property('name').isNull()).toBe(true);
    });

    it('updates path index after rename', () => {
      const tree = createTree({ name: stringField() });
      const nameNode = tree.root().properties()[0];

      tree.renameNode(nameNode.id(), 'title');

      const path = tree.pathOf(nameNode.id());
      expect(path.asJsonPointer()).toBe('/properties/title');
    });

    it('preserves field order after rename', () => {
      const tree = createTree({
        first: stringField(),
        second: numberField(),
        third: stringField(),
      });

      const secondNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'second')!;
      tree.renameNode(secondNode.id(), 'renamed');

      const names = tree
        .root()
        .properties()
        .map((c) => c.name());
      expect(names).toEqual(['first', 'renamed', 'third']);
    });
  });

  describe('addChildTo', () => {
    it('adds child to object node', () => {
      const tree = createTree({ existing: stringField() });
      const newNode = NodeFactory.string('newField');

      tree.addChildTo(tree.root().id(), newNode);

      expect(tree.root().properties()).toHaveLength(2);
      expect(tree.root().property('newField').isNull()).toBe(false);
    });

    it('indexes new node', () => {
      const tree = createTree({ existing: stringField() });
      const newNode = NodeFactory.string('newField');

      tree.addChildTo(tree.root().id(), newNode);

      expect(tree.nodeById(newNode.id()).isNull()).toBe(false);
      expect(tree.pathOf(newNode.id()).asJsonPointer()).toBe(
        '/properties/newField',
      );
    });

    it('does nothing for non-object node', () => {
      const tree = createTree({ name: stringField() });
      const nameNode = tree.root().properties()[0];
      const newNode = NodeFactory.string('child');

      tree.addChildTo(nameNode.id(), newNode);

      expect(tree.nodeById(newNode.id()).isNull()).toBe(true);
    });
  });

  describe('removeNodeAt', () => {
    it('removes node at path', () => {
      const tree = createTree({ name: stringField(), age: numberField() });
      const nameNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'name')!;
      const path = tree.pathOf(nameNode.id());

      tree.removeNodeAt(path);

      expect(tree.root().properties()).toHaveLength(1);
      expect(tree.root().property('name').isNull()).toBe(true);
    });

    it('removes node from index', () => {
      const tree = createTree({ name: stringField() });
      const nameNode = tree.root().properties()[0];
      const nodeId = nameNode.id();
      const path = tree.pathOf(nodeId);

      tree.removeNodeAt(path);

      expect(tree.nodeById(nodeId).isNull()).toBe(true);
    });
  });

  describe('canMoveNode', () => {
    it('returns false when moving to self', () => {
      const tree = createTree({ name: stringField() });
      const nameNode = tree.root().properties()[0];

      expect(tree.canMoveNode(nameNode.id(), nameNode.id())).toBe(false);
    });

    it('returns false when target is not object', () => {
      const tree = createTree({ name: stringField(), age: numberField() });
      const nameNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'name')!;
      const ageNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'age')!;

      expect(tree.canMoveNode(nameNode.id(), ageNode.id())).toBe(false);
    });

    it('returns false when moving parent to child (cycle)', () => {
      const tree = createTree({
        parent: objectField({
          child: objectField({}),
        }),
      });
      const parentNode = tree.root().properties()[0];
      const childNode = parentNode.properties()[0];

      expect(tree.canMoveNode(parentNode.id(), childNode.id())).toBe(false);
    });

    it('returns false when moving to current parent', () => {
      const tree = createTree({
        parent: objectField({
          child: stringField(),
        }),
      });
      const parentNode = tree.root().properties()[0];
      const childNode = parentNode.properties()[0];

      expect(tree.canMoveNode(childNode.id(), parentNode.id())).toBe(false);
    });

    it('returns false when moving top-level node to root', () => {
      const tree = createTree({
        name: stringField(),
        container: objectField({}),
      });
      const nameNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'name')!;

      expect(tree.canMoveNode(nameNode.id(), tree.root().id())).toBe(false);
    });

    it('returns true for valid move', () => {
      const tree = createTree({
        name: stringField(),
        container: objectField({}),
      });
      const nameNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'name')!;
      const containerNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'container')!;

      expect(tree.canMoveNode(nameNode.id(), containerNode.id())).toBe(true);
    });

    it('returns true when moving to array items that is an object', () => {
      const tree = createTree({
        name: stringField(),
        arr: arrayField(objectField({})),
      });
      const nameNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'name')!;
      const arrNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'arr')!;
      const itemsNode = arrNode.items();

      expect(itemsNode.isObject()).toBe(true);
      expect(tree.canMoveNode(nameNode.id(), itemsNode.id())).toBe(true);
    });

    it('returns false when moving to array items that is not an object', () => {
      const tree = createTree({
        name: stringField(),
        arr: arrayField(stringField()),
      });
      const nameNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'name')!;
      const arrNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'arr')!;
      const itemsNode = arrNode.items();

      expect(itemsNode.isObject()).toBe(false);
      expect(tree.canMoveNode(nameNode.id(), itemsNode.id())).toBe(false);
    });
  });

  describe('moveNode', () => {
    it('moves node to different parent', () => {
      const tree = createTree({
        name: stringField(),
        container: objectField({}),
      });
      const nameNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'name')!;
      const containerNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'container')!;

      tree.moveNode(nameNode.id(), containerNode.id());

      expect(tree.root().property('name').isNull()).toBe(true);
      expect(containerNode.property('name').isNull()).toBe(false);
    });

    it('updates path after move', () => {
      const tree = createTree({
        name: stringField(),
        container: objectField({}),
      });
      const nameNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'name')!;
      const containerNode = tree
        .root()
        .properties()
        .find((c) => c.name() === 'container')!;

      tree.moveNode(nameNode.id(), containerNode.id());

      const newPath = tree.pathOf(nameNode.id());
      expect(newPath.asJsonPointer()).toBe(
        '/properties/container/properties/name',
      );
    });
  });

  describe('countNodes', () => {
    it('counts single root with one child', () => {
      const tree = createTree({ name: stringField() });
      expect(tree.countNodes()).toBe(2);
    });

    it('counts nested structure', () => {
      const tree = createTree({
        user: objectField({
          name: stringField(),
          age: numberField(),
        }),
      });
      expect(tree.countNodes()).toBe(4);
    });

    it('counts array items', () => {
      const tree = createTree({
        items: arrayField(stringField()),
      });
      expect(tree.countNodes()).toBe(3);
    });
  });
});

describe('SchemaParser', () => {
  describe('pendingFormulas', () => {
    it('collects formula from array items', () => {
      const schema = createSchema({
        value: numberField(),
        num: arrayField(
          withDescription(formulaField('value * 2'), 'test description'),
        ),
      });
      const parser = new SchemaParser();
      parser.parse(schema);
      const pending = parser.getPendingFormulas();

      expect(pending).toHaveLength(1);
      expect(pending[0].expression).toBe('value * 2');
    });

    it('collects formula from regular field', () => {
      const schema = createSchema({
        value: numberField(),
        computed: formulaField('value * 2'),
      });
      const parser = new SchemaParser();
      parser.parse(schema);
      const pending = parser.getPendingFormulas();

      expect(pending).toHaveLength(1);
      expect(pending[0].expression).toBe('value * 2');
    });

    it('pending formula nodeId matches items node id', () => {
      const schema = createSchema({
        value: numberField(),
        num: arrayField(
          withDescription(formulaField('value * 2'), 'test description'),
        ),
      });
      const parser = new SchemaParser();
      const root = parser.parse(schema);
      const pending = parser.getPendingFormulas();

      const numNode = root.properties().find((c) => c.name() === 'num');
      expect(numNode).toBeDefined();
      expect(numNode!.isArray()).toBe(true);

      const itemsNode = numNode!.items();
      expect(itemsNode.isNull()).toBe(false);
      expect(itemsNode.nodeType()).toBe('number');

      expect(pending[0].nodeId).toBe(itemsNode.id());
    });

    it('items node is indexed in SchemaTree', () => {
      const schema = createSchema({
        value: numberField(),
        num: arrayField(
          withDescription(formulaField('value * 2'), 'test description'),
        ),
      });
      const parser = new SchemaParser();
      const root = parser.parse(schema);

      const tree = new SchemaTree(root);

      const numNode = root.properties().find((c) => c.name() === 'num');
      const itemsNode = numNode!.items();

      const indexedNode = tree.nodeById(itemsNode.id());
      expect(indexedNode.isNull()).toBe(false);
      expect(indexedNode.nodeType()).toBe('number');
    });

    it('items node path is correct', () => {
      const schema = createSchema({
        value: numberField(),
        num: arrayField(
          withDescription(formulaField('value * 2'), 'test description'),
        ),
      });
      const parser = new SchemaParser();
      const root = parser.parse(schema);

      const tree = new SchemaTree(root);

      const numNode = root.properties().find((c) => c.name() === 'num');
      const itemsNode = numNode!.items();

      const itemsPath = tree.pathOf(itemsNode.id());
      expect(itemsPath.isEmpty()).toBe(false);
      expect(itemsPath.asJsonPointer()).toBe('/properties/num/items');
    });

    it('ParsedFormula works for items node', () => {
      const schema = createSchema({
        value: numberField(),
        num: arrayField(numberField()),
      });
      const parser = new SchemaParser();
      const root = parser.parse(schema);

      const tree = new SchemaTree(root);

      const numNode = root.properties().find((c) => c.name() === 'num');
      const itemsNode = numNode!.items();

      const formula = new ParsedFormula(tree, itemsNode.id(), 'value * 2');
      expect(formula.expression()).toBe('value * 2');
      (itemsNode as NumberNode).setFormula(formula);
      expect((itemsNode as NumberNode).hasFormula()).toBe(true);
    });
  });
});
