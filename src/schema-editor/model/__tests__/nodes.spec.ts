import { ObjectNode } from '../node/ObjectNode';
import { ArrayNode } from '../node/ArrayNode';
import { StringNode } from '../node/StringNode';
import { NumberNode } from '../node/NumberNode';
import { BooleanNode } from '../node/BooleanNode';
import { RefNode } from '../node/RefNode';
import { NodeType } from '../node/NodeType';

describe('ObjectNode', () => {
  describe('construction', () => {
    it('creates node with id and name', () => {
      const node = new ObjectNode('obj-1', 'user');
      expect(node.id()).toBe('obj-1');
      expect(node.name()).toBe('user');
      expect(node.nodeType()).toBe(NodeType.Object);
    });

    it('creates node with children', () => {
      const child = new StringNode('str-1', 'name');
      const node = new ObjectNode('obj-1', 'user', [child]);
      expect(node.properties()).toHaveLength(1);
      expect(node.properties()[0]).toBe(child);
    });

    it('creates node with metadata', () => {
      const metadata = { description: 'A user object', deprecated: true };
      const node = new ObjectNode('obj-1', 'user', [], metadata);
      expect(node.metadata()).toEqual(metadata);
    });

    it('throws when id is empty', () => {
      expect(() => new ObjectNode('', 'user')).toThrow(
        'ObjectNode requires nodeId',
      );
    });
  });

  describe('type checks', () => {
    const node = new ObjectNode('obj-1', 'user');

    it('isObject returns true', () => {
      expect(node.isObject()).toBe(true);
    });

    it('isArray returns false', () => {
      expect(node.isArray()).toBe(false);
    });

    it('isPrimitive returns false', () => {
      expect(node.isPrimitive()).toBe(false);
    });

    it('isRef returns false', () => {
      expect(node.isRef()).toBe(false);
    });

    it('isNull returns false', () => {
      expect(node.isNull()).toBe(false);
    });
  });

  describe('child access', () => {
    it('child() returns matching child by name', () => {
      const child = new StringNode('str-1', 'email');
      const node = new ObjectNode('obj-1', 'user', [child]);
      expect(node.property('email')).toBe(child);
    });

    it('child() returns NULL_NODE for non-existent child', () => {
      const node = new ObjectNode('obj-1', 'user');
      expect(node.property('missing').isNull()).toBe(true);
    });

    it('items() returns NULL_NODE', () => {
      const node = new ObjectNode('obj-1', 'user');
      expect(node.items().isNull()).toBe(true);
    });
  });

  describe('mutations', () => {
    it('setName changes name', () => {
      const node = new ObjectNode('obj-1', 'user');
      node.setName('person');
      expect(node.name()).toBe('person');
    });

    it('setMetadata changes metadata', () => {
      const node = new ObjectNode('obj-1', 'user');
      const newMeta = { description: 'Updated' };
      node.setMetadata(newMeta);
      expect(node.metadata()).toEqual(newMeta);
    });

    it('addChild adds child to end', () => {
      const node = new ObjectNode('obj-1', 'user');
      const child = new StringNode('str-1', 'name');
      node.addProperty(child);
      expect(node.properties()).toContain(child);
    });

    it('removeChild removes child by name', () => {
      const child = new StringNode('str-1', 'name');
      const node = new ObjectNode('obj-1', 'user', [child]);
      node.removeProperty('name');
      expect(node.properties()).toHaveLength(0);
    });

    it('removeChild does nothing for non-existent name', () => {
      const child = new StringNode('str-1', 'name');
      const node = new ObjectNode('obj-1', 'user', [child]);
      node.removeProperty('missing');
      expect(node.properties()).toHaveLength(1);
    });

    it('removePropertyById removes child by id', () => {
      const child = new StringNode('str-1', 'name');
      const node = new ObjectNode('obj-1', 'user', [child]);
      node.removePropertyById('str-1');
      expect(node.properties()).toHaveLength(0);
    });

    it('removePropertyById does nothing for non-existent id', () => {
      const child = new StringNode('str-1', 'name');
      const node = new ObjectNode('obj-1', 'user', [child]);
      node.removePropertyById('missing');
      expect(node.properties()).toHaveLength(1);
    });

    it('replaceChild replaces existing child', () => {
      const child1 = new StringNode('str-1', 'name');
      const child2 = new NumberNode('num-1', 'name');
      const node = new ObjectNode('obj-1', 'user', [child1]);
      node.replaceProperty('name', child2);
      expect(node.properties()[0]).toBe(child2);
    });

    it('replaceChild does nothing for non-existent name', () => {
      const child1 = new StringNode('str-1', 'name');
      const child2 = new NumberNode('num-1', 'other');
      const node = new ObjectNode('obj-1', 'user', [child1]);
      node.replaceProperty('missing', child2);
      expect(node.properties()).toHaveLength(1);
      expect(node.properties()[0]).toBe(child1);
    });

    it('setChildren replaces all children', () => {
      const child1 = new StringNode('str-1', 'name');
      const child2 = new NumberNode('num-1', 'age');
      const node = new ObjectNode('obj-1', 'user', [child1]);
      node.setChildren([child2]);
      expect(node.properties()).toHaveLength(1);
      expect(node.properties()[0]).toBe(child2);
    });

    it('setItems is no-op', () => {
      const node = new ObjectNode('obj-1', 'user');
      node.setItems();
      expect(node.items().isNull()).toBe(true);
    });
  });

  describe('accessors', () => {
    it('formula returns undefined', () => {
      const node = new ObjectNode('obj-1', 'user');
      expect(node.formula()).toBeUndefined();
    });

    it('hasFormula returns false', () => {
      const node = new ObjectNode('obj-1', 'user');
      expect(node.hasFormula()).toBe(false);
    });

    it('defaultValue returns undefined', () => {
      const node = new ObjectNode('obj-1', 'user');
      expect(node.defaultValue()).toBeUndefined();
    });

    it('foreignKey returns undefined', () => {
      const node = new ObjectNode('obj-1', 'user');
      expect(node.foreignKey()).toBeUndefined();
    });
  });

  describe('ref()', () => {
    it('throws error', () => {
      const node = new ObjectNode('obj-1', 'user');
      expect(() => node.ref()).toThrow('ObjectNode has no ref');
    });
  });
});

