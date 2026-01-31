import { SchemaTree } from '../../tree/SchemaTree';
import { SchemaParser, resetIdCounter } from '../../schema/SchemaParser';
import { SchemaDiff } from '../SchemaDiff';
import { NodeFactory } from '../../node/NodeFactory';
import { ParsedFormula } from '../../formula';
import {
  arrayField,
  createSchema,
  numberField,
  objectField,
  stringField,
  formulaField,
  stringFormulaField,
  stringWithForeignKey,
  stringWithContentMediaType,
  withDescription,
} from '../../__tests__/test-helpers';
import type { JsonObjectSchema, JsonSchemaType } from '../../schema/JsonSchema';
import { StringNode } from '../../node/StringNode';
import type { NumberNode } from '../../node/NumberNode';

beforeEach(() => {
  resetIdCounter();
});

const createTreeAndDiffFromSchema = (
  schema: JsonSchemaType,
): { tree: SchemaTree; diff: SchemaDiff } => {
  const parser = new SchemaParser();
  const root = parser.parse(schema);
  const tree = new SchemaTree(root);

  for (const { nodeId, expression } of parser.getPendingFormulas()) {
    const node = tree.nodeById(nodeId);
    if (!node.isNull()) {
      try {
        const formula = new ParsedFormula(tree, nodeId, expression);
        node.setFormula(formula);
        tree.registerFormula(nodeId, formula);
      } catch {
        // Ignore formula parse errors
      }
    }
  }

  const diff = new SchemaDiff(tree);
  return { tree, diff };
};

const createTreeAndDiff = (
  properties: Record<string, unknown>,
): { tree: SchemaTree; diff: SchemaDiff } => {
  return createTreeAndDiffFromSchema(createSchema(properties));
};

