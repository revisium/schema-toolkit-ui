import { SchemaTree } from '../../tree/SchemaTree';
import { SchemaParser, resetIdCounter } from '../../schema/SchemaParser';
import { SchemaDiff } from '../SchemaDiff';
import { type SchemaPatch, type JsonPatch } from '../SchemaPatch';
import { NodeFactory } from '../../node/NodeFactory';
import { ParsedFormula } from '../../formula/ParsedFormula';
import {
  arrayField,
  createSchema,
  numberField,
  objectField,
  stringField,
  formulaField,
  stringFormulaField,
  withDescription,
} from '../../__tests__/test-helpers';
import type { JsonObjectSchema, JsonSchemaType } from '../../schema/JsonSchema';
import type { StringNode } from '../../node/StringNode';
import type { NumberNode } from '../../node/NumberNode';

beforeEach(() => {
  resetIdCounter();
});

const createTreeAndDiff = (
  properties: Record<string, unknown>,
): { tree: SchemaTree; diff: SchemaDiff } => {
  const schema: JsonObjectSchema = createSchema(properties);
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

const toJsonPatches = (patches: SchemaPatch[]): JsonPatch[] =>
  patches.map((p) => p.patch);

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

      const patches = toJsonPatches(diff.getPatches());

      const addPatch = patches.find(
        (p) => p.op === 'add' && p.path.includes('new'),
      );
      expect(addPatch).toBeDefined();
      expect(addPatch?.op).toBe('add');
      expect(addPatch?.path).toBe('/properties/nested/properties/new');
    });

    it('generates patch with correct field name for nested add', () => {
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

      const addPatch = patches.find(
        (p) => p.patch.op === 'add' && p.patch.path.includes('new'),
      );
      expect(addPatch).toBeDefined();
      expect(addPatch?.patch.op).toBe('add');
      expect(addPatch?.fieldName).toBe('nested.new');
    });
  });

  describe('adding top-level field', () => {
    it('generates add patch for new top-level field', () => {
      const { tree, diff } = createTreeAndDiff({
        existing: stringField(),
      });

      const newNode = NodeFactory.string('newField');
      tree.addChildTo(tree.root().id(), newNode);

      const patches = toJsonPatches(diff.getPatches());

      expect(patches).toHaveLength(1);
      expect(patches[0].op).toBe('add');
      expect(patches[0].path).toBe('/properties/newField');
    });
  });

  describe('modifying field', () => {
    it('generates replace patch when field value changes', () => {
      const { tree, diff } = createTreeAndDiff({
        name: stringField('initial'),
      });

      const nameNode = tree.root().property('name') as StringNode;
      nameNode.setDefaultValue('modified');

      const patches = toJsonPatches(diff.getPatches());

      expect(patches).toHaveLength(1);
      expect(patches[0].op).toBe('replace');
      expect(patches[0].path).toBe('/properties/name');
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

      const patches = toJsonPatches(diff.getPatches());

      const removePatch = patches.find((p) => p.op === 'remove');
      expect(removePatch).toBeDefined();
      expect(removePatch?.path).toBe('/properties/name');
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

      const patches = toJsonPatches(diff.getPatches());

      const removePatch = patches.find(
        (p) => p.op === 'remove' && p.path.includes('fieldA'),
      );
      expect(removePatch).toBeDefined();
      expect(removePatch?.path).toBe('/properties/nested/properties/fieldA');
    });

    it('generates patch with correct field name for nested remove', () => {
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

      const removePatch = patches.find(
        (p) => p.patch.op === 'remove' && p.patch.path.includes('fieldA'),
      );
      expect(removePatch).toBeDefined();
      expect(removePatch?.fieldName).toBe('nested.fieldA');
    });
  });

  describe('renaming field', () => {
    it('generates move patch when field is renamed', () => {
      const { tree, diff } = createTreeAndDiff({
        oldName: stringField(),
      });

      const node = tree.root().property('oldName');
      tree.renameNode(node.id(), 'newName');

      const patches = toJsonPatches(diff.getPatches());

      expect(patches).toHaveLength(1);
      expect(patches[0].op).toBe('move');
      expect(patches[0].from).toBe('/properties/oldName');
      expect(patches[0].path).toBe('/properties/newName');
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

      const patches = toJsonPatches(diff.getPatches());

      const addPatch = patches.find((p) => p.op === 'add');
      expect(addPatch).toBeDefined();
      expect(addPatch?.path).toBe(
        '/properties/items/items/properties/newField',
      );
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

      const patches = toJsonPatches(diff.getPatches());

      const removePatch = patches.find((p) => p.op === 'remove');
      expect(removePatch).toBeDefined();
      expect(removePatch?.path).toBe(
        '/properties/items/items/properties/fieldA',
      );
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

      const patches = toJsonPatches(diff.getPatches());

      const replacePatch = patches.find((p) => p.op === 'replace');
      expect(replacePatch).toBeDefined();
      expect(replacePatch?.path).toBe('/properties/items/items');
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

      const patches = toJsonPatches(diff.getPatches());

      expect(patches).toHaveLength(1);
      expect(patches[0].op).toBe('move');
      expect(patches[0].from).toBe(
        '/properties/items/items/properties/oldName',
      );
      expect(patches[0].path).toBe(
        '/properties/items/items/properties/newName',
      );
    });

    it('generates correct fieldName for array items in patches', () => {
      const { tree, diff } = createTreeAndDiff({
        items: arrayField(
          objectField({
            name: stringField(),
          }),
        ),
      });

      const itemsNode = tree.root().property('items');
      const itemsItems = itemsNode.items();
      tree.addChildTo(itemsItems.id(), NodeFactory.string('newField'));

      const patches = diff.getPatches();

      const addPatch = patches.find((p) => p.patch.op === 'add');
      expect(addPatch?.fieldName).toBe('items[*].newField');
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

      const patches = toJsonPatches(diff.getPatches());

      expect(patches).toHaveLength(1);
      expect(patches[0].op).toBe('replace');
      expect(patches[0].path).toBe('/properties/nested');
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

      const patches = toJsonPatches(diff.getPatches());

      expect(patches).toHaveLength(1);
      expect(patches[0].op).toBe('move');
      expect(patches[0].from).toBe('/properties/nested/properties/oldName');
      expect(patches[0].path).toBe('/properties/nested/properties/newName');
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

      const patches = toJsonPatches(diff.getPatches());

      expect(patches.find((p) => p.op === 'replace')).toBeDefined();
      expect(patches.find((p) => p.op === 'remove')).toBeDefined();
      expect(patches.find((p) => p.op === 'add')).toBeDefined();
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

      const replacePatch = patches.find((p) => p.patch.op === 'replace');
      expect(replacePatch?.typeChange).toBeDefined();
      expect(replacePatch?.typeChange?.fromType).toBe('string');
      expect(replacePatch?.typeChange?.toType).toBe('number');
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

      const replacePatch = patches.find((p) => p.patch.op === 'replace');
      expect(replacePatch?.formulaChange).toBeDefined();
      expect(replacePatch?.formulaChange?.fromFormula).toBe('value * 2');
      expect(replacePatch?.formulaChange?.toFormula).toBeUndefined();
    });

    it('detects default value change', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringField('initial'),
      });

      const fieldNode = tree.root().property('field') as StringNode;
      fieldNode.setDefaultValue('modified');

      const patches = diff.getPatches();

      const replacePatch = patches.find((p) => p.patch.op === 'replace');
      expect(replacePatch?.defaultChange).toBeDefined();
      expect(replacePatch?.defaultChange?.fromDefault).toBe('initial');
      expect(replacePatch?.defaultChange?.toDefault).toBe('modified');
    });

    it('detects description change', () => {
      const { tree, diff } = createTreeAndDiff({
        field: withDescription(stringField(), 'old description'),
      });

      const fieldNode = tree.root().property('field');
      fieldNode.setMetadata({ description: 'new description' });

      const patches = diff.getPatches();

      const replacePatch = patches.find((p) => p.patch.op === 'replace');
      expect(replacePatch?.descriptionChange).toBeDefined();
      expect(replacePatch?.descriptionChange?.fromDescription).toBe(
        'old description',
      );
      expect(replacePatch?.descriptionChange?.toDescription).toBe(
        'new description',
      );
    });

    it('detects deprecated change', () => {
      const { tree, diff } = createTreeAndDiff({
        field: stringField(),
      });

      const fieldNode = tree.root().property('field');
      fieldNode.setMetadata({ deprecated: true });

      const patches = diff.getPatches();

      const replacePatch = patches.find((p) => p.patch.op === 'replace');
      expect(replacePatch?.deprecatedChange).toBeDefined();
      expect(replacePatch?.deprecatedChange?.fromDeprecated).toBeUndefined();
      expect(replacePatch?.deprecatedChange?.toDeprecated).toBe(true);
    });

    it('marks move as rename when parent is same', () => {
      const { tree, diff } = createTreeAndDiff({
        oldName: stringField(),
      });

      tree.renameNode(tree.root().property('oldName').id(), 'newName');

      const patches = diff.getPatches();

      expect(patches).toHaveLength(1);
      expect(patches[0].patch.op).toBe('move');
      expect(patches[0].isRename).toBe(true);
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
        const addPatch = patches.find((p) => p.patch.op === 'add');

        expect(addPatch?.formulaChange).toBeDefined();
        expect(addPatch?.formulaChange?.fromFormula).toBeUndefined();
        expect(addPatch?.formulaChange?.toFormula).toBe('value * 2');
      });

      it('includes description in add patch when field has description', () => {
        const { tree, diff } = createTreeAndDiff({});

        const newNode = NodeFactory.string('field');
        newNode.setMetadata({ description: 'My description' });
        tree.addChildTo(tree.root().id(), newNode);

        const patches = diff.getPatches();
        const addPatch = patches.find((p) => p.patch.op === 'add');

        expect(addPatch?.descriptionChange).toBeDefined();
        expect(addPatch?.descriptionChange?.fromDescription).toBeUndefined();
        expect(addPatch?.descriptionChange?.toDescription).toBe(
          'My description',
        );
      });

      it('includes deprecated in add patch when field is deprecated', () => {
        const { tree, diff } = createTreeAndDiff({});

        const newNode = NodeFactory.string('field');
        newNode.setMetadata({ deprecated: true });
        tree.addChildTo(tree.root().id(), newNode);

        const patches = diff.getPatches();
        const addPatch = patches.find((p) => p.patch.op === 'add');

        expect(addPatch?.deprecatedChange).toBeDefined();
        expect(addPatch?.deprecatedChange?.fromDeprecated).toBeUndefined();
        expect(addPatch?.deprecatedChange?.toDeprecated).toBe(true);
      });

      it('includes default value in add patch', () => {
        const { tree, diff } = createTreeAndDiff({});

        const newNode = NodeFactory.string('field');
        newNode.setDefaultValue('my default');
        tree.addChildTo(tree.root().id(), newNode);

        const patches = diff.getPatches();
        const addPatch = patches.find((p) => p.patch.op === 'add');

        expect(addPatch?.defaultChange).toBeDefined();
        expect(addPatch?.defaultChange?.fromDefault).toBeUndefined();
        expect(addPatch?.defaultChange?.toDefault).toBe('my default');
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

      const patches = toJsonPatches(diff.getPatches());

      const removePatches = patches.filter((p) => p.op === 'remove');
      expect(removePatches).toHaveLength(1);
      expect(removePatches[0].path).toBe('/properties/parent');
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

      const patches = toJsonPatches(diff.getPatches());

      const movePatches = patches.filter((p) => p.op === 'move');
      expect(movePatches).toHaveLength(1);
      expect(movePatches[0].from).toBe('/properties/oldParent');
      expect(movePatches[0].path).toBe('/properties/newParent');
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

      const patches = toJsonPatches(diff.getPatches());

      expect(patches).toHaveLength(2);
      expect(patches[0].op).toBe('move');
      expect(patches[1].op).toBe('replace');
      expect(patches[1].path).toBe('/properties/newName');
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

      const patches = toJsonPatches(diff.getPatches());

      const moveIndex = patches.findIndex((p) => p.op === 'move');
      const addIndex = patches.findIndex((p) => p.op === 'add');
      const removeIndex = patches.findIndex((p) => p.op === 'remove');

      expect(moveIndex).toBeLessThan(addIndex);
      expect(moveIndex).toBeLessThan(removeIndex);
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

      const patches = toJsonPatches(diff.getPatches());

      const moveIndex = patches.findIndex(
        (p) => p.op === 'move' && p.path === '/properties/newParent',
      );
      const addIndex = patches.findIndex(
        (p) =>
          p.op === 'add' &&
          p.path === '/properties/newParent/properties/newChild',
      );

      expect(moveIndex).not.toBe(-1);
      expect(addIndex).not.toBe(-1);
      expect(moveIndex).toBeLessThan(addIndex);
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

      const patches = toJsonPatches(diff.getPatches());

      const movePatch = patches.find(
        (p) => p.op === 'move' && p.path === '/properties/newParent',
      );
      expect(movePatch).toBeDefined();
      expect(movePatch?.from).toBe('/properties/oldParent');

      const hasRemoveOrReplace = patches.some(
        (p) =>
          (p.op === 'remove' && p.path.includes('childToRemove')) ||
          (p.op === 'replace' && p.path === '/properties/newParent'),
      );
      expect(hasRemoveOrReplace).toBe(true);
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

      const patches = toJsonPatches(diff.getPatches());

      const schema = diff.getBaseSchema();
      const result = applyPatches(schema, patches);

      expect(result.properties?.fieldA).toBeDefined();
      expect(result.properties?.fieldB).toBeDefined();
      expect((result.properties?.fieldB as { default: string }).default).toBe(
        'modified',
      );
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

      const patches = toJsonPatches(diff.getPatches());

      const schema = diff.getBaseSchema();
      const result = applyPatches(schema, patches);

      expect(
        (result.properties?.source as JsonObjectSchema).properties?.fieldToMove,
      ).toBeUndefined();
      expect(
        (result.properties?.target as JsonObjectSchema).properties?.fieldToMove,
      ).toBeDefined();
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

      const patches = toJsonPatches(diff.getPatches());

      const schema = diff.getBaseSchema();
      const result = applyPatches(schema, patches);

      expect(result.properties?.renamed1).toBeDefined();
      const r1 = result.properties?.renamed1 as JsonObjectSchema;
      expect(r1.properties?.renamed2).toBeDefined();
      const r2 = r1.properties?.renamed2 as JsonObjectSchema;
      expect(r2.properties?.renamed3).toBeDefined();
      const r3 = r2.properties?.renamed3 as JsonObjectSchema;
      expect(r3.properties?.deepField).toBeDefined();
    });

    it('rename field to name of removed field', () => {
      const { tree, diff } = createTreeAndDiff({
        fieldA: stringField('a'),
        fieldB: stringField('b'),
      });

      tree.removeNodeAt(tree.pathOf(tree.root().property('fieldA').id()));
      tree.renameNode(tree.root().property('fieldB').id(), 'fieldA');

      const patches = toJsonPatches(diff.getPatches());

      expect(patches.length).toBeGreaterThanOrEqual(1);

      const movePatch = patches.find(
        (p) =>
          p.op === 'move' &&
          p.from === '/properties/fieldB' &&
          p.path === '/properties/fieldA',
      );
      expect(movePatch).toBeDefined();
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

      const patches = toJsonPatches(diff.getPatches());

      const schema = diff.getBaseSchema();
      const result = applyPatches(schema, patches);

      expect(result.properties?.x).toBeDefined();
      expect(result.properties?.y).toBeDefined();
      expect(result.properties?.z).toBeDefined();
      expect(result.properties?.a).toBeUndefined();
      expect(result.properties?.b).toBeUndefined();
      expect(result.properties?.c).toBeUndefined();
    });

    it('add then remove same path in sequence - net effect is no change', () => {
      const { tree, diff } = createTreeAndDiff({
        existing: stringField(),
      });

      tree.addChildTo(tree.root().id(), NodeFactory.string('temporary'));
      tree.removeNodeAt(tree.pathOf(tree.root().property('temporary').id()));

      const patches = toJsonPatches(diff.getPatches());

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

      const patches = toJsonPatches(diff.getPatches());

      const schema = diff.getBaseSchema();
      const result = applyPatches(schema, patches);

      const itemsSchema = result.properties?.items as {
        items: JsonObjectSchema;
      };
      expect(itemsSchema.items.properties?.newField).toBeDefined();
      expect(itemsSchema.items.properties?.oldField).toBeUndefined();
      expect(
        (itemsSchema.items.properties?.newField as { default: string }).default,
      ).toBe('modified');
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

      const patches = toJsonPatches(diff.getPatches());

      const replacePatch = patches.find((p) => p.op === 'replace');
      expect(replacePatch).toBeDefined();
      expect(replacePatch?.path).toBe('/properties/field');
      expect((replacePatch?.value as JsonObjectSchema).type).toBe('object');
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

      const patches = toJsonPatches(diff.getPatches());

      const replacePatch = patches.find((p) => p.op === 'replace');
      expect(replacePatch).toBeDefined();
      expect((replacePatch?.value as { type: string }).type).toBe('array');
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

      const patches = toJsonPatches(diff.getPatches());

      const replacePatch = patches.find((p) => p.op === 'replace');
      expect(replacePatch).toBeDefined();
      expect((replacePatch?.value as { type: string }).type).toBe('string');
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

      const patches = toJsonPatches(diff.getPatches());

      const replacePatch = patches.find((p) => p.op === 'replace');
      expect(replacePatch).toBeDefined();
      expect((replacePatch?.value as { type: string }).type).toBe('array');
    });
  });
});