describe('ArrayNode', () => {
  const createItemsNode = () => new StringNode('str-1', '');

  describe('construction', () => {
    it('creates node with id, name and items', () => {
      const items = createItemsNode();
      const node = new ArrayNode('arr-1', 'tags', items);
      expect(node.id()).toBe('arr-1');
      expect(node.name()).toBe('tags');
      expect(node.nodeType()).toBe(NodeType.Array);
      expect(node.items()).toBe(items);
    });

    it('creates node with metadata', () => {
      const items = createItemsNode();
      const metadata = { description: 'Tags list' };
      const node = new ArrayNode('arr-1', 'tags', items, metadata);
      expect(node.metadata()).toEqual(metadata);
    });

    it('throws when id is empty', () => {
      const items = createItemsNode();
      expect(() => new ArrayNode('', 'tags', items)).toThrow(
        'ArrayNode requires nodeId',
      );
    });
  });

  describe('type checks', () => {
    const node = new ArrayNode('arr-1', 'tags', createItemsNode());

    it('isObject returns false', () => {
      expect(node.isObject()).toBe(false);
    });

    it('isArray returns true', () => {
      expect(node.isArray()).toBe(true);
    });

    it('isPrimitive returns false', () => {
      expect(node.isPrimitive()).toBe(false);
    });

    it('isRef returns false', () => {
      expect(node.isRef()).toBe(false);
    });

    it('isNull returns false', () => {
      expect(node.isNull()).toBe(false);
    });
  });

  describe('child access', () => {
    it('child() returns NULL_NODE', () => {
      const node = new ArrayNode('arr-1', 'tags', createItemsNode());
      expect(node.property().isNull()).toBe(true);
    });

    it('items() returns items node', () => {
      const items = createItemsNode();
      const node = new ArrayNode('arr-1', 'tags', items);
      expect(node.items()).toBe(items);
    });

    it('children() returns array with items', () => {
      const items = createItemsNode();
      const node = new ArrayNode('arr-1', 'tags', items);
      expect(node.properties()).toEqual([items]);
    });
  });

  describe('mutations', () => {
    it('setName changes name', () => {
      const node = new ArrayNode('arr-1', 'tags', createItemsNode());
      node.setName('categories');
      expect(node.name()).toBe('categories');
    });

    it('setMetadata changes metadata', () => {
      const node = new ArrayNode('arr-1', 'tags', createItemsNode());
      const newMeta = { description: 'Updated' };
      node.setMetadata(newMeta);
      expect(node.metadata()).toEqual(newMeta);
    });

    it('setItems replaces items node', () => {
      const items1 = new StringNode('str-1', '');
      const items2 = new NumberNode('num-1', '');
      const node = new ArrayNode('arr-1', 'tags', items1);
      node.setItems(items2);
      expect(node.items()).toBe(items2);
    });

    it('addChild is no-op', () => {
      const node = new ArrayNode('arr-1', 'tags', createItemsNode());
      node.addProperty();
      expect(node.properties()).toHaveLength(1);
    });

    it('removeChild is no-op', () => {
      const items = createItemsNode();
      const node = new ArrayNode('arr-1', 'tags', items);
      node.removeProperty();
      expect(node.items()).toBe(items);
    });

    it('removePropertyById is no-op', () => {
      const items = createItemsNode();
      const node = new ArrayNode('arr-1', 'tags', items);
      node.removePropertyById();
      expect(node.items()).toBe(items);
    });

    it('replaceChild is no-op', () => {
      const items = createItemsNode();
      const node = new ArrayNode('arr-1', 'tags', items);
      node.replaceProperty();
      expect(node.items()).toBe(items);
    });
  });

  describe('accessors', () => {
    it('formula returns undefined', () => {
      const node = new ArrayNode('arr-1', 'tags', createItemsNode());
      expect(node.formula()).toBeUndefined();
    });

    it('hasFormula returns false', () => {
      const node = new ArrayNode('arr-1', 'tags', createItemsNode());
      expect(node.hasFormula()).toBe(false);
    });

    it('defaultValue returns undefined', () => {
      const node = new ArrayNode('arr-1', 'tags', createItemsNode());
      expect(node.defaultValue()).toBeUndefined();
    });

    it('foreignKey returns undefined', () => {
      const node = new ArrayNode('arr-1', 'tags', createItemsNode());
      expect(node.foreignKey()).toBeUndefined();
    });
  });

  describe('ref()', () => {
    it('throws error', () => {
      const node = new ArrayNode('arr-1', 'tags', createItemsNode());
      expect(() => node.ref()).toThrow('ArrayNode has no ref');
    });
  });
});

