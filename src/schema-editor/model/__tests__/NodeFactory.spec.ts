import { NodeFactory } from '../factory/NodeFactory';
import { NodeType } from '../node/NodeType';

describe('NodeFactory', () => {
  describe('string()', () => {
    it('creates StringNode with name', () => {
      const node = NodeFactory.string('email');
      expect(node.name()).toBe('email');
      expect(node.nodeType()).toBe(NodeType.String);
      expect(node.id()).toBeTruthy();
    });

    it('creates StringNode with unique id', () => {
      const node1 = NodeFactory.string('a');
      const node2 = NodeFactory.string('b');
      expect(node1.id()).not.toBe(node2.id());
    });

    it('creates StringNode with foreignKey option', () => {
      const node = NodeFactory.string('userId', { foreignKey: 'users' });
      expect(node.foreignKey()).toBe('users');
    });

    it('creates StringNode with contentMediaType option', () => {
      const node = NodeFactory.string('content', {
        contentMediaType: 'text/markdown',
      });
      expect(node.contentMediaType()).toBe('text/markdown');
    });

    it('creates StringNode with both options', () => {
      const node = NodeFactory.string('data', {
        foreignKey: 'items',
        contentMediaType: 'application/json',
      });
      expect(node.foreignKey()).toBe('items');
      expect(node.contentMediaType()).toBe('application/json');
    });

    it('creates StringNode without options', () => {
      const node = NodeFactory.string('name');
      expect(node.foreignKey()).toBeUndefined();
      expect(node.contentMediaType()).toBeUndefined();
    });
  });

  describe('number()', () => {
    it('creates NumberNode with name', () => {
      const node = NodeFactory.number('age');
      expect(node.name()).toBe('age');
      expect(node.nodeType()).toBe(NodeType.Number);
      expect(node.id()).toBeTruthy();
    });

    it('creates NumberNode with unique id', () => {
      const node1 = NodeFactory.number('a');
      const node2 = NodeFactory.number('b');
      expect(node1.id()).not.toBe(node2.id());
    });
  });

  describe('boolean()', () => {
    it('creates BooleanNode with name', () => {
      const node = NodeFactory.boolean('active');
      expect(node.name()).toBe('active');
      expect(node.nodeType()).toBe(NodeType.Boolean);
      expect(node.id()).toBeTruthy();
    });

    it('creates BooleanNode with unique id', () => {
      const node1 = NodeFactory.boolean('a');
      const node2 = NodeFactory.boolean('b');
      expect(node1.id()).not.toBe(node2.id());
    });
  });

  describe('object()', () => {
    it('creates ObjectNode with name', () => {
      const node = NodeFactory.object('user');
      expect(node.name()).toBe('user');
      expect(node.nodeType()).toBe(NodeType.Object);
      expect(node.id()).toBeTruthy();
    });

    it('creates ObjectNode with empty children by default', () => {
      const node = NodeFactory.object('user');
      expect(node.properties()).toEqual([]);
    });

    it('creates ObjectNode with children', () => {
      const child1 = NodeFactory.string('name');
      const child2 = NodeFactory.number('age');
      const node = NodeFactory.object('user', [child1, child2]);
      expect(node.properties()).toHaveLength(2);
      expect(node.properties()[0]).toBe(child1);
      expect(node.properties()[1]).toBe(child2);
    });

    it('creates ObjectNode with unique id', () => {
      const node1 = NodeFactory.object('a');
      const node2 = NodeFactory.object('b');
      expect(node1.id()).not.toBe(node2.id());
    });
  });

  describe('array()', () => {
    it('creates ArrayNode with name and items', () => {
      const items = NodeFactory.string('');
      const node = NodeFactory.array('tags', items);
      expect(node.name()).toBe('tags');
      expect(node.nodeType()).toBe(NodeType.Array);
      expect(node.items()).toBe(items);
      expect(node.id()).toBeTruthy();
    });

    it('creates ArrayNode with object items', () => {
      const items = NodeFactory.object('');
      const node = NodeFactory.array('users', items);
      expect(node.items()).toBe(items);
      expect(node.items().isObject()).toBe(true);
    });

    it('creates ArrayNode with unique id', () => {
      const items = NodeFactory.string('');
      const node1 = NodeFactory.array('a', items);
      const node2 = NodeFactory.array('b', items);
      expect(node1.id()).not.toBe(node2.id());
    });
  });

  describe('ref()', () => {
    it('creates RefNode with name and $ref', () => {
      const node = NodeFactory.ref('file', { $ref: 'File' });
      expect(node.name()).toBe('file');
      expect(node.ref()).toBe('File');
      expect(node.nodeType()).toBe(NodeType.Ref);
      expect(node.id()).toBeTruthy();
    });

    it('creates RefNode with unique id', () => {
      const node1 = NodeFactory.ref('a', { $ref: 'File' });
      const node2 = NodeFactory.ref('b', { $ref: 'File' });
      expect(node1.id()).not.toBe(node2.id());
    });
  });

  describe('complex structures', () => {
    it('creates nested object structure', () => {
      const address = NodeFactory.object('address', [
        NodeFactory.string('street'),
        NodeFactory.string('city'),
      ]);
      const user = NodeFactory.object('user', [
        NodeFactory.string('name'),
        address,
      ]);

      expect(user.properties()).toHaveLength(2);
      expect(user.property('address').isObject()).toBe(true);
      expect(user.property('address').properties()).toHaveLength(2);
    });

    it('creates array of objects structure', () => {
      const itemSchema = NodeFactory.object('', [
        NodeFactory.string('name'),
        NodeFactory.number('price'),
      ]);
      const items = NodeFactory.array('items', itemSchema);

      expect(items.isArray()).toBe(true);
      expect(items.items().isObject()).toBe(true);
      expect(items.items().properties()).toHaveLength(2);
    });

    it('creates deeply nested structure', () => {
      const leaf = NodeFactory.string('value');
      const level2 = NodeFactory.object('level2', [leaf]);
      const level1 = NodeFactory.array('level1', level2);
      const root = NodeFactory.object('root', [level1]);

      expect(root.property('level1').isArray()).toBe(true);
      expect(root.property('level1').items().isObject()).toBe(true);
      expect(root.property('level1').items().property('value').nodeType()).toBe(
        NodeType.String,
      );
    });
  });
});
