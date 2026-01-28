import { SchemaEngine } from '../engine/SchemaEngine';
import { resetIdCounter } from '../schema/SchemaParser';
import { FormulaSerializer } from '../formula';
import type { JsonObjectSchema } from '../schema/JsonSchema';

beforeEach(() => {
  resetIdCounter();
});

describe('SchemaEngine', () => {
  const createSchema = (
    properties: Record<string, unknown> = {},
  ): JsonObjectSchema => ({
    type: 'object',
    properties: properties as JsonObjectSchema['properties'],
    additionalProperties: false,
    required: Object.keys(properties),
  });

  describe('initialization', () => {
    it('should create engine from schema', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);

      expect(engine.root().isObject()).toBe(true);
      expect(engine.root().properties()).toHaveLength(1);
    });

    it('should parse formulas during initialization', () => {
      const schema = createSchema({
        price: { type: 'number', default: 0 },
        quantity: { type: 'number', default: 0 },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * quantity' },
        },
      });

      const engine = new SchemaEngine(schema);
      const totalNode = engine.root().property('total');

      expect(totalNode.hasFormula()).toBe(true);
      const formula = totalNode.formula();
      expect(formula).toBeDefined();
      if (formula) {
        const expression = new FormulaSerializer(
          engine.tree,
          totalNode.id(),
          formula,
        ).serialize();
        expect(expression).toBe('price * quantity');
      }
    });

    it('should ignore invalid formulas during initialization', () => {
      const schema = createSchema({
        value: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'invalid +++' },
        },
      });

      const engine = new SchemaEngine(schema);
      const valueNode = engine.root().property('value');

      expect(valueNode.hasFormula()).toBe(false);
    });
  });

  describe('validation', () => {
    it('should return isValid true when schema has properties', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);

      expect(engine.isValid).toBe(true);
    });

    it('should return isValid false when schema has no properties', () => {
      const schema = createSchema({});

      const engine = new SchemaEngine(schema);

      expect(engine.isValid).toBe(false);
    });

    it('should return validation errors for empty field names', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);
      const nameNode = engine.root().property('name');
      nameNode.setName('');

      const errors = engine.validationErrors;

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.type === 'empty-name')).toBe(true);
    });

    it('should validate formula dependencies', () => {
      const schema = createSchema({
        a: { type: 'number', default: 0 },
        b: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'a + 1' },
        },
      });

      const engine = new SchemaEngine(schema);
      const errors = engine.validateFormulas();

      expect(errors).toHaveLength(0);
    });
  });

  describe('dirty state', () => {
    it('should not be dirty initially', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);

      expect(engine.isDirty).toBe(false);
    });

    it('should be dirty after tree modification', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);
      engine.tree.renameNode(engine.root().property('name').id(), 'title');

      expect(engine.isDirty).toBe(true);
    });
  });

  describe('markAsSaved', () => {
    it('should clear dirty state', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);
      engine.tree.renameNode(engine.root().property('name').id(), 'title');
      expect(engine.isDirty).toBe(true);

      engine.markAsSaved();

      expect(engine.isDirty).toBe(false);
    });
  });

  describe('revert', () => {
    it('should restore original schema', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);
      engine.tree.renameNode(engine.root().property('name').id(), 'title');
      expect(engine.root().property('title').isNull()).toBe(false);

      engine.revert();

      expect(engine.root().property('name').isNull()).toBe(false);
      expect(engine.root().property('title').isNull()).toBe(true);
      expect(engine.isDirty).toBe(false);
    });

    it('should restore formulas after revert', () => {
      const schema = createSchema({
        price: { type: 'number', default: 0 },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * 2' },
        },
      });

      const engine = new SchemaEngine(schema);
      const totalId = engine.root().property('total').id();

      engine.tree.unregisterFormula(totalId);
      engine.root().property('total').setFormula(undefined);

      engine.revert();

      const totalNode = engine.root().property('total');
      expect(totalNode.hasFormula()).toBe(true);
      const formula = totalNode.formula();
      expect(formula).toBeDefined();
      if (formula) {
        const expression = new FormulaSerializer(
          engine.tree,
          totalNode.id(),
          formula,
        ).serialize();
        expect(expression).toBe('price * 2');
      }
    });
  });

  describe('patches', () => {
    it('should return empty patches when not modified', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);

      expect(engine.getPatches()).toHaveLength(0);
    });

    it('should return patches after modification', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);
      engine.tree.renameNode(engine.root().property('name').id(), 'title');

      const patches = engine.getPatches();

      expect(patches.length).toBeGreaterThan(0);
    });

    it('should return patches with metadata (fieldName, isRename, etc.)', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);
      engine.tree.renameNode(engine.root().property('name').id(), 'title');

      const patches = engine.getPatches();

      expect(patches.length).toBeGreaterThan(0);
      expect(patches[0].fieldName).toBeDefined();
    });
  });

  describe('getPlainSchema', () => {
    it('should return current schema state', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const engine = new SchemaEngine(schema);
      engine.tree.renameNode(engine.root().property('name').id(), 'title');

      const plainSchema = engine.getPlainSchema();

      expect(plainSchema.properties).toHaveProperty('title');
      expect(plainSchema.properties).not.toHaveProperty('name');
    });
  });

  describe('countNodes', () => {
    it('should count all nodes in tree', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
        age: { type: 'number', default: 0 },
      });

      const engine = new SchemaEngine(schema);

      expect(engine.countNodes()).toBe(3);
    });
  });

  describe('getFormulaDependents', () => {
    it('should return dependents for a node', () => {
      const schema = createSchema({
        price: { type: 'number', default: 0 },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * 2' },
        },
      });

      const engine = new SchemaEngine(schema);
      const priceId = engine.root().property('price').id();

      const dependents = engine.getFormulaDependents(priceId);

      expect(dependents).toHaveLength(1);
      expect(dependents[0].fieldName).toBe('total');
    });
  });

  describe('addChild', () => {
    it('should add string child to object', () => {
      const schema = createSchema({
        existing: { type: 'string', default: '' },
      });
      const engine = new SchemaEngine(schema);

      const result = engine.addChild(engine.root().id(), 'newField');

      expect(result.isNull()).toBe(false);
      expect(result.name()).toBe('newField');
      expect(engine.root().property('newField').isNull()).toBe(false);
    });

    it('should return null node when parent is not object', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const engine = new SchemaEngine(schema);
      const nameId = engine.root().property('name').id();

      const result = engine.addChild(nameId, 'child');

      expect(result.isNull()).toBe(true);
    });

    it('should return null node when parent not found', () => {
      const schema = createSchema({});
      const engine = new SchemaEngine(schema);

      const result = engine.addChild('non-existent', 'child');

      expect(result.isNull()).toBe(true);
    });
  });

  describe('removeNode', () => {
    it('should remove node from tree', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
        age: { type: 'number', default: 0 },
      });
      const engine = new SchemaEngine(schema);
      const nameId = engine.root().property('name').id();

      const removed = engine.removeNode(nameId);

      expect(removed).toBe(true);
      expect(engine.root().property('name').isNull()).toBe(true);
      expect(engine.root().properties()).toHaveLength(1);
    });

    it('should return false when node not found', () => {
      const schema = createSchema({});
      const engine = new SchemaEngine(schema);

      const removed = engine.removeNode('non-existent');

      expect(removed).toBe(false);
    });

    it('should return false when trying to remove root', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const engine = new SchemaEngine(schema);

      const removed = engine.removeNode(engine.root().id());

      expect(removed).toBe(false);
    });
  });

  describe('replaceNode', () => {
    it('should replace node with new node', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const engine = new SchemaEngine(schema);
      const nameId = engine.root().property('name').id();
      const newNode = engine.createNumberNode('name');

      const result = engine.replaceNode(nameId, newNode);

      expect(result).not.toBeNull();
      expect(result?.replacedNodeId).toBe(nameId);
      expect(result?.newNodeId).toBe(newNode.id());
      expect(engine.root().property('name').nodeType()).toBe('number');
    });

    it('should preserve field order', () => {
      const schema = createSchema({
        first: { type: 'string', default: '' },
        second: { type: 'string', default: '' },
        third: { type: 'string', default: '' },
      });
      const engine = new SchemaEngine(schema);
      const secondId = engine.root().property('second').id();
      const newNode = engine.createNumberNode('second');

      engine.replaceNode(secondId, newNode);

      const names = engine
        .root()
        .properties()
        .map((c) => c.name());
      expect(names).toEqual(['first', 'second', 'third']);
    });

    it('should return null when node not found', () => {
      const schema = createSchema({});
      const engine = new SchemaEngine(schema);
      const newNode = engine.createStringNode('test');

      const result = engine.replaceNode('non-existent', newNode);

      expect(result).toBeNull();
    });
  });

  describe('wrapInArray', () => {
    it('should wrap node in array', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const engine = new SchemaEngine(schema);
      const nameId = engine.root().property('name').id();

      const result = engine.wrapInArray(nameId);

      expect(result).not.toBeNull();
      expect(result?.replacedNodeId).toBe(nameId);
      const nameNode = engine.root().property('name');
      expect(nameNode.isArray()).toBe(true);
      expect(nameNode.items().nodeType()).toBe('string');
    });

    it('should preserve field order', () => {
      const schema = createSchema({
        first: { type: 'string', default: '' },
        second: { type: 'string', default: '' },
        third: { type: 'string', default: '' },
      });
      const engine = new SchemaEngine(schema);
      const secondId = engine.root().property('second').id();

      engine.wrapInArray(secondId);

      const names = engine
        .root()
        .properties()
        .map((c) => c.name());
      expect(names).toEqual(['first', 'second', 'third']);
    });

    it('should return null when node not found', () => {
      const schema = createSchema({});
      const engine = new SchemaEngine(schema);

      const result = engine.wrapInArray('non-existent');

      expect(result).toBeNull();
    });

    it('should return null when node is already array', () => {
      const schema = createSchema({
        items: {
          type: 'array',
          items: { type: 'string', default: '' },
          default: [],
        },
      });
      const engine = new SchemaEngine(schema);
      const itemsId = engine.root().property('items').id();

      const result = engine.wrapInArray(itemsId);

      expect(result).toBeNull();
    });
  });

  describe('updateForeignKey', () => {
    it('should set foreign key on string node', () => {
      const schema = createSchema({
        ref: { type: 'string', default: '' },
      });
      const engine = new SchemaEngine(schema);
      const refId = engine.root().property('ref').id();

      const success = engine.updateForeignKey(refId, 'otherTable');

      expect(success).toBe(true);
      expect(engine.root().property('ref').foreignKey()).toBe('otherTable');
    });

    it('should clear foreign key when empty string', () => {
      const schema = createSchema({
        ref: { type: 'string', default: '', 'x-foreignKey': 'oldTable' },
      });
      const engine = new SchemaEngine(schema);
      const refId = engine.root().property('ref').id();

      const success = engine.updateForeignKey(refId, '');

      expect(success).toBe(true);
      expect(engine.root().property('ref').foreignKey()).toBeUndefined();
    });

    it('should return false when node is not string', () => {
      const schema = createSchema({
        count: { type: 'number', default: 0 },
      });
      const engine = new SchemaEngine(schema);
      const countId = engine.root().property('count').id();

      const success = engine.updateForeignKey(countId, 'table');

      expect(success).toBe(false);
    });

    it('should return false when node not found', () => {
      const schema = createSchema({});
      const engine = new SchemaEngine(schema);

      const success = engine.updateForeignKey('non-existent', 'table');

      expect(success).toBe(false);
    });
  });

  describe('updateFormula', () => {
    it('should set formula on node', () => {
      const schema = createSchema({
        price: { type: 'number', default: 0 },
        total: { type: 'number', default: 0 },
      });
      const engine = new SchemaEngine(schema);
      const totalId = engine.root().property('total').id();

      const result = engine.updateFormula(totalId, 'price * 2');

      expect(result.success).toBe(true);
      expect(engine.root().property('total').hasFormula()).toBe(true);
      const totalNode = engine.root().property('total');
      const formula = totalNode.formula();
      expect(formula).toBeDefined();
      if (formula) {
        const expression = new FormulaSerializer(
          engine.tree,
          totalNode.id(),
          formula,
        ).serialize();
        expect(expression).toBe('price * 2');
      }
    });

    it('should clear formula when expression is undefined', () => {
      const schema = createSchema({
        price: { type: 'number', default: 0 },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * 2' },
        },
      });
      const engine = new SchemaEngine(schema);
      const totalId = engine.root().property('total').id();

      const result = engine.updateFormula(totalId, undefined);

      expect(result.success).toBe(true);
      expect(engine.root().property('total').hasFormula()).toBe(false);
    });

    it('should return error for invalid formula', () => {
      const schema = createSchema({
        value: { type: 'number', default: 0 },
      });
      const engine = new SchemaEngine(schema);
      const valueId = engine.root().property('value').id();

      const result = engine.updateFormula(valueId, 'invalid +++');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error when node not found', () => {
      const schema = createSchema({});
      const engine = new SchemaEngine(schema);

      const result = engine.updateFormula('non-existent', 'expression');

      expect(result.success).toBe(false);
    });
  });

  describe('createStringNode', () => {
    it('should create string node with name', () => {
      const schema = createSchema({});
      const engine = new SchemaEngine(schema);

      const node = engine.createStringNode('test');

      expect(node.name()).toBe('test');
      expect(node.nodeType()).toBe('string');
    });
  });

  describe('createNumberNode', () => {
    it('should create number node with name', () => {
      const schema = createSchema({});
      const engine = new SchemaEngine(schema);

      const node = engine.createNumberNode('test');

      expect(node.name()).toBe('test');
      expect(node.nodeType()).toBe('number');
    });
  });
});