describe('StringNode', () => {
  describe('construction', () => {
    it('creates node with id and name', () => {
      const node = new StringNode('str-1', 'email');
      expect(node.id()).toBe('str-1');
      expect(node.name()).toBe('email');
      expect(node.nodeType()).toBe(NodeType.String);
    });

    it('creates node with options', () => {
      const node = new StringNode('str-1', 'email', {
        defaultValue: 'test@example.com',
        foreignKey: 'users',
        format: 'email',
        contentMediaType: 'text/plain',
        enumValues: ['a', 'b'],
      });
      expect(node.defaultValue()).toBe('test@example.com');
      expect(node.foreignKey()).toBe('users');
      expect(node.format()).toBe('email');
      expect(node.contentMediaType()).toBe('text/plain');
      expect(node.enumValues()).toEqual(['a', 'b']);
    });

    it('creates node with metadata', () => {
      const metadata = { description: 'Email address' };
      const node = new StringNode('str-1', 'email', {}, metadata);
      expect(node.metadata()).toEqual(metadata);
    });

    it('throws when id is empty', () => {
      expect(() => new StringNode('', 'email')).toThrow(
        'StringNode requires nodeId',
      );
    });
  });

  describe('type checks', () => {
    const node = new StringNode('str-1', 'email');

    it('isObject returns false', () => {
      expect(node.isObject()).toBe(false);
    });

    it('isArray returns false', () => {
      expect(node.isArray()).toBe(false);
    });

    it('isPrimitive returns true', () => {
      expect(node.isPrimitive()).toBe(true);
    });

    it('isRef returns false', () => {
      expect(node.isRef()).toBe(false);
    });

    it('isNull returns false', () => {
      expect(node.isNull()).toBe(false);
    });
  });

  describe('child access', () => {
    const node = new StringNode('str-1', 'email');

    it('child() returns NULL_NODE', () => {
      expect(node.property().isNull()).toBe(true);
    });

    it('items() returns NULL_NODE', () => {
      expect(node.items().isNull()).toBe(true);
    });

    it('children() returns empty array', () => {
      expect(node.properties()).toEqual([]);
    });
  });

  describe('formula', () => {
    it('hasFormula returns false when no formula', () => {
      const node = new StringNode('str-1', 'email');
      expect(node.hasFormula()).toBe(false);
      expect(node.formula()).toBeUndefined();
    });

    it('hasFormula returns true when formula is set', () => {
      const mockFormula = { expression: () => 'test' } as never;
      const node = new StringNode('str-1', 'email', { formula: mockFormula });
      expect(node.hasFormula()).toBe(true);
      expect(node.formula()).toBeDefined();
    });

    it('setFormula changes formula', () => {
      const node = new StringNode('str-1', 'email');
      const mockFormula = { expression: () => 'test' } as never;
      node.setFormula(mockFormula);
      expect(node.hasFormula()).toBe(true);
      expect(node.formula()).toBeDefined();
    });

    it('setFormula can clear formula', () => {
      const mockFormula = { expression: () => 'test' } as never;
      const node = new StringNode('str-1', 'email', { formula: mockFormula });
      node.setFormula(undefined);
      expect(node.hasFormula()).toBe(false);
    });
  });

  describe('mutations', () => {
    it('setName changes name', () => {
      const node = new StringNode('str-1', 'email');
      node.setName('mail');
      expect(node.name()).toBe('mail');
    });

    it('setMetadata changes metadata', () => {
      const node = new StringNode('str-1', 'email');
      const newMeta = { description: 'Updated' };
      node.setMetadata(newMeta);
      expect(node.metadata()).toEqual(newMeta);
    });

    it('setDefaultValue changes default', () => {
      const node = new StringNode('str-1', 'email');
      node.setDefaultValue('new@example.com');
      expect(node.defaultValue()).toBe('new@example.com');
    });

    it('setForeignKey changes foreignKey', () => {
      const node = new StringNode('str-1', 'userId');
      node.setForeignKey('users');
      expect(node.foreignKey()).toBe('users');
    });

    it('setFormat changes format', () => {
      const node = new StringNode('str-1', 'email');
      node.setFormat('email');
      expect(node.format()).toBe('email');
    });

    it('setContentMediaType changes contentMediaType', () => {
      const node = new StringNode('str-1', 'content');
      node.setContentMediaType('text/markdown');
      expect(node.contentMediaType()).toBe('text/markdown');
    });

    it('setEnumValues changes enumValues', () => {
      const node = new StringNode('str-1', 'status');
      node.setEnumValues(['active', 'inactive']);
      expect(node.enumValues()).toEqual(['active', 'inactive']);
    });

    it('addChild is no-op', () => {
      const node = new StringNode('str-1', 'email');
      node.addProperty();
      expect(node.properties()).toEqual([]);
    });

    it('removeChild is no-op', () => {
      const node = new StringNode('str-1', 'email');
      node.removeProperty();
      expect(node.properties()).toEqual([]);
    });

    it('removePropertyById is no-op', () => {
      const node = new StringNode('str-1', 'email');
      node.removePropertyById();
      expect(node.properties()).toEqual([]);
    });

    it('replaceChild is no-op', () => {
      const node = new StringNode('str-1', 'email');
      node.replaceProperty();
      expect(node.properties()).toEqual([]);
    });

    it('setItems is no-op', () => {
      const node = new StringNode('str-1', 'email');
      node.setItems();
      expect(node.items().isNull()).toBe(true);
    });
  });

  describe('ref()', () => {
    it('throws error', () => {
      const node = new StringNode('str-1', 'email');
      expect(() => node.ref()).toThrow('StringNode has no ref');
    });
  });
});

