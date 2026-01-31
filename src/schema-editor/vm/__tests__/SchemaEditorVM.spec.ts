import { JsonSchemaTypeName, SystemSchemaIds } from '../../types';
import type { JsonObjectSchema } from '../../model';
import { resetIdCounter } from '../../model/schema/SchemaParser';
import { SchemaEditorVM } from '../SchemaEditorVM';
import { ObjectNodeVM } from '../ObjectNodeVM';
import { PrimitiveNodeVM } from '../PrimitiveNodeVM';
import { ArrayNodeVM } from '../ArrayNodeVM';
import { ForeignKeyNodeVM } from '../ForeignKeyNodeVM';
import { RefNodeVM } from '../RefNodeVM';

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

  describe('ForeignKeyNodeVM', () => {
    it('should create ForeignKeyNodeVM for field with foreignKey', () => {
      const schema = createSchema({
        categoryId: { type: 'string', default: '', foreignKey: 'categories' },
      });

      const editor = new SchemaEditorVM(schema);
      const categoryIdVM = getObjectRoot(editor).children[0];

      expect(categoryIdVM).toBeInstanceOf(ForeignKeyNodeVM);
    });

    it('should have label "foreign key"', () => {
      const schema = createSchema({
        categoryId: { type: 'string', default: '', foreignKey: 'categories' },
      });

      const editor = new SchemaEditorVM(schema);
      const categoryIdVM = getObjectRoot(editor)
        .children[0] as ForeignKeyNodeVM;

      expect(categoryIdVM.label).toBe('foreign key');
    });

    it('should return foreignKey value', () => {
      const schema = createSchema({
        categoryId: { type: 'string', default: '', foreignKey: 'categories' },
      });

      const editor = new SchemaEditorVM(schema);
      const categoryIdVM = getObjectRoot(editor)
        .children[0] as ForeignKeyNodeVM;

      expect(categoryIdVM.foreignKeyValue).toBe('categories');
    });

    it('should create PrimitiveNodeVM for string without foreignKey', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const editor = new SchemaEditorVM(schema);
      const nameVM = getObjectRoot(editor).children[0];

      expect(nameVM).toBeInstanceOf(PrimitiveNodeVM);
      expect(nameVM).not.toBeInstanceOf(ForeignKeyNodeVM);
    });

    it('should have label "string" for regular string field', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
      });

      const editor = new SchemaEditorVM(schema);
      const nameVM = getObjectRoot(editor).children[0] as PrimitiveNodeVM;

      expect(nameVM.label).toBe('string');
    });
  });

  describe('RefNodeVM with resolved refs', () => {
    it('should create RefNodeVM for File $ref', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0];

      expect(imageVM).toBeInstanceOf(RefNodeVM);
    });

    it('should have label "File" for File ref', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0] as RefNodeVM;

      expect(imageVM.label).toBe('File');
    });

    it('should have children for resolved File ref', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0] as RefNodeVM;

      expect(imageVM.children.length).toBeGreaterThan(0);
    });

    it('should have File schema fields as children', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0] as RefNodeVM;
      const childNames = imageVM.children.map((c) => c.name);

      expect(childNames).toContain('status');
      expect(childNames).toContain('fileId');
      expect(childNames).toContain('url');
      expect(childNames).toContain('fileName');
    });

    it('should mark all children as readonly', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0] as RefNodeVM;

      for (const child of imageVM.children) {
        expect(child.isReadonly).toBe(true);
      }
    });

    it('should be collapsed by default', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0] as RefNodeVM;

      expect(imageVM.isCollapsed).toBe(true);
    });

    it('should be collapsible', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0] as RefNodeVM;

      expect(imageVM.isCollapsible).toBe(true);
    });

    it('should toggle collapsed state', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0] as RefNodeVM;

      expect(imageVM.isCollapsed).toBe(true);
      imageVM.toggleCollapsed();
      expect(imageVM.isCollapsed).toBe(false);
      imageVM.toggleCollapsed();
      expect(imageVM.isCollapsed).toBe(true);
    });

    it('should not have children for non-resolvable refs', () => {
      const schema = createSchema({
        timestamp: { $ref: SystemSchemaIds.RowCreatedAt },
      });

      const editor = new SchemaEditorVM(schema);
      const timestampVM = getObjectRoot(editor).children[0] as RefNodeVM;

      expect(timestampVM.children.length).toBe(0);
      expect(timestampVM.isCollapsible).toBe(false);
    });

    it('should hide settings menu for readonly children', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0] as RefNodeVM;

      for (const child of imageVM.children) {
        expect(child.showMenu).toBe(false);
      }
    });

    it('should hide type selector for readonly children', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0] as RefNodeVM;

      for (const child of imageVM.children) {
        expect(child.showTypeSelector).toBe(false);
      }
    });

    it('should not allow drag for readonly children', () => {
      const schema = createSchema({
        image: { $ref: SystemSchemaIds.File },
      });

      const editor = new SchemaEditorVM(schema);
      const imageVM = getObjectRoot(editor).children[0] as RefNodeVM;

      for (const child of imageVM.children) {
        expect(child.canDrag).toBe(false);
      }
    });
  });

  describe('auto-collapse', () => {
    const createLargeSchema = (fieldCount: number): JsonObjectSchema =>
      createSchema(
        Object.fromEntries(
          Array.from({ length: fieldCount }, (_, i) => [
            `field${i}`,
            { type: 'string', default: '' },
          ]),
        ),
      );

    const createSchemaWithRef = (): JsonObjectSchema =>
      createSchema({
        name: { type: 'string', default: '' },
        image: { $ref: 'urn:jsonschema:io:revisium:file-schema:1.0.0' },
      });

    it('should not collapse when collapseComplexSchemas is false', () => {
      const schema = createLargeSchema(20);

      const editor = new SchemaEditorVM(schema, {
        collapseComplexSchemas: false,
      });

      expect(getObjectRoot(editor).isCollapsed).toBe(false);
    });

    it('should not collapse small schemas even with collapseComplexSchemas true', () => {
      const schema = createSchema({
        name: { type: 'string', default: '' },
        age: { type: 'number', default: 0 },
      });

      const editor = new SchemaEditorVM(schema, {
        collapseComplexSchemas: true,
      });

      expect(getObjectRoot(editor).isCollapsed).toBe(false);
    });

    it('should not collapse root node even for large schemas', () => {
      const schema = createLargeSchema(20);

      const editor = new SchemaEditorVM(schema, {
        collapseComplexSchemas: true,
      });

      const root = getObjectRoot(editor);
      expect(root.isCollapsed).toBe(false);
    });

    it('should collapse nested objects in large schemas', () => {
      const schema = createSchema({
        ...Object.fromEntries(
          Array.from({ length: 15 }, (_, i) => [
            `field${i}`,
            { type: 'string', default: '' },
          ]),
        ),
        nested: {
          type: 'object',
          properties: {
            value: { type: 'string', default: '' },
          },
          additionalProperties: false,
          required: ['value'],
        },
      });

      const editor = new SchemaEditorVM(schema, {
        collapseComplexSchemas: true,
      });

      const nested = getObjectRoot(editor).children.find(
        (c) => c.name === 'nested',
      ) as ObjectNodeVM;

      expect(nested.isCollapsed).toBe(true);
    });

    it('should use custom collapseComplexity threshold', () => {
      const schema = createSchema({
        field1: { type: 'string', default: '' },
        field2: { type: 'string', default: '' },
        nested: {
          type: 'object',
          properties: {
            value: { type: 'string', default: '' },
          },
          additionalProperties: false,
          required: ['value'],
        },
      });

      const editor = new SchemaEditorVM(schema, {
        collapseComplexSchemas: true,
        collapseComplexity: 3,
      });

      const nested = getObjectRoot(editor).children.find(
        (c) => c.name === 'nested',
      ) as ObjectNodeVM;

      expect(nested.isCollapsed).toBe(true);
    });

    it('should always collapse $ref nodes regardless of schema complexity', () => {
      const schema = createSchemaWithRef();

      const editor = new SchemaEditorVM(schema, {
        collapseComplexSchemas: true,
      });

      const imageNode = getObjectRoot(editor).children.find(
        (c) => c.name === 'image',
      ) as RefNodeVM;

      expect(imageNode).toBeDefined();
      expect(imageNode.isCollapsed).toBe(true);
    });

    it('should collapse arrays in large schemas', () => {
      const schema = createSchema({
        ...Object.fromEntries(
          Array.from({ length: 15 }, (_, i) => [
            `field${i}`,
            { type: 'string', default: '' },
          ]),
        ),
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', default: '' },
            },
            additionalProperties: false,
            required: ['name'],
          },
          default: [],
        },
      });

      const editor = new SchemaEditorVM(schema, {
        collapseComplexSchemas: true,
      });

      const items = getObjectRoot(editor).children.find(
        (c) => c.name === 'items',
      ) as ArrayNodeVM;

      expect(items.isCollapsed).toBe(true);
    });

    it('should not collapse root node even in large schemas', () => {
      const schema = createLargeSchema(20);

      const editor = new SchemaEditorVM(schema, {
        collapseComplexSchemas: true,
      });

      expect(getObjectRoot(editor).isCollapsed).toBe(false);
    });
  });
});
