import { JsonSchemaTypeName } from '../../types';
import type { JsonObjectSchema } from '../../model';
import { resetIdCounter } from '../../model/schema/SchemaParser';
import { SchemaEditorVM } from '../SchemaEditorVM';
import { ObjectNodeVM } from '../ObjectNodeVM';
import { PrimitiveNodeVM } from '../PrimitiveNodeVM';
import { ArrayNodeVM } from '../ArrayNodeVM';

beforeEach(() => {
  resetIdCounter();
});

const createSchema = (
  properties: Record<string, unknown> = {},
): JsonObjectSchema => ({
  type: JsonSchemaTypeName.Object,
  properties: properties as JsonObjectSchema['properties'],
  additionalProperties: false,
  required: Object.keys(properties),
});

const getObjectRoot = (editor: SchemaEditorVM): ObjectNodeVM => {
  const root = editor.rootNodeVM;
  if (!(root instanceof ObjectNodeVM)) {
    throw new Error('Expected ObjectNodeVM root');
  }
  return root;
};

describe('SchemaEditorVM', () => {
  describe('initialization', () => {
    it('should create editor with root ObjectNodeVM', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const editor = new SchemaEditorVM(schema);

      expect(editor.rootNodeVM).toBeInstanceOf(ObjectNodeVM);
      expect(editor.rootNodeVM.isRoot).toBe(true);
    });

    it('should create editor with root ArrayNodeVM when schema root is array', () => {
      const schema = {
        type: 'array',
        items: { type: 'string', default: '' },
        default: [],
      } as unknown as JsonObjectSchema;

      const editor = new SchemaEditorVM(schema);

      expect(editor.rootNodeVM).toBeInstanceOf(ArrayNodeVM);
      expect(editor.rootNodeVM.isRoot).toBe(true);
    });

    it('should create editor with root PrimitiveNodeVM when schema root is primitive', () => {
      const schema = {
        type: 'string',
        default: '',
      } as unknown as JsonObjectSchema;

      const editor = new SchemaEditorVM(schema);

      expect(editor.rootNodeVM).toBeInstanceOf(PrimitiveNodeVM);
      expect(editor.rootNodeVM.isRoot).toBe(true);
    });

    it('should create children VMs for root', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
        age: { type: 'number', default: 0 },
      });

      const editor = new SchemaEditorVM(schema);

      expect(getObjectRoot(editor).children).toHaveLength(2);
      expect(getObjectRoot(editor).children[0]).toBeInstanceOf(PrimitiveNodeVM);
      expect(getObjectRoot(editor).children[1]).toBeInstanceOf(PrimitiveNodeVM);
    });

    it('should set tableId from options', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: 'users' });

      expect(editor.tableId).toBe('users');
      expect(editor.rootNodeVM.name).toBe('users');
    });
  });

  describe('tree structure', () => {
    it('should create nested ObjectNodeVM for nested objects', () => {
      const schema = createSchema({
        address: {
          type: 'object',
          properties: {
            city: { type: 'string', default: '' },
          },
          additionalProperties: false,
          required: ['city'],
        },
      });

      const editor = new SchemaEditorVM(schema);
      const addressVM = getObjectRoot(editor).children[0];

      expect(addressVM).toBeInstanceOf(ObjectNodeVM);
      expect((addressVM as ObjectNodeVM).children).toHaveLength(1);
    });

    it('should create ArrayNodeVM for arrays', () => {
      const schema = createSchema({
        tags: {
          type: 'array',
          items: { type: 'string', default: '' },
          default: [],
        },
      });

      const editor = new SchemaEditorVM(schema);
      const tagsVM = getObjectRoot(editor).children[0];

      expect(tagsVM).toBeInstanceOf(ArrayNodeVM);
      expect((tagsVM as ArrayNodeVM).itemsVM).toBeInstanceOf(PrimitiveNodeVM);
    });
  });

  describe('addProperty', () => {
    it('should add child to ObjectNodeVM', () => {
      const schema = createSchema({
        existing: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);

      getObjectRoot(editor).addProperty('newField');

      expect(getObjectRoot(editor).children).toHaveLength(2);
      expect(getObjectRoot(editor).children[1].name).toBe('newField');
    });

    it('should sync with EO tree', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema);

      getObjectRoot(editor).addProperty('field1');

      expect(editor.engine.root().properties()).toHaveLength(1);
      expect(editor.engine.root().property('field1').isNull()).toBe(false);
    });
  });

  describe('removeProperty', () => {
    it('should remove child from ObjectNodeVM', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
        age: { type: 'number', default: 0 },
      });
      const editor = new SchemaEditorVM(schema);
      const nameVM = getObjectRoot(editor).children[0];

      getObjectRoot(editor).removeProperty(nameVM);

      expect(getObjectRoot(editor).children).toHaveLength(1);
      expect(getObjectRoot(editor).children[0].name).toBe('age');
    });

    it('should sync with EO tree', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);
      const nameVM = getObjectRoot(editor).children[0];

      getObjectRoot(editor).removeProperty(nameVM);

      expect(editor.engine.root().properties()).toHaveLength(0);
    });
  });

  describe('replaceProperty (changeType)', () => {
    it('should replace primitive with different type', () => {
      const schema = createSchema({
        value: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);
      const valueVM = getObjectRoot(editor).children[0];

      valueVM.changeType('Number');

      expect(getObjectRoot(editor).children).toHaveLength(1);
      expect(getObjectRoot(editor).children[0].node.nodeType()).toBe('number');
      expect(getObjectRoot(editor).children[0].name).toBe('value');
    });

    it('should wrap node in array', () => {
      const schema = createSchema({
        value: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);
      const valueVM = getObjectRoot(editor).children[0];

      valueVM.changeType('Array');

      expect(getObjectRoot(editor).children).toHaveLength(1);
      expect(getObjectRoot(editor).children[0]).toBeInstanceOf(ArrayNodeVM);
      expect(getObjectRoot(editor).children[0].name).toBe('value');
    });

    it('should preserve field order after type change', () => {
      const schema = createSchema({
        first: { type: 'string', default: '' },
        second: { type: 'string', default: '' },
        third: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);
      const secondVM = getObjectRoot(editor).children[1];

      secondVM.changeType('Number');

      const names = getObjectRoot(editor).children.map((c) => c.name);
      expect(names).toEqual(['first', 'second', 'third']);
    });
  });

  describe('removeSelf', () => {
    it('should remove node via parent', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);
      const nameVM = getObjectRoot(editor).children[0];

      nameVM.removeSelf();

      expect(getObjectRoot(editor).children).toHaveLength(0);
    });
  });

  describe('changeType on root', () => {
    it('should change root object to array', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);

      expect(editor.rootNodeVM).toBeInstanceOf(ObjectNodeVM);

      editor.rootNodeVM.changeType('Array');

      expect(editor.rootNodeVM).toBeInstanceOf(ArrayNodeVM);
      expect(editor.rootNodeVM.isRoot).toBe(true);
    });

    it('should change root object to string', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema);

      editor.rootNodeVM.changeType('String');

      expect(editor.rootNodeVM).toBeInstanceOf(PrimitiveNodeVM);
      expect(editor.rootNodeVM.node.nodeType()).toBe('string');
      expect(editor.rootNodeVM.isRoot).toBe(true);
    });

    it('should preserve tableId (name) after root type change', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: 'users' });

      editor.rootNodeVM.changeType('Array');

      expect(editor.rootNodeVM.name).toBe('users');
    });
  });

  describe('UI state', () => {
    it('should have collapsed state per VM', () => {
      const schema = createSchema({
        nested: {
          type: 'object',
          properties: {
            field: { type: 'string', default: '' },
          },
          additionalProperties: false,
          required: ['field'],
        },
      });
      const editor = new SchemaEditorVM(schema);
      const nestedVM = getObjectRoot(editor).children[0] as ObjectNodeVM;

      expect(nestedVM.isCollapsed).toBe(false);

      nestedVM.toggleCollapsed();

      expect(nestedVM.isCollapsed).toBe(true);
    });

    it('should have focused state per VM', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);
      const nameVM = getObjectRoot(editor).children[0];

      expect(nameVM.isFocused).toBe(false);

      nameVM.setFocused(true);

      expect(nameVM.isFocused).toBe(true);
    });
  });

  describe('changeItemsType', () => {
    it('should create nested array VM when changing items type to array', () => {
      const schema = createSchema({
        items: {
          type: 'array',
          items: { type: 'string', default: '' },
        },
      });
      const editor = new SchemaEditorVM(schema);

      const arrayVM = getObjectRoot(editor).children[0] as ArrayNodeVM;
      expect(arrayVM).toBeInstanceOf(ArrayNodeVM);
      expect(arrayVM.itemsVM).toBeInstanceOf(PrimitiveNodeVM);

      arrayVM.changeItemsType('Array');

      expect(arrayVM.itemsVM).toBeInstanceOf(ArrayNodeVM);
      const innerArrayVM = arrayVM.itemsVM as ArrayNodeVM;
      expect(innerArrayVM.itemsVM).toBeInstanceOf(PrimitiveNodeVM);
    });

    it('should update model correctly when changing string items to array', () => {
      const schema = createSchema({
        werwer: {
          type: 'array',
          items: { type: 'string', default: '' },
        },
      });
      const editor = new SchemaEditorVM(schema);

      const arrayVM = getObjectRoot(editor).children[0] as ArrayNodeVM;
      arrayVM.changeItemsType('Array');

      const arrayNode = editor.engine.root().property('werwer');
      expect(arrayNode.isArray()).toBe(true);

      const innerArrayNode = arrayNode.items();
      expect(innerArrayNode.isArray()).toBe(true);

      const innerStringNode = innerArrayNode.items();
      expect(innerStringNode.isNull()).toBe(false);
    });

    it('inner array itemsVM should not be null after changeItemsType', () => {
      const schema = createSchema({
        data: {
          type: 'array',
          items: { type: 'string', default: '' },
        },
      });
      const editor = new SchemaEditorVM(schema);

      const outerArrayVM = getObjectRoot(editor).children[0] as ArrayNodeVM;
      outerArrayVM.changeItemsType('Array');

      const innerArrayVM = outerArrayVM.itemsVM as ArrayNodeVM;
      expect(innerArrayVM).not.toBeNull();
      expect(innerArrayVM.itemsVM).not.toBeNull();
      expect(innerArrayVM.itemsVMRef).not.toBeNull();
    });
  });

  describe('revert', () => {
    it('should recreate VM tree after revert', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);
      const originalRootVM = editor.rootNodeVM;

      getObjectRoot(editor).addProperty('newField');
      expect(getObjectRoot(editor).children).toHaveLength(2);

      editor.revert();

      expect(editor.rootNodeVM).not.toBe(originalRootVM);
      expect(getObjectRoot(editor).children).toHaveLength(1);
    });
  });

  describe('dirty state', () => {
    it('should track dirty state', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);

      expect(editor.isDirty).toBe(false);

      getObjectRoot(editor).addProperty('newField');

      expect(editor.isDirty).toBe(true);
    });

    it('should clear dirty state after markAsSaved', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);

      getObjectRoot(editor).addProperty('newField');
      expect(editor.isDirty).toBe(true);

      editor.markAsSaved();

      expect(editor.isDirty).toBe(false);
    });
  });

  describe('MobX reactivity', () => {
    it('should trigger MobX reaction when markAsSaved clears dirty state', async () => {
      const { autorun } = await import('mobx');

      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);

      const dirtyValues: boolean[] = [];
      const dispose = autorun(() => {
        dirtyValues.push(editor.isDirty);
      });

      getObjectRoot(editor).addProperty('newField');
      editor.markAsSaved();

      dispose();

      expect(dirtyValues).toEqual([false, true, false]);
    });
  });

  describe('tableId tracking', () => {
    it('should track initial tableId', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: 'users' });

      expect(editor.tableId).toBe('users');
      expect(editor.initialTableId).toBe('users');
    });

    it('should detect tableId change', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: 'users' });

      expect(editor.isTableIdChanged).toBe(false);

      editor.setTableId('customers');

      expect(editor.isTableIdChanged).toBe(true);
      expect(editor.tableId).toBe('customers');
      expect(editor.initialTableId).toBe('users');
    });

    it('should not detect change when tableId set to same value', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: 'users' });

      editor.setTableId('users');

      expect(editor.isTableIdChanged).toBe(false);
    });

    it('should reset tableId tracking after markAsSaved', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: 'users' });

      editor.setTableId('customers');
      expect(editor.isTableIdChanged).toBe(true);

      editor.markAsSaved();

      expect(editor.isTableIdChanged).toBe(false);
      expect(editor.initialTableId).toBe('customers');
    });

    it('should reset tableId tracking after revert', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: 'users' });

      editor.setTableId('customers');
      expect(editor.isTableIdChanged).toBe(true);

      editor.revert();

      expect(editor.isTableIdChanged).toBe(false);
      expect(editor.tableId).toBe('users');
    });
  });

  describe('tableId validation', () => {
    it('should return no error for valid tableId', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: 'users' });

      expect(editor.tableIdError).toBeNull();
    });

    it('should return error for empty tableId', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: '' });

      expect(editor.tableIdError).not.toBeNull();
    });

    it('should return error for tableId starting with __', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: '__system' });

      expect(editor.tableIdError).not.toBeNull();
    });

    it('should return error for tableId with invalid characters', () => {
      const schema = createSchema({});
      const editor = new SchemaEditorVM(schema, { tableId: 'my table' });

      expect(editor.tableIdError).not.toBeNull();
    });

    it('should include tableId error in hasErrors', () => {
      const schema = createSchema({ name: { type: 'string', default: '' } });
      const editor = new SchemaEditorVM(schema, { tableId: '' });

      expect(editor.hasErrors).toBe(true);
    });
  });

  describe('isDirty with tableId', () => {
    it('should be dirty when only tableId changed', () => {
      const schema = createSchema({ name: { type: 'string', default: '' } });
      const editor = new SchemaEditorVM(schema, { tableId: 'users' });

      expect(editor.isDirty).toBe(false);

      editor.setTableId('customers');

      expect(editor.isDirty).toBe(true);
    });

    it('should clear dirty state after markAsSaved', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);

      editor.rootNodeVM.addProperty('newField');
      expect(editor.isDirty).toBe(true);

      editor.markAsSaved();

      expect(editor.isDirty).toBe(false);
    });
  });

  describe('MobX reactivity', () => {
    it('should trigger MobX reaction when markAsSaved clears dirty state', async () => {
      const { autorun } = await import('mobx');

      const schema = createSchema({
        name: { type: 'string', default: '' },
      });
      const editor = new SchemaEditorVM(schema);

      const dirtyValues: boolean[] = [];
      const dispose = autorun(() => {
        dirtyValues.push(editor.isDirty);
      });

      editor.rootNodeVM.addProperty('newField');
      editor.markAsSaved();

      dispose();

      expect(dirtyValues).toEqual([false, true, false]);
    });
  });
});