describe('NumberNode', () => {
  describe('construction', () => {
    it('creates node with id and name', () => {
      const node = new NumberNode('num-1', 'age');
      expect(node.id()).toBe('num-1');
      expect(node.name()).toBe('age');
      expect(node.nodeType()).toBe(NodeType.Number);
    });

    it('creates node with options', () => {
      const node = new NumberNode('num-1', 'age', { defaultValue: 25 });
      expect(node.defaultValue()).toBe(25);
    });

    it('creates node with metadata', () => {
      const metadata = { description: 'User age' };
      const node = new NumberNode('num-1', 'age', {}, metadata);
      expect(node.metadata()).toEqual(metadata);
    });

    it('throws when id is empty', () => {
      expect(() => new NumberNode('', 'age')).toThrow(
        'NumberNode requires nodeId',
      );
    });
  });

  describe('type checks', () => {
    const node = new NumberNode('num-1', 'age');

    it('isObject returns false', () => {
      expect(node.isObject()).toBe(false);
    });

    it('isArray returns false', () => {
      expect(node.isArray()).toBe(false);
    });

    it('isPrimitive returns true', () => {
      expect(node.isPrimitive()).toBe(true);
    });

    it('isRef returns false', () => {
      expect(node.isRef()).toBe(false);
    });

    it('isNull returns false', () => {
      expect(node.isNull()).toBe(false);
    });
  });

  describe('child access', () => {
    const node = new NumberNode('num-1', 'age');

    it('child() returns NULL_NODE', () => {
      expect(node.property().isNull()).toBe(true);
    });

    it('items() returns NULL_NODE', () => {
      expect(node.items().isNull()).toBe(true);
    });

    it('children() returns empty array', () => {
      expect(node.properties()).toEqual([]);
    });
  });

  describe('formula', () => {
    it('hasFormula returns false when no formula', () => {
      const node = new NumberNode('num-1', 'age');
      expect(node.hasFormula()).toBe(false);
      expect(node.formula()).toBeUndefined();
    });

    it('hasFormula returns true when formula is set', () => {
      const mockFormula = { expression: () => 'price * 2' } as never;
      const node = new NumberNode('num-1', 'total', { formula: mockFormula });
      expect(node.hasFormula()).toBe(true);
      expect(node.formula()).toBeDefined();
    });

    it('setFormula changes formula', () => {
      const node = new NumberNode('num-1', 'total');
      const mockFormula = { expression: () => 'price * 2' } as never;
      node.setFormula(mockFormula);
      expect(node.hasFormula()).toBe(true);
    });
  });

  describe('mutations', () => {
    it('setName changes name', () => {
      const node = new NumberNode('num-1', 'age');
      node.setName('years');
      expect(node.name()).toBe('years');
    });

    it('setMetadata changes metadata', () => {
      const node = new NumberNode('num-1', 'age');
      const newMeta = { description: 'Updated' };
      node.setMetadata(newMeta);
      expect(node.metadata()).toEqual(newMeta);
    });

    it('setDefaultValue changes default', () => {
      const node = new NumberNode('num-1', 'age');
      node.setDefaultValue(30);
      expect(node.defaultValue()).toBe(30);
    });

    it('addChild is no-op', () => {
      const node = new NumberNode('num-1', 'age');
      node.addProperty();
      expect(node.properties()).toEqual([]);
    });

    it('removeChild is no-op', () => {
      const node = new NumberNode('num-1', 'age');
      node.removeProperty();
      expect(node.properties()).toEqual([]);
    });

    it('removePropertyById is no-op', () => {
      const node = new NumberNode('num-1', 'age');
      node.removePropertyById();
      expect(node.properties()).toEqual([]);
    });

    it('replaceChild is no-op', () => {
      const node = new NumberNode('num-1', 'age');
      node.replaceProperty();
      expect(node.properties()).toEqual([]);
    });

    it('setItems is no-op', () => {
      const node = new NumberNode('num-1', 'age');
      node.setItems();
      expect(node.items().isNull()).toBe(true);
    });
  });

  describe('ref()', () => {
    it('throws error', () => {
      const node = new NumberNode('num-1', 'age');
      expect(() => node.ref()).toThrow('NumberNode has no ref');
    });
  });
});

