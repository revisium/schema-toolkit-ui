import { SchemaTree } from '../tree/SchemaTree';
import { SchemaParser, resetIdCounter } from '../schema/SchemaParser';
import { SchemaDiff } from '../diff/SchemaDiff';
import { NodeFactory } from '../factory/NodeFactory';
import {
  createSchema,
  numberField,
  objectField,
  stringField,
  formulaField,
  stringFormulaField,
} from './test-helpers';
import type { JsonObjectSchema } from '../schema/JsonSchema';
import type { StringNode } from '../node/StringNode';

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
  const diff = new SchemaDiff(tree, schema);
  return { tree, diff };
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

      const nestedNode = tree.root().child('nested');
      const newNode = NodeFactory.string('new');
      tree.addChildTo(nestedNode.id(), newNode);

      const patches = diff.getPatches();

      const addPatch = patches.find(
        (p) => p.op === 'add' && p.path.includes('new'),
      );
      expect(addPatch).toBeDefined();
      expect(addPatch?.op).toBe('add');
      expect(addPatch?.path).toBe('/properties/nested/properties/new');
    });

    it('generates rich patch with correct field name for nested add', () => {
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

      const nestedNode = tree.root().child('nested');
      const newNode = NodeFactory.string('new');
      tree.addChildTo(nestedNode.id(), newNode);

      const richPatches = diff.getRichPatches();

      const addPatch = richPatches.find(
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

      const patches = diff.getPatches();

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

      const nameNode = tree.root().child('name') as StringNode;
      nameNode.setDefaultValue('modified');

      const patches = diff.getPatches();

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

      const nameNode = tree.root().child('name');
      tree.removeNodeAt(tree.pathOf(nameNode.id()));

      const patches = diff.getPatches();

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

      const nestedNode = tree.root().child('nested');
      const fieldANode = nestedNode.child('fieldA');
      tree.removeNodeAt(tree.pathOf(fieldANode.id()));

      const patches = diff.getPatches();

      const removePatch = patches.find(
        (p) => p.op === 'remove' && p.path.includes('fieldA'),
      );
      expect(removePatch).toBeDefined();
      expect(removePatch?.path).toBe('/properties/nested/properties/fieldA');
    });

    it('generates rich patch with correct field name for nested remove', () => {
      const { tree, diff } = createTreeAndDiff({
        nested: objectField({
          fieldA: stringField(),
          fieldB: stringField(),
        }),
      });

      const nestedNode = tree.root().child('nested');
      const fieldANode = nestedNode.child('fieldA');
      tree.removeNodeAt(tree.pathOf(fieldANode.id()));

      const richPatches = diff.getRichPatches();

      const removePatch = richPatches.find(
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

      const node = tree.root().child('oldName');
      tree.renameNode(node.id(), 'newName');

      const patches = diff.getPatches();

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

      const newSchema = diff.getCurrentSchema();
      diff.markAsSaved(newSchema);

      expect(diff.isDirty()).toBe(false);
    });
  });
});