function applyPatches(
  schema: JsonObjectSchema,
  patches: JsonPatch[],
): JsonObjectSchema {
  let result = JSON.parse(JSON.stringify(schema)) as JsonObjectSchema;

  for (const patch of patches) {
    result = applyPatch(result, patch);
  }

  return result;
}

function applyPatch(
  schema: JsonObjectSchema,
  patch: JsonPatch,
): JsonObjectSchema {
  const result = JSON.parse(JSON.stringify(schema)) as JsonObjectSchema;

  switch (patch.op) {
    case 'add':
    case 'replace': {
      const { parent, key } = resolvePath(result, patch.path);
      if (parent && key) {
        (parent as Record<string, unknown>)[key] = patch.value;
      }
      break;
    }
    case 'remove': {
      const { parent, key } = resolvePath(result, patch.path);
      if (parent && key) {
        delete (parent as Record<string, unknown>)[key];
      }
      break;
    }
    case 'move': {
      if (!patch.from) {
        break;
      }
      const { parent: fromParent, key: fromKey } = resolvePath(
        result,
        patch.from,
      );
      const value =
        fromParent && fromKey
          ? (fromParent as Record<string, unknown>)[fromKey]
          : undefined;
      if (fromParent && fromKey) {
        delete (fromParent as Record<string, unknown>)[fromKey];
      }
      const { parent: toParent, key: toKey } = resolvePath(result, patch.path);
      if (toParent && toKey) {
        (toParent as Record<string, unknown>)[toKey] = value;
      }
      break;
    }
  }

  return result;
}

function resolvePath(
  obj: JsonObjectSchema,
  path: string,
): { parent: JsonSchemaType | null; key: string | null } {
  const parts = path.split('/').filter(Boolean);
  let current: unknown = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current && typeof current === 'object' && part) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return { parent: null, key: null };
    }
  }

  return {
    parent: current as JsonSchemaType,
    key: parts[parts.length - 1] ?? null,
  };
}