describe('BooleanNode', () => {
  describe('construction', () => {
    it('creates node with id and name', () => {
      const node = new BooleanNode('bool-1', 'active');
      expect(node.id()).toBe('bool-1');
      expect(node.name()).toBe('active');
      expect(node.nodeType()).toBe(NodeType.Boolean);
    });

    it('creates node with options', () => {
      const node = new BooleanNode('bool-1', 'active', { defaultValue: true });
      expect(node.defaultValue()).toBe(true);
    });

    it('creates node with metadata', () => {
      const metadata = { description: 'Is active' };
      const node = new BooleanNode('bool-1', 'active', {}, metadata);
      expect(node.metadata()).toEqual(metadata);
    });

    it('throws when id is empty', () => {
      expect(() => new BooleanNode('', 'active')).toThrow(
        'BooleanNode requires nodeId',
      );
    });
  });

  describe('type checks', () => {
    const node = new BooleanNode('bool-1', 'active');

    it('isObject returns false', () => {
      expect(node.isObject()).toBe(false);
    });

    it('isArray returns false', () => {
      expect(node.isArray()).toBe(false);
    });

    it('isPrimitive returns true', () => {
      expect(node.isPrimitive()).toBe(true);
    });

    it('isRef returns false', () => {
      expect(node.isRef()).toBe(false);
    });

    it('isNull returns false', () => {
      expect(node.isNull()).toBe(false);
    });
  });

  describe('child access', () => {
    const node = new BooleanNode('bool-1', 'active');

    it('child() returns NULL_NODE', () => {
      expect(node.property().isNull()).toBe(true);
    });

    it('items() returns NULL_NODE', () => {
      expect(node.items().isNull()).toBe(true);
    });

    it('children() returns empty array', () => {
      expect(node.properties()).toEqual([]);
    });
  });

  describe('formula', () => {
    it('hasFormula returns false when no formula', () => {
      const node = new BooleanNode('bool-1', 'active');
      expect(node.hasFormula()).toBe(false);
      expect(node.formula()).toBeUndefined();
    });

    it('hasFormula returns true when formula is set', () => {
      const mockFormula = { expression: () => 'price > 0' } as never;
      const node = new BooleanNode('bool-1', 'hasPrice', {
        formula: mockFormula,
      });
      expect(node.hasFormula()).toBe(true);
      expect(node.formula()).toBeDefined();
    });

    it('setFormula changes formula', () => {
      const node = new BooleanNode('bool-1', 'hasPrice');
      const mockFormula = { expression: () => 'price > 0' } as never;
      node.setFormula(mockFormula);
      expect(node.hasFormula()).toBe(true);
    });
  });

  describe('mutations', () => {
    it('setName changes name', () => {
      const node = new BooleanNode('bool-1', 'active');
      node.setName('enabled');
      expect(node.name()).toBe('enabled');
    });

    it('setMetadata changes metadata', () => {
      const node = new BooleanNode('bool-1', 'active');
      const newMeta = { description: 'Updated' };
      node.setMetadata(newMeta);
      expect(node.metadata()).toEqual(newMeta);
    });

    it('setDefaultValue changes default', () => {
      const node = new BooleanNode('bool-1', 'active');
      node.setDefaultValue(true);
      expect(node.defaultValue()).toBe(true);
    });

    it('addChild is no-op', () => {
      const node = new BooleanNode('bool-1', 'active');
      node.addProperty();
      expect(node.properties()).toEqual([]);
    });

    it('removeChild is no-op', () => {
      const node = new BooleanNode('bool-1', 'active');
      node.removeProperty();
      expect(node.properties()).toEqual([]);
    });

    it('removePropertyById is no-op', () => {
      const node = new BooleanNode('bool-1', 'active');
      node.removePropertyById();
      expect(node.properties()).toEqual([]);
    });

    it('replaceChild is no-op', () => {
      const node = new BooleanNode('bool-1', 'active');
      node.replaceProperty();
      expect(node.properties()).toEqual([]);
    });

    it('setItems is no-op', () => {
      const node = new BooleanNode('bool-1', 'active');
      node.setItems();
      expect(node.items().isNull()).toBe(true);
    });
  });

  describe('ref()', () => {
    it('throws error', () => {
      const node = new BooleanNode('bool-1', 'active');
      expect(() => node.ref()).toThrow('BooleanNode has no ref');
    });
  });

  describe('accessors', () => {
    it('foreignKey returns undefined', () => {
      const node = new BooleanNode('bool-1', 'active');
      expect(node.foreignKey()).toBeUndefined();
    });
  });
});

