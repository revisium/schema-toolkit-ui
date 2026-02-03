import {
  JsonSchemaTypeName,
  type JsonObjectSchema,
} from '@revisium/schema-toolkit';
import { SchemaTypeIds } from '../../config';

import { ObjectNodeVM } from '../node/ObjectNodeVM';
import { PrimitiveNodeVM } from '../node/PrimitiveNodeVM';
import { ForeignKeyNodeVM } from '../node/ForeignKeyNodeVM';
import '../node/ArrayNodeVM';
import '../node/RefNodeVM';

import { SchemaEditorVM } from '../SchemaEditorVM';

const createSimpleSchema = (): JsonObjectSchema => ({
  type: JsonSchemaTypeName.Object,
  additionalProperties: false,
  required: ['name', 'age'],
  properties: {
    name: {
      type: JsonSchemaTypeName.String,
      default: '',
    },
    age: {
      type: JsonSchemaTypeName.Number,
      default: 0,
    },
  },
});

const createSchemaWithForeignKey = (): JsonObjectSchema => ({
  type: JsonSchemaTypeName.Object,
  additionalProperties: false,
  required: ['categoryId'],
  properties: {
    categoryId: {
      type: JsonSchemaTypeName.String,
      default: '',
      foreignKey: 'categories',
    },
  },
});

describe('ObjectNodeVM.replaceProperty - ForeignKey', () => {
  describe('changing field type to ForeignKey', () => {
    it('converts string field to ForeignKeyNodeVM with empty foreignKey', () => {
      const editor = new SchemaEditorVM(createSimpleSchema());
      const rootVM = editor.rootNodeVM as ObjectNodeVM;
      const nameVM = rootVM.propertyList.find((vm) => vm.name === 'name');

      expect(nameVM).toBeInstanceOf(PrimitiveNodeVM);
      expect(nameVM).toBeDefined();

      rootVM.replaceProperty(nameVM!, SchemaTypeIds.ForeignKeyString);

      const updatedVM = rootVM.propertyList.find((vm) => vm.name === 'name');
      expect(updatedVM).toBeInstanceOf(ForeignKeyNodeVM);
      expect((updatedVM as ForeignKeyNodeVM).foreignKeyValue).toBe('');
    });

    it('converts number field to ForeignKeyNodeVM', () => {
      const editor = new SchemaEditorVM(createSimpleSchema());
      const rootVM = editor.rootNodeVM as ObjectNodeVM;
      const ageVM = rootVM.propertyList.find((vm) => vm.name === 'age');

      expect(ageVM).toBeInstanceOf(PrimitiveNodeVM);
      expect(ageVM).toBeDefined();
      expect(ageVM?.node.nodeType()).toBe('number');

      rootVM.replaceProperty(ageVM!, SchemaTypeIds.ForeignKeyString);

      const updatedVM = rootVM.propertyList.find((vm) => vm.name === 'age');
      expect(updatedVM).toBeInstanceOf(ForeignKeyNodeVM);
      expect(updatedVM?.node.nodeType()).toBe('string');
      expect((updatedVM as ForeignKeyNodeVM).foreignKeyValue).toBe('');
    });

    it('marks model as dirty after conversion from non-string type', () => {
      const editor = new SchemaEditorVM(createSimpleSchema());
      const rootVM = editor.rootNodeVM as ObjectNodeVM;
      const ageVM = rootVM.propertyList.find((vm) => vm.name === 'age');

      expect(editor.isDirty).toBe(false);
      expect(ageVM).toBeDefined();

      rootVM.replaceProperty(ageVM!, SchemaTypeIds.ForeignKeyString);

      expect(editor.isDirty).toBe(true);
    });
  });

  describe('changing ForeignKey to other types', () => {
    it('converts ForeignKeyNodeVM to string PrimitiveNodeVM', () => {
      const editor = new SchemaEditorVM(createSchemaWithForeignKey());
      const rootVM = editor.rootNodeVM as ObjectNodeVM;
      const categoryIdVM = rootVM.propertyList.find(
        (vm) => vm.name === 'categoryId',
      );

      expect(categoryIdVM).toBeInstanceOf(ForeignKeyNodeVM);
      expect(categoryIdVM).toBeDefined();

      rootVM.replaceProperty(categoryIdVM!, SchemaTypeIds.String);

      const updatedVM = rootVM.propertyList.find(
        (vm) => vm.name === 'categoryId',
      );
      expect(updatedVM).toBeInstanceOf(PrimitiveNodeVM);
      expect(updatedVM?.node.nodeType()).toBe('string');
      expect(updatedVM?.node.foreignKey()).toBeUndefined();
    });

    it('converts ForeignKeyNodeVM to number PrimitiveNodeVM', () => {
      const editor = new SchemaEditorVM(createSchemaWithForeignKey());
      const rootVM = editor.rootNodeVM as ObjectNodeVM;
      const categoryIdVM = rootVM.propertyList.find(
        (vm) => vm.name === 'categoryId',
      );

      expect(categoryIdVM).toBeInstanceOf(ForeignKeyNodeVM);
      expect(categoryIdVM).toBeDefined();

      rootVM.replaceProperty(categoryIdVM!, SchemaTypeIds.Number);

      const updatedVM = rootVM.propertyList.find(
        (vm) => vm.name === 'categoryId',
      );
      expect(updatedVM).toBeInstanceOf(PrimitiveNodeVM);
      expect(updatedVM?.node.nodeType()).toBe('number');
    });
  });

  describe('ForeignKeyNodeVM.changeType', () => {
    it('delegates to parent replaceProperty', () => {
      const editor = new SchemaEditorVM(createSchemaWithForeignKey());
      const rootVM = editor.rootNodeVM as ObjectNodeVM;
      const categoryIdVM = rootVM.propertyList.find(
        (vm) => vm.name === 'categoryId',
      ) as ForeignKeyNodeVM;

      expect(categoryIdVM).toBeInstanceOf(ForeignKeyNodeVM);

      categoryIdVM.changeType(SchemaTypeIds.String);

      const updatedVM = rootVM.propertyList.find(
        (vm) => vm.name === 'categoryId',
      );
      expect(updatedVM).toBeInstanceOf(PrimitiveNodeVM);
    });
  });
});