describe('SchemaDiff', () => {
  describe('adding nested field', () => {
    it('generates add patch for new nested field', () => {
      const { tree, diff } = createTreeAndDiff({
        nested: objectField({
          te: stringField(),
        }),
        sum: formulaField('value * 2'),
        test: stringField(),
        val1: stringField(),
        val2: stringFormulaField('val1'),
        value: numberField(),
      });

      const nestedNode = tree.root().property('nested');
      const newNode = NodeFactory.string('new');
      tree.addChildTo(nestedNode.id(), newNode);

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'nested.new',
        patch: {
          op: 'add',
          path: '/properties/nested/properties/new',
        },
      });
    });
  });

  describe('adding top-level field', () => {
    it('generates add patch for new top-level field', () => {
      const { tree, diff } = createTreeAndDiff({
        existing: stringField(),
      });

      const newNode = NodeFactory.string('newField');
      tree.addChildTo(tree.root().id(), newNode);

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'newField',
        patch: {
          op: 'add',
          path: '/properties/newField',
        },
      });
    });
  });

  describe('modifying field', () => {
    it('generates replace patch when field value changes', () => {
      const { tree, diff } = createTreeAndDiff({
        name: stringField('initial'),
      });

      const nameNode = tree.root().property('name') as StringNode;
      nameNode.setDefaultValue('modified');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'name',
        patch: {
          op: 'replace',
          path: '/properties/name',
        },
      });
    });
  });

  describe('removing field', () => {
    it('generates remove patch when top-level field is deleted', () => {
      const { tree, diff } = createTreeAndDiff({
        name: stringField(),
        age: numberField(),
      });

      const nameNode = tree.root().property('name');
      tree.removeNodeAt(tree.pathOf(nameNode.id()));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'name',
        patch: {
          op: 'remove',
          path: '/properties/name',
        },
      });
    });

    it('generates remove patch when nested field is deleted', () => {
      const { tree, diff } = createTreeAndDiff({
        nested: objectField({
          fieldA: stringField(),
          fieldB: stringField(),
        }),
      });

      const nestedNode = tree.root().property('nested');
      const fieldANode = nestedNode.property('fieldA');
      tree.removeNodeAt(tree.pathOf(fieldANode.id()));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'nested.fieldA',
        patch: {
          op: 'remove',
          path: '/properties/nested/properties/fieldA',
        },
      });
    });
  });

  describe('renaming field', () => {
    it('generates move patch when field is renamed', () => {
      const { tree, diff } = createTreeAndDiff({
        oldName: stringField(),
      });

      const node = tree.root().property('oldName');
      tree.renameNode(node.id(), 'newName');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'newName',
        isRename: true,
        patch: {
          op: 'move',
          from: '/properties/oldName',
          path: '/properties/newName',
        },
      });
    });
  });

  describe('isDirty', () => {
    it('returns false when no changes', () => {
      const { diff } = createTreeAndDiff({
        name: stringField(),
      });

      expect(diff.isDirty()).toBe(false);
    });

    it('returns true when field added', () => {
      const { tree, diff } = createTreeAndDiff({
        name: stringField(),
      });

      tree.addChildTo(tree.root().id(), NodeFactory.string('new'));

      expect(diff.isDirty()).toBe(true);
    });
  });

  describe('markAsSaved', () => {
    it('clears dirty state after save', () => {
      const { tree, diff } = createTreeAndDiff({
        name: stringField(),
      });

      tree.addChildTo(tree.root().id(), NodeFactory.string('new'));
      expect(diff.isDirty()).toBe(true);

      diff.markAsSaved();

      expect(diff.isDirty()).toBe(false);
    });
  });

  describe('array operations', () => {
    it('generates add patch for field inside array items', () => {
      const { tree, diff } = createTreeAndDiff({
        items: arrayField(
          objectField({
            existingField: stringField(),
          }),
        ),
      });

      const itemsNode = tree.root().property('items');
      const itemsItems = itemsNode.items();
      tree.addChildTo(itemsItems.id(), NodeFactory.string('newField'));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'items[*].newField',
        patch: {
          op: 'add',
          path: '/properties/items/items/properties/newField',
        },
      });
    });

    it('generates remove patch for field inside array items', () => {
      const { tree, diff } = createTreeAndDiff({
        items: arrayField(
          objectField({
            fieldA: stringField(),
            fieldB: stringField(),
          }),
        ),
      });

      const itemsNode = tree.root().property('items');
      const itemsItems = itemsNode.items();
      const fieldA = itemsItems.property('fieldA');
      tree.removeNodeAt(tree.pathOf(fieldA.id()));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'items[*].fieldA',
        patch: {
          op: 'remove',
          path: '/properties/items/items/properties/fieldA',
        },
      });
    });

    it('generates replace patch for field inside array items', () => {
      const { tree, diff } = createTreeAndDiff({
        items: arrayField(
          objectField({
            name: stringField('initial'),
          }),
        ),
      });

      const itemsNode = tree.root().property('items');
      const itemsItems = itemsNode.items();
      const nameNode = itemsItems.property('name') as StringNode;
      nameNode.setDefaultValue('modified');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'items[*].name',
        patch: {
          op: 'replace',
          path: '/properties/items/items/properties/name',
        },
      });
    });

    it('generates move patch for renamed field inside array items', () => {
      const { tree, diff } = createTreeAndDiff({
        items: arrayField(
          objectField({
            oldName: stringField(),
          }),
        ),
      });

      const itemsNode = tree.root().property('items');
      const itemsItems = itemsNode.items();
      const oldNameNode = itemsItems.property('oldName');
      tree.renameNode(oldNameNode.id(), 'newName');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'items[*].newName',
        isRename: true,
        patch: {
          op: 'move',
          from: '/properties/items/items/properties/oldName',
          path: '/properties/items/items/properties/newName',
        },
      });
    });

    it('generates replace patch for items when array items type changes', () => {
      const { tree, diff } = createTreeAndDiff({
        items: arrayField(stringField()),
      });

      const arrayNode = tree.root().property('items');
      const oldItems = arrayNode.items();
      const oldItemsId = oldItems.id();
      const oldItemsPath = tree.pathOf(oldItemsId);

      tree.removeNodeAt(oldItemsPath);
      const newItems = NodeFactory.number('');
      tree.setNodeAt(oldItemsPath, newItems);
      diff.trackReplacement(oldItemsId, newItems.id());

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'items[*]',
        patch: {
          op: 'replace',
          path: '/properties/items/items',
        },
        typeChange: {
          fromType: 'string',
          toType: 'number',
        },
      });
    });

    it('generates replace patch for array when only array metadata changes', () => {
      const { tree, diff } = createTreeAndDiff({
        items: arrayField(stringField()),
      });

      const arrayNode = tree.root().property('items');
      arrayNode.setMetadata({ description: 'New description' });

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'items',
        patch: {
          op: 'replace',
          path: '/properties/items',
        },
        descriptionChange: {
          fromDescription: undefined,
          toDescription: 'New description',
        },
      });
    });

    it('generates two patches when both array metadata and items type change', () => {
      const { tree, diff } = createTreeAndDiff({
        items: arrayField(stringField()),
      });

      const arrayNode = tree.root().property('items');
      arrayNode.setMetadata({ description: 'New description' });

      const oldItems = arrayNode.items();
      const oldItemsId = oldItems.id();
      const oldItemsPath = tree.pathOf(oldItemsId);

      tree.removeNodeAt(oldItemsPath);
      const newItems = NodeFactory.number('');
      tree.setNodeAt(oldItemsPath, newItems);
      diff.trackReplacement(oldItemsId, newItems.id());

      const patches = diff.getPatches();

      expect(patches).toHaveLength(2);

      const arrayPatch = patches.find(
        (p) => p.patch.path === '/properties/items',
      );
      const itemsPatch = patches.find(
        (p) => p.patch.path === '/properties/items/items',
      );

      expect(arrayPatch).toMatchObject({
        fieldName: 'items',
        patch: {
          op: 'replace',
          path: '/properties/items',
        },
        descriptionChange: {
          fromDescription: undefined,
          toDescription: 'New description',
        },
      });
      expect(arrayPatch?.typeChange).toBeUndefined();
      expect(arrayPatch?.defaultChange).toBeUndefined();

      expect(itemsPatch).toMatchObject({
        fieldName: 'items[*]',
        patch: {
          op: 'replace',
          path: '/properties/items/items',
        },
        typeChange: {
          fromType: 'string',
          toType: 'number',
        },
      });
    });

    it('handles field named "properties" correctly', () => {
      const { tree, diff } = createTreeAndDiff({
        properties: arrayField(stringField()),
      });

      const arrayNode = tree.root().property('properties');
      arrayNode.setMetadata({ description: 'Field named properties' });

      const oldItems = arrayNode.items();
      const oldItemsId = oldItems.id();
      const oldItemsPath = tree.pathOf(oldItemsId);

      tree.removeNodeAt(oldItemsPath);
      const newItems = NodeFactory.number('');
      tree.setNodeAt(oldItemsPath, newItems);
      diff.trackReplacement(oldItemsId, newItems.id());

      const patches = diff.getPatches();

      expect(patches).toHaveLength(2);

      const arrayPatch = patches.find(
        (p) => p.patch.path === '/properties/properties',
      );
      const itemsPatch = patches.find(
        (p) => p.patch.path === '/properties/properties/items',
      );

      expect(arrayPatch).toMatchObject({
        fieldName: 'properties',
        patch: {
          op: 'replace',
          path: '/properties/properties',
        },
        descriptionChange: {
          fromDescription: undefined,
          toDescription: 'Field named properties',
        },
      });
      expect(arrayPatch?.typeChange).toBeUndefined();

      expect(itemsPatch).toMatchObject({
        fieldName: 'properties[*]',
        patch: {
          op: 'replace',
          path: '/properties/properties/items',
        },
        typeChange: {
          fromType: 'string',
          toType: 'number',
        },
      });
    });

    it('handles nested field named "items" inside object correctly', () => {
      const { tree, diff } = createTreeAndDiff({
        parent: objectField({
          items: stringField(),
        }),
      });

      const itemsNode = tree.root().property('parent').property('items');
      itemsNode.setDefaultValue('new default');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'parent.items',
        patch: {
          op: 'replace',
          path: '/properties/parent/properties/items',
        },
        defaultChange: {
          fromDefault: '',
          toDefault: 'new default',
        },
      });
    });
  });

  describe('nested operations', () => {
    it('generates replace patch for nested field modification', () => {
      const { tree, diff } = createTreeAndDiff({
        nested: objectField({
          value: numberField(10),
        }),
      });

      const nestedNode = tree.root().property('nested');
      const valueNode = nestedNode.property('value') as NumberNode;
      valueNode.setDefaultValue(20);

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'nested.value',
        patch: {
          op: 'replace',
          path: '/properties/nested/properties/value',
        },
      });
    });

    it('generates move patch for renamed nested field', () => {
      const { tree, diff } = createTreeAndDiff({
        nested: objectField({
          oldName: stringField(),
        }),
      });

      const nestedNode = tree.root().property('nested');
      const oldNameNode = nestedNode.property('oldName');
      tree.renameNode(oldNameNode.id(), 'newName');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'nested.newName',
        isRename: true,
        patch: {
          op: 'move',
          from: '/properties/nested/properties/oldName',
          path: '/properties/nested/properties/newName',
        },
      });
    });

    it('generates multiple patches for multiple changes in one object', () => {
      const { tree, diff } = createTreeAndDiff({
        nested: objectField({
          fieldA: stringField('a'),
          fieldB: stringField('b'),
          fieldC: stringField('c'),
        }),
      });

      const nestedNode = tree.root().property('nested');
      (nestedNode.property('fieldA') as StringNode).setDefaultValue('modified');
      tree.removeNodeAt(tree.pathOf(nestedNode.property('fieldB').id()));
      tree.addChildTo(nestedNode.id(), NodeFactory.string('fieldD'));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(3);
      expect(patches).toMatchObject([
        { fieldName: 'nested.fieldA', patch: { op: 'replace' } },
        { fieldName: 'nested.fieldD', patch: { op: 'add' } },
        { fieldName: 'nested.fieldB', patch: { op: 'remove' } },
      ]);
    });
  });

  describe('SchemaPatch metadata', () => {
    it('detects type change from string to number', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringField(),
      });

      const fieldNode = tree.root().property('field');
      const path = tree.pathOf(fieldNode.id());
      tree.removeNodeAt(path);
      const newNode = NodeFactory.number('field');
      tree.addChildTo(tree.root().id(), newNode);
      diff.trackReplacement(fieldNode.id(), newNode.id());

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        typeChange: { fromType: 'string', toType: 'number' },
      });
    });

    it('detects formula removal', () => {
      const { tree, diff } = createTreeAndDiff({
        value: numberField(),
        computed: formulaField('value * 2'),
      });

      const computedNode = tree.root().property('computed');
      const path = tree.pathOf(computedNode.id());
      tree.removeNodeAt(path);
      const newNode = NodeFactory.number('computed');
      tree.addChildTo(tree.root().id(), newNode);
      diff.trackReplacement(computedNode.id(), newNode.id());

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'computed',
        patch: { op: 'replace', path: '/properties/computed' },
        formulaChange: { fromFormula: 'value * 2', toFormula: undefined },
      });
    });

    it('detects default value change', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringField('initial'),
      });

      const fieldNode = tree.root().property('field') as StringNode;
      fieldNode.setDefaultValue('modified');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        defaultChange: { fromDefault: 'initial', toDefault: 'modified' },
      });
    });

    it('does not report defaultChange when only formula changes in array items', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'object',
        required: ['levels', 'value'],
        properties: {
          levels: {
            type: 'array',
            items: {
              type: 'object',
              required: ['exp', 'label'],
              properties: {
                exp: {
                  type: 'number',
                  default: 0,
                  readOnly: true,
                  'x-formula': {
                    version: 1,
                    expression: '../../value + #index * 10',
                  },
                },
                label: {
                  type: 'string',
                  default: '',
                  readOnly: true,
                  'x-formula': {
                    version: 1,
                    expression: '"Exp:" + tostring(exp)',
                  },
                },
              },
              additionalProperties: false,
            },
          },
          value: {
            type: 'number',
            default: 0,
          },
        },
        additionalProperties: false,
      } as JsonObjectSchema);

      diff.markAsSaved();
      expect(diff.isDirty()).toBe(false);

      const levelsNode = tree.root().property('levels');
      const itemsNode = levelsNode.items();
      const labelNode = itemsNode.property('label');

      const newFormula = new ParsedFormula(
        tree,
        labelNode.id(),
        '"Exp!:" + tostring(exp)',
      );
      labelNode.setFormula(newFormula);
      tree.registerFormula(labelNode.id(), newFormula);

      expect(diff.isDirty()).toBe(true);

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'levels[*].label',
        patch: { op: 'replace' },
        formulaChange: {
          fromFormula: '"Exp:" + tostring(exp)',
          toFormula: '"Exp!:" + tostring(exp)',
        },
      });
      expect(patches[0].defaultChange).toBeUndefined();
    });

    it('detects description change', () => {
      const { tree, diff } = createTreeAndDiff({
        field: withDescription(stringField(), 'old description'),
      });

      const fieldNode = tree.root().property('field');
      fieldNode.setMetadata({ description: 'new description' });

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        descriptionChange: {
          fromDescription: 'old description',
          toDescription: 'new description',
        },
      });
    });

    it('detects deprecated change', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringField(),
      });

      const fieldNode = tree.root().property('field');
      fieldNode.setMetadata({ deprecated: true });

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        deprecatedChange: { fromDeprecated: undefined, toDeprecated: true },
      });
    });

    it('detects foreignKey addition', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringField(),
      });

      const fieldNode = tree.root().property('field') as StringNode;
      fieldNode.setForeignKey('users');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        foreignKeyChange: { fromForeignKey: undefined, toForeignKey: 'users' },
      });
    });

    it('detects foreignKey change', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringWithForeignKey('users'),
      });

      const fieldNode = tree.root().property('field') as StringNode;
      fieldNode.setForeignKey('categories');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        foreignKeyChange: {
          fromForeignKey: 'users',
          toForeignKey: 'categories',
        },
      });
    });

    it('detects foreignKey removal', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringWithForeignKey('users'),
      });

      const fieldNode = tree.root().property('field') as StringNode;
      fieldNode.setForeignKey(undefined);

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        foreignKeyChange: { fromForeignKey: 'users', toForeignKey: undefined },
      });
    });

    it('detects contentMediaType addition', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringField(),
      });

      const fieldNode = tree.root().property('field') as StringNode;
      fieldNode.setContentMediaType('text/markdown');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        contentMediaTypeChange: {
          fromContentMediaType: undefined,
          toContentMediaType: 'text/markdown',
        },
      });
    });

    it('detects contentMediaType change', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringWithContentMediaType('text/plain'),
      });

      const fieldNode = tree.root().property('field') as StringNode;
      fieldNode.setContentMediaType('text/markdown');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        contentMediaTypeChange: {
          fromContentMediaType: 'text/plain',
          toContentMediaType: 'text/markdown',
        },
      });
    });

    it('detects contentMediaType removal', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringWithContentMediaType('text/markdown'),
      });

      const fieldNode = tree.root().property('field') as StringNode;
      fieldNode.setContentMediaType(undefined);

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        contentMediaTypeChange: {
          fromContentMediaType: 'text/markdown',
          toContentMediaType: undefined,
        },
      });
    });

    it('marks move as rename when parent is same', () => {
      const { tree, diff } = createTreeAndDiff({
        oldName: stringField(),
      });

      tree.renameNode(tree.root().property('oldName').id(), 'newName');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'newName',
        isRename: true,
        patch: {
          op: 'move',
          from: '/properties/oldName',
          path: '/properties/newName',
        },
      });
    });

    it('detects formula expression change when referenced field is renamed', () => {
      const { tree, diff } = createTreeAndDiff({
        price: numberField(),
        total: formulaField('price * 2'),
      });

      tree.renameNode(tree.root().property('price').id(), 'cost');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(2);
      expect(patches[0]).toMatchObject({
        fieldName: 'cost',
        isRename: true,
        patch: {
          op: 'move',
          from: '/properties/price',
          path: '/properties/cost',
        },
      });
      expect(patches[1]).toMatchObject({
        fieldName: 'total',
        patch: { op: 'replace', path: '/properties/total' },
        formulaChange: { fromFormula: 'price * 2', toFormula: 'cost * 2' },
      });
    });

    it('detects formula expression change when formula field is moved', () => {
      const { tree, diff } = createTreeAndDiff({
        price: numberField(),
        total: formulaField('price * 2'),
        group: objectField({}),
      });

      tree.moveNode(
        tree.root().property('total').id(),
        tree.root().property('group').id(),
      );

      const patches = diff.getPatches();

      expect(patches).toHaveLength(2);
      expect(patches[0]).toMatchObject({
        patch: {
          op: 'move',
          from: '/properties/total',
          path: '/properties/group/properties/total',
        },
      });
      expect(patches[1]).toMatchObject({
        patch: { op: 'replace', path: '/properties/group/properties/total' },
        formulaChange: { toFormula: '../price * 2' },
      });
    });

    describe('add patch metadata', () => {
      it('includes formula in add patch when field has formula', () => {
        const { tree, diff } = createTreeAndDiff({
          value: numberField(),
        });

        const newNode = NodeFactory.number('computed');
        tree.addChildTo(tree.root().id(), newNode);

        const formula = new ParsedFormula(tree, newNode.id(), 'value * 2');
        newNode.setFormula(formula);
        tree.registerFormula(newNode.id(), formula);

        const patches = diff.getPatches();

        expect(patches).toHaveLength(1);
        expect(patches[0]).toMatchObject({
          fieldName: 'computed',
          patch: { op: 'add', path: '/properties/computed' },
          formulaChange: { fromFormula: undefined, toFormula: 'value * 2' },
        });
      });

      it('includes description in add patch when field has description', () => {
        const { tree, diff } = createTreeAndDiff({});

        const newNode = NodeFactory.string('field');
        newNode.setMetadata({ description: 'My description' });
        tree.addChildTo(tree.root().id(), newNode);

        const patches = diff.getPatches();

        expect(patches).toHaveLength(1);
        expect(patches[0]).toMatchObject({
          fieldName: 'field',
          patch: { op: 'add', path: '/properties/field' },
          descriptionChange: {
            fromDescription: undefined,
            toDescription: 'My description',
          },
        });
      });

      it('includes deprecated in add patch when field is deprecated', () => {
        const { tree, diff } = createTreeAndDiff({});

        const newNode = NodeFactory.string('field');
        newNode.setMetadata({ deprecated: true });
        tree.addChildTo(tree.root().id(), newNode);

        const patches = diff.getPatches();

        expect(patches).toHaveLength(1);
        expect(patches[0]).toMatchObject({
          fieldName: 'field',
          patch: { op: 'add', path: '/properties/field' },
          deprecatedChange: { fromDeprecated: undefined, toDeprecated: true },
        });
      });

      it('includes default value in add patch', () => {
        const { tree, diff } = createTreeAndDiff({});

        const newNode = NodeFactory.string('field');
        newNode.setDefaultValue('my default');
        tree.addChildTo(tree.root().id(), newNode);

        const patches = diff.getPatches();

        expect(patches).toHaveLength(1);
        expect(patches[0]).toMatchObject({
          fieldName: 'field',
          patch: { op: 'add', path: '/properties/field' },
          defaultChange: { fromDefault: undefined, toDefault: 'my default' },
        });
      });

      it('includes foreignKey in add patch when field has foreignKey', () => {
        const { tree, diff } = createTreeAndDiff({});

        const newNode = NodeFactory.string('categoryId');
        newNode.setForeignKey('categories');
        tree.addChildTo(tree.root().id(), newNode);

        const patches = diff.getPatches();

        expect(patches).toHaveLength(1);
        expect(patches[0]).toMatchObject({
          fieldName: 'categoryId',
          patch: { op: 'add', path: '/properties/categoryId' },
          foreignKeyChange: {
            fromForeignKey: undefined,
            toForeignKey: 'categories',
          },
        });
      });

      it('includes contentMediaType in add patch when field has contentMediaType', () => {
        const { tree, diff } = createTreeAndDiff({});

        const newNode = NodeFactory.string('content');
        newNode.setContentMediaType('text/markdown');
        tree.addChildTo(tree.root().id(), newNode);

        const patches = diff.getPatches();

        expect(patches).toHaveLength(1);
        expect(patches[0]).toMatchObject({
          fieldName: 'content',
          patch: { op: 'add', path: '/properties/content' },
          contentMediaTypeChange: {
            fromContentMediaType: undefined,
            toContentMediaType: 'text/markdown',
          },
        });
      });
    });
  });

  describe('edge cases', () => {
    it('removes parent with children - single remove patch for parent', () => {
      const { tree, diff } = createTreeAndDiff({
        parent: objectField({
          child1: stringField(),
          child2: stringField(),
          nested: objectField({
            grandchild: stringField(),
          }),
        }),
      });

      const parentNode = tree.root().property('parent');
      tree.removeNodeAt(tree.pathOf(parentNode.id()));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'parent',
        patch: { op: 'remove', path: '/properties/parent' },
      });
    });

    it('renames parent - children move together, single move patch', () => {
      const { tree, diff } = createTreeAndDiff({
        oldParent: objectField({
          child1: stringField(),
          child2: stringField(),
        }),
      });

      const parentNode = tree.root().property('oldParent');
      tree.renameNode(parentNode.id(), 'newParent');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'newParent',
        isRename: true,
        patch: {
          op: 'move',
          from: '/properties/oldParent',
          path: '/properties/newParent',
        },
      });
    });

    it('rename + modify generates move then replace', () => {
      const { tree, diff } = createTreeAndDiff({
        oldName: stringField('initial'),
      });

      const node = tree.root().property('oldName');
      tree.renameNode(node.id(), 'newName');
      (tree.root().property('newName') as StringNode).setDefaultValue(
        'modified',
      );

      const patches = diff.getPatches();

      expect(patches).toHaveLength(2);
      expect(patches[0]).toMatchObject({
        patch: {
          op: 'move',
          from: '/properties/oldName',
          path: '/properties/newName',
        },
      });
      expect(patches[1]).toMatchObject({
        patch: { op: 'replace', path: '/properties/newName' },
      });
    });
  });

  describe('patch ordering - critical for backend application', () => {
    it('move patches come before add/remove to preserve node existence', () => {
      const { tree, diff } = createTreeAndDiff({
        fieldA: stringField(),
        fieldB: stringField(),
      });

      tree.renameNode(tree.root().property('fieldA').id(), 'renamedA');
      tree.addChildTo(tree.root().id(), NodeFactory.string('newField'));
      tree.removeNodeAt(tree.pathOf(tree.root().property('fieldB').id()));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(3);
      expect(patches[0]).toMatchObject({ patch: { op: 'move' } });
      expect(patches[1]).toMatchObject({ patch: { op: 'add' } });
      expect(patches[2]).toMatchObject({ patch: { op: 'remove' } });
    });

    it('add new parent, move field into it, add formula', () => {
      const { tree, diff } = createTreeAndDiff({
        test: numberField(),
        werwer: numberField(),
      });

      const nestedNode = NodeFactory.object('nested');
      tree.addChildTo(tree.root().id(), nestedNode);

      const werwerNode = tree.root().property('werwer');
      tree.moveNode(werwerNode.id(), nestedNode.id());

      const movedNode = tree.root().property('nested').property('werwer');
      const formula = new ParsedFormula(tree, movedNode.id(), '../test * 2');
      movedNode.setFormula(formula);
      tree.registerFormula(movedNode.id(), formula);

      const patches = diff.getPatches();

      expect(patches).toHaveLength(3);
      expect(patches[0]).toMatchObject({
        patch: {
          op: 'add',
          path: '/properties/nested',
          value: {
            type: 'object',
            properties: {},
            additionalProperties: false,
            required: [],
          },
        },
      });
      expect(patches[1]).toMatchObject({
        patch: {
          op: 'move',
          from: '/properties/werwer',
          path: '/properties/nested/properties/werwer',
        },
      });
      expect(patches[2]).toMatchObject({
        patch: {
          op: 'replace',
          path: '/properties/nested/properties/werwer',
        },
      });
    });

    it('move multiple fields into deeply nested new structure', () => {
      const { tree, diff } = createTreeAndDiff({
        fieldA: numberField(),
        fieldB: stringField(),
      });

      const level1 = NodeFactory.object('level1');
      tree.addChildTo(tree.root().id(), level1);
      const level2 = NodeFactory.object('level2');
      tree.addChildTo(level1.id(), level2);

      tree.moveNode(tree.root().property('fieldA').id(), level2.id());
      tree.moveNode(tree.root().property('fieldB').id(), level2.id());

      const patches = diff.getPatches();

      expect(patches).toHaveLength(3);
      expect(patches[0]).toMatchObject({
        patch: {
          op: 'add',
          path: '/properties/level1',
        },
      });
      expect(patches[1]).toMatchObject({
        patch: {
          op: 'move',
          from: '/properties/fieldA',
          path: '/properties/level1/properties/level2/properties/fieldA',
        },
      });
      expect(patches[2]).toMatchObject({
        patch: {
          op: 'move',
          from: '/properties/fieldB',
          path: '/properties/level1/properties/level2/properties/fieldB',
        },
      });
    });

    it.todo(
      'swap two fields via temp - should generate 3 move patches in correct order',
    );

    it('rename parent then add child - patches are in correct order', () => {
      const { tree, diff } = createTreeAndDiff({
        oldParent: objectField({
          existingChild: stringField(),
        }),
      });

      const parentNode = tree.root().property('oldParent');
      tree.renameNode(parentNode.id(), 'newParent');
      const renamedParent = tree.root().property('newParent');
      tree.addChildTo(renamedParent.id(), NodeFactory.string('newChild'));

      const patches = diff.getPatches();

      expect(patches.length).toBeGreaterThanOrEqual(2);
      expect(patches[0]).toMatchObject({
        patch: { op: 'move', path: '/properties/newParent' },
      });
    });

    it('rename parent then remove child - patches reference new parent path', () => {
      const { tree, diff } = createTreeAndDiff({
        oldParent: objectField({
          childToRemove: stringField(),
          childToKeep: stringField(),
        }),
      });

      const parentNode = tree.root().property('oldParent');
      tree.renameNode(parentNode.id(), 'newParent');
      const renamedParent = tree.root().property('newParent');
      tree.removeNodeAt(
        tree.pathOf(renamedParent.property('childToRemove').id()),
      );

      const patches = diff.getPatches();

      expect(patches.length).toBeGreaterThanOrEqual(1);
      expect(patches[0]).toMatchObject({
        patch: {
          op: 'move',
          from: '/properties/oldParent',
          path: '/properties/newParent',
        },
      });
    });

    it('complex chain: rename A->B, add new A, modify B', () => {
      const { tree, diff } = createTreeAndDiff({
        fieldA: stringField('original'),
      });

      const fieldA = tree.root().property('fieldA');
      tree.renameNode(fieldA.id(), 'fieldB');
      tree.addChildTo(tree.root().id(), NodeFactory.string('fieldA'));
      (tree.root().property('fieldB') as StringNode).setDefaultValue(
        'modified',
      );

      const patches = diff.getPatches();

      expect(patches).toHaveLength(3);
      expect(patches[0]).toMatchObject({
        patch: {
          op: 'move',
          from: '/properties/fieldA',
          path: '/properties/fieldB',
        },
      });
      expect(patches[1]).toMatchObject({
        patch: { op: 'replace', path: '/properties/fieldB' },
      });
      expect(patches[2]).toMatchObject({
        patch: { op: 'add', path: '/properties/fieldA' },
      });
    });

    it('move field between objects - path must exist at application time', () => {
      const { tree, diff } = createTreeAndDiff({
        source: objectField({
          fieldToMove: stringField(),
        }),
        target: objectField({
          existingField: stringField(),
        }),
      });

      const sourceNode = tree.root().property('source');
      const fieldToMove = sourceNode.property('fieldToMove');
      const targetNode = tree.root().property('target');

      tree.removeNodeAt(tree.pathOf(fieldToMove.id()));
      tree.addChildTo(targetNode.id(), NodeFactory.string('fieldToMove'));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(2);

      const removePatch = patches.find((p) => p.patch.op === 'remove');
      const addPatch = patches.find((p) => p.patch.op === 'add');

      expect(removePatch).toMatchObject({
        patch: {
          op: 'remove',
          path: '/properties/source/properties/fieldToMove',
        },
      });
      expect(addPatch).toMatchObject({
        patch: { op: 'add', path: '/properties/target/properties/fieldToMove' },
      });
    });

    it('deeply nested rename chain', () => {
      const { tree, diff } = createTreeAndDiff({
        level1: objectField({
          level2: objectField({
            level3: objectField({
              deepField: stringField(),
            }),
          }),
        }),
      });

      const level1 = tree.root().property('level1');
      const level2 = level1.property('level2');
      const level3 = level2.property('level3');

      tree.renameNode(level1.id(), 'renamed1');
      tree.renameNode(level2.id(), 'renamed2');
      tree.renameNode(level3.id(), 'renamed3');

      const patches = diff.getPatches();

      expect(patches.length).toBeGreaterThanOrEqual(1);
      expect(patches[0]).toMatchObject({
        patch: {
          op: 'move',
          from: '/properties/level1',
          path: '/properties/renamed1',
        },
      });
    });

    it('rename field to name of removed field', () => {
      const { tree, diff } = createTreeAndDiff({
        fieldA: stringField('a'),
        fieldB: stringField('b'),
      });

      tree.removeNodeAt(tree.pathOf(tree.root().property('fieldA').id()));
      tree.renameNode(tree.root().property('fieldB').id(), 'fieldA');

      const patches = diff.getPatches();

      expect(patches.length).toBeGreaterThanOrEqual(1);
      expect(patches).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            patch: {
              op: 'move',
              from: '/properties/fieldB',
              path: '/properties/fieldA',
            },
          }),
        ]),
      );
    });

    it('multiple renames in sequence maintain valid paths', () => {
      const { tree, diff } = createTreeAndDiff({
        a: stringField(),
        b: stringField(),
        c: stringField(),
      });

      tree.renameNode(tree.root().property('a').id(), 'x');
      tree.renameNode(tree.root().property('b').id(), 'y');
      tree.renameNode(tree.root().property('c').id(), 'z');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(3);
      expect(patches).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            patch: { op: 'move', from: '/properties/a', path: '/properties/x' },
          }),
          expect.objectContaining({
            patch: { op: 'move', from: '/properties/b', path: '/properties/y' },
          }),
          expect.objectContaining({
            patch: { op: 'move', from: '/properties/c', path: '/properties/z' },
          }),
        ]),
      );
    });

    it('add then remove same path in sequence - net effect is no change', () => {
      const { tree, diff } = createTreeAndDiff({
        existing: stringField(),
      });

      tree.addChildTo(tree.root().id(), NodeFactory.string('temporary'));
      tree.removeNodeAt(tree.pathOf(tree.root().property('temporary').id()));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(0);
    });

    it('array items rename with nested modifications', () => {
      const { tree, diff } = createTreeAndDiff({
        items: arrayField(
          objectField({
            oldField: stringField('original'),
          }),
        ),
      });

      const itemsNode = tree.root().property('items');
      const itemsItems = itemsNode.items();
      const oldField = itemsItems.property('oldField');

      tree.renameNode(oldField.id(), 'newField');
      (itemsItems.property('newField') as StringNode).setDefaultValue(
        'modified',
      );

      const patches = diff.getPatches();

      expect(patches).toHaveLength(2);
      expect(patches[0]).toMatchObject({
        patch: {
          op: 'move',
          from: '/properties/items/items/properties/oldField',
          path: '/properties/items/items/properties/newField',
        },
      });
      expect(patches[1]).toMatchObject({
        patch: {
          op: 'replace',
          path: '/properties/items/items/properties/newField',
        },
        defaultChange: { toDefault: 'modified' },
      });
    });
  });

  describe('type changes', () => {
    it('primitive to object', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringField(),
      });

      const fieldNode = tree.root().property('field');
      const path = tree.pathOf(fieldNode.id());
      tree.removeNodeAt(path);
      const newNode = NodeFactory.object('field');
      tree.addChildTo(tree.root().id(), newNode);
      tree.addChildTo(newNode.id(), NodeFactory.string('nested'));
      diff.trackReplacement(fieldNode.id(), newNode.id());

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        typeChange: { fromType: 'string', toType: 'object' },
      });
    });

    it('primitive to array', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringField(),
      });

      const fieldNode = tree.root().property('field');
      const path = tree.pathOf(fieldNode.id());
      tree.removeNodeAt(path);
      const newNode = NodeFactory.array('field', NodeFactory.string('item'));
      tree.addChildTo(tree.root().id(), newNode);
      diff.trackReplacement(fieldNode.id(), newNode.id());

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        typeChange: { fromType: 'string', toType: 'array<string>' },
      });
    });

    it('object to primitive', () => {
      const { tree, diff } = createTreeAndDiff({
        field: objectField({
          nested: stringField(),
        }),
      });

      const fieldNode = tree.root().property('field');
      const path = tree.pathOf(fieldNode.id());
      tree.removeNodeAt(path);
      const newNode = NodeFactory.string('field');
      tree.addChildTo(tree.root().id(), newNode);
      diff.trackReplacement(fieldNode.id(), newNode.id());

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        typeChange: { fromType: 'object', toType: 'string' },
      });
    });

    it('object to array', () => {
      const { tree, diff } = createTreeAndDiff({
        field: objectField({
          nested: stringField(),
        }),
      });

      const fieldNode = tree.root().property('field');
      const path = tree.pathOf(fieldNode.id());
      tree.removeNodeAt(path);
      const newNode = NodeFactory.array('field', NodeFactory.string('item'));
      tree.addChildTo(tree.root().id(), newNode);
      diff.trackReplacement(fieldNode.id(), newNode.id());

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'field',
        patch: { op: 'replace', path: '/properties/field' },
        typeChange: { fromType: 'object', toType: 'array<string>' },
      });
    });
  });

  describe('root node changes', () => {
    it('generates replace patch when root description changes', () => {
      const { tree, diff } = createTreeAndDiff({
        name: stringField(),
      });

      tree.root().setMetadata({ description: 'New root description' });

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'replace', path: '' },
        descriptionChange: {
          fromDescription: undefined,
          toDescription: 'New root description',
        },
      });
    });

    it('generates replace patch when root deprecated changes', () => {
      const { tree, diff } = createTreeAndDiff({
        name: stringField(),
      });

      tree.root().setMetadata({ deprecated: true });

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'replace', path: '' },
        deprecatedChange: { toDeprecated: true },
      });
    });

    it('isDirty returns true when root metadata changes', () => {
      const { tree, diff } = createTreeAndDiff({
        name: stringField(),
      });

      expect(diff.isDirty()).toBe(false);

      tree.root().setMetadata({ description: 'Changed' });

      expect(diff.isDirty()).toBe(true);
    });
  });

  describe('primitive root', () => {
    it('string root - no changes', () => {
      const { diff } = createTreeAndDiffFromSchema({
        type: 'string',
        default: 'hello',
      });

      expect(diff.isDirty()).toBe(false);
      expect(diff.getPatches()).toHaveLength(0);
    });

    it('string root - description change', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'string',
        default: 'hello',
      });

      tree.root().setMetadata({ description: 'A string value' });

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'replace', path: '' },
        descriptionChange: { toDescription: 'A string value' },
      });
    });

    it('string root - default value change', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'string',
        default: 'hello',
      });

      (tree.root() as StringNode).setDefaultValue('world');

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'replace', path: '' },
        defaultChange: { fromDefault: 'hello', toDefault: 'world' },
      });
    });

    it('number root - default value change', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'number',
        default: 0,
      });

      (tree.root() as NumberNode).setDefaultValue(42);

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'replace', path: '' },
        defaultChange: { fromDefault: 0, toDefault: 42 },
      });
    });

    it('boolean root - deprecated change', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'boolean',
        default: false,
      });

      tree.root().setMetadata({ deprecated: true });

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'replace', path: '' },
        deprecatedChange: { toDeprecated: true },
      });
    });
  });

  describe('array root', () => {
    it('array root with primitive items - no changes', () => {
      const { diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: { type: 'string', default: '' },
      });

      expect(diff.isDirty()).toBe(false);
      expect(diff.getPatches()).toHaveLength(0);
    });

    it('array root - description change on root', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: { type: 'string', default: '' },
      });

      tree.root().setMetadata({ description: 'Array of strings' });

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'replace', path: '' },
        descriptionChange: { toDescription: 'Array of strings' },
      });
    });

    it('array root - items default value change', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: { type: 'string', default: 'initial' },
      });

      const items = tree.root().items();
      (items as StringNode).setDefaultValue('changed');

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'replace', path: '/items' },
        defaultChange: { fromDefault: 'initial', toDefault: 'changed' },
      });
    });

    it('array root with object items - add field to items', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', default: '' },
          },
          required: ['name'],
          additionalProperties: false,
        },
      });

      const items = tree.root().items();
      tree.addChildTo(items.id(), NodeFactory.number('age'));

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'add', path: '/items/properties/age' },
      });
    });

    it('array root with object items - remove field from items', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string', default: '' },
            age: { type: 'number', default: 0 },
          },
          required: ['name', 'age'],
          additionalProperties: false,
        },
      });

      const items = tree.root().items();
      const ageNode = items.property('age');
      tree.removeNodeAt(tree.pathOf(ageNode.id()));

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'remove', path: '/items/properties/age' },
      });
    });

    it('array root with object items - rename field in items', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            oldName: { type: 'string', default: '' },
          },
          required: ['oldName'],
          additionalProperties: false,
        },
      });

      const items = tree.root().items();
      const oldNameNode = items.property('oldName');
      tree.renameNode(oldNameNode.id(), 'newName');

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        isRename: true,
        patch: {
          op: 'move',
          from: '/items/properties/oldName',
          path: '/items/properties/newName',
        },
      });
    });
  });

  describe('nested arrays', () => {
    it('array of arrays - no changes', () => {
      const { diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'string', default: '' },
        },
      });

      expect(diff.isDirty()).toBe(false);
      expect(diff.getPatches()).toHaveLength(0);
    });

    it('array of arrays - inner items change', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'string', default: 'initial' },
        },
      });

      const outerItems = tree.root().items();
      const innerItems = outerItems.items();
      (innerItems as StringNode).setDefaultValue('changed');

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'replace', path: '/items/items' },
        defaultChange: { fromDefault: 'initial', toDefault: 'changed' },
      });
    });

    it('array of arrays of objects - add field to innermost object', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'number', default: 0 },
            },
            required: ['value'],
            additionalProperties: false,
          },
        },
      });

      const outerItems = tree.root().items();
      const innerItems = outerItems.items();
      tree.addChildTo(innerItems.id(), NodeFactory.string('label'));

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'add', path: '/items/items/properties/label' },
      });
    });

    it('array of arrays of objects - remove field from innermost object', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              value: { type: 'number', default: 0 },
              label: { type: 'string', default: '' },
            },
            required: ['value', 'label'],
            additionalProperties: false,
          },
        },
      });

      const outerItems = tree.root().items();
      const innerItems = outerItems.items();
      const labelNode = innerItems.property('label');
      tree.removeNodeAt(tree.pathOf(labelNode.id()));

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'remove', path: '/items/items/properties/label' },
      });
    });

    it('array of arrays of objects - rename field in innermost object', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              oldField: { type: 'string', default: '' },
            },
            required: ['oldField'],
            additionalProperties: false,
          },
        },
      });

      const outerItems = tree.root().items();
      const innerItems = outerItems.items();
      const oldFieldNode = innerItems.property('oldField');
      tree.renameNode(oldFieldNode.id(), 'newField');

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        isRename: true,
        patch: {
          op: 'move',
          from: '/items/items/properties/oldField',
          path: '/items/items/properties/newField',
        },
      });
    });

    it('object with array of arrays field', () => {
      const { tree, diff } = createTreeAndDiff({
        matrix: arrayField(
          arrayField({
            type: 'number',
            default: 0,
          }),
        ),
      });

      const matrixNode = tree.root().property('matrix');
      const outerItems = matrixNode.items();
      const innerItems = outerItems.items();
      (innerItems as NumberNode).setDefaultValue(1);

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'matrix[*][*]',
        patch: { op: 'replace', path: '/properties/matrix/items/items' },
        defaultChange: { fromDefault: 0, toDefault: 1 },
      });
    });

    it('deeply nested: array > array > array > object - add field', () => {
      const { tree, diff } = createTreeAndDiffFromSchema({
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                x: { type: 'number', default: 0 },
              },
              required: ['x'],
              additionalProperties: false,
            },
          },
        },
      });

      const level1 = tree.root().items();
      const level2 = level1.items();
      const level3 = level2.items();
      tree.addChildTo(level3.id(), NodeFactory.number('y'));

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        patch: { op: 'add', path: '/items/items/items/properties/y' },
      });
    });

    it('mixed: object > array > object > array > primitive - change innermost', () => {
      const { tree, diff } = createTreeAndDiff({
        users: arrayField(
          objectField({
            tags: arrayField({
              type: 'string',
              default: 'tag',
            }),
          }),
        ),
      });

      const usersNode = tree.root().property('users');
      const userItems = usersNode.items();
      const tagsNode = userItems.property('tags');
      const tagItems = tagsNode.items();
      (tagItems as StringNode).setDefaultValue('new-tag');

      expect(diff.isDirty()).toBe(true);
      const patches = diff.getPatches();
      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'users[*].tags[*]',
        patch: {
          op: 'replace',
          path: '/properties/users/items/properties/tags/items',
        },
        defaultChange: { fromDefault: 'tag', toDefault: 'new-tag' },
      });
    });
  });

  describe('coalescing', () => {
    it('should generate single add patch for parent when adding nested structure', () => {
      const { tree, diff } = createTreeAndDiff({
        existing: stringField(),
      });

      const parentNode = NodeFactory.object('parent');
      tree.addChildTo(tree.root().id(), parentNode);
      tree.addChildTo(parentNode.id(), NodeFactory.string('child1'));
      tree.addChildTo(parentNode.id(), NodeFactory.string('child2'));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'parent',
        patch: { op: 'add', path: '/properties/parent' },
      });
    });

    it('should generate single remove patch for parent when removing nested structure', () => {
      const { tree, diff } = createTreeAndDiff({
        parent: objectField({
          child1: stringField(),
          child2: stringField(),
        }),
      });

      const parentNode = tree.root().property('parent');
      tree.removeNodeAt(tree.pathOf(parentNode.id()));

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0]).toMatchObject({
        fieldName: 'parent',
        patch: { op: 'remove', path: '/properties/parent' },
      });
    });
  });
});