describe('RefNode', () => {
  describe('construction', () => {
    it('creates node with id, name and ref', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      expect(node.id()).toBe('ref-1');
      expect(node.name()).toBe('file');
      expect(node.ref()).toBe('File');
      expect(node.nodeType()).toBe(NodeType.Ref);
    });

    it('creates node with metadata', () => {
      const metadata = { description: 'A file reference' };
      const node = new RefNode('ref-1', 'file', 'File', metadata);
      expect(node.metadata()).toEqual(metadata);
    });

    it('throws when id is empty', () => {
      expect(() => new RefNode('', 'file', 'File')).toThrow(
        'RefNode requires nodeId',
      );
    });

    it('throws when ref is empty', () => {
      expect(() => new RefNode('ref-1', 'file', '')).toThrow(
        'RefNode requires ref',
      );
    });
  });

  describe('type checks', () => {
    const node = new RefNode('ref-1', 'file', 'File');

    it('isObject returns false', () => {
      expect(node.isObject()).toBe(false);
    });

    it('isArray returns false', () => {
      expect(node.isArray()).toBe(false);
    });

    it('isPrimitive returns false', () => {
      expect(node.isPrimitive()).toBe(false);
    });

    it('isRef returns true', () => {
      expect(node.isRef()).toBe(true);
    });

    it('isNull returns false', () => {
      expect(node.isNull()).toBe(false);
    });
  });

  describe('child access', () => {
    const node = new RefNode('ref-1', 'file', 'File');

    it('child() returns NULL_NODE', () => {
      expect(node.property().isNull()).toBe(true);
    });

    it('items() returns NULL_NODE', () => {
      expect(node.items().isNull()).toBe(true);
    });

    it('children() returns empty array', () => {
      expect(node.properties()).toEqual([]);
    });
  });

  describe('mutations', () => {
    it('setName changes name', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      node.setName('document');
      expect(node.name()).toBe('document');
    });

    it('setMetadata changes metadata', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      const newMeta = { description: 'Updated' };
      node.setMetadata(newMeta);
      expect(node.metadata()).toEqual(newMeta);
    });

    it('setRef changes ref', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      node.setRef('Document');
      expect(node.ref()).toBe('Document');
    });

    it('addChild is no-op', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      node.addProperty();
      expect(node.properties()).toEqual([]);
    });

    it('removeChild is no-op', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      node.removeProperty();
      expect(node.properties()).toEqual([]);
    });

    it('removePropertyById is no-op', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      node.removePropertyById();
      expect(node.properties()).toEqual([]);
    });

    it('replaceChild is no-op', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      node.replaceProperty();
      expect(node.properties()).toEqual([]);
    });

    it('setItems is no-op', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      node.setItems();
      expect(node.items().isNull()).toBe(true);
    });
  });

  describe('accessors', () => {
    it('formula returns undefined', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      expect(node.formula()).toBeUndefined();
    });

    it('hasFormula returns false', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      expect(node.hasFormula()).toBe(false);
    });

    it('defaultValue returns undefined', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      expect(node.defaultValue()).toBeUndefined();
    });

    it('foreignKey returns undefined', () => {
      const node = new RefNode('ref-1', 'file', 'File');
      expect(node.foreignKey()).toBeUndefined();
    });
  });
});
