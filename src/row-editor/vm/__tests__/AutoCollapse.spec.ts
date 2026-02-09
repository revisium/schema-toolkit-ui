import {
  resetNodeIdCounter,
  SystemSchemaIds,
  fileSchema,
} from '@revisium/schema-toolkit';
import { RowEditorVM } from '../RowEditorVM';

beforeEach(() => {
  resetNodeIdCounter();
});

const fileValue = {
  status: 'uploaded',
  fileId: 'f1',
  url: 'http://example.com/f',
  fileName: 'test.png',
  hash: '',
  extension: '.png',
  mimeType: 'image/png',
  size: 100,
  width: 50,
  height: 50,
};

const refSchemas = { [SystemSchemaIds.File]: fileSchema };

describe('auto-collapse', () => {
  describe('ref nodes', () => {
    const fileFieldSchema = {
      type: 'object' as const,
      properties: {
        avatar: { $ref: SystemSchemaIds.File },
        name: { type: 'string' as const, default: '' },
      },
      additionalProperties: false,
      required: ['avatar', 'name'],
    };

    it('file object field starts collapsed', () => {
      const vm = new RowEditorVM(
        fileFieldSchema,
        { avatar: fileValue, name: 'Test' },
        { refSchemas },
      );
      const root = vm.root;

      if (!root.isObject()) {
        throw new Error('Expected object root');
      }
      const avatar = root.child('avatar');
      expect(avatar).toBeDefined();
      expect(avatar?.isExpanded).toBe(false);
    });

    it('regular object field starts expanded', () => {
      const schema = {
        type: 'object' as const,
        properties: {
          address: {
            type: 'object' as const,
            properties: {
              city: { type: 'string' as const, default: '' },
            },
            additionalProperties: false,
            required: ['city'],
          },
        },
        additionalProperties: false,
        required: ['address'],
      };

      const vm = new RowEditorVM(schema, { address: { city: 'NYC' } });
      const root = vm.root;

      if (!root.isObject()) {
        throw new Error('Expected object root');
      }
      const address = root.child('address');
      expect(address).toBeDefined();
      expect(address?.isExpanded).toBe(true);
    });

    it('file field inside array item starts collapsed on initial load', () => {
      const arrayOfFilesSchema = {
        type: 'object' as const,
        properties: {
          photos: {
            type: 'array' as const,
            items: { $ref: SystemSchemaIds.File },
            default: [],
          },
        },
        additionalProperties: false,
        required: ['photos'],
      };

      const vm = new RowEditorVM(
        arrayOfFilesSchema,
        { photos: [fileValue] },
        { refSchemas },
      );
      const root = vm.root;

      if (!root.isObject()) {
        throw new Error('Expected object root');
      }
      const photos = root.child('photos');
      if (!photos?.isArray()) {
        throw new Error('Expected array child');
      }
      const firstItem = photos.at(0);
      expect(firstItem).toBeDefined();
      expect(firstItem?.isExpanded).toBe(false);
    });

    it('file field in dynamically pushed array item starts collapsed', () => {
      const arrayOfFilesSchema = {
        type: 'object' as const,
        properties: {
          photos: {
            type: 'array' as const,
            items: { $ref: SystemSchemaIds.File },
            default: [],
          },
        },
        additionalProperties: false,
        required: ['photos'],
      };

      const vm = new RowEditorVM(
        arrayOfFilesSchema,
        { photos: [] },
        { refSchemas },
      );
      const root = vm.root;

      if (!root.isObject()) {
        throw new Error('Expected object root');
      }
      const photos = root.child('photos');
      if (!photos?.isArray()) {
        throw new Error('Expected array child');
      }

      photos.pushValue(null);

      const pushed = photos.at(0);
      expect(pushed).toBeDefined();
      expect(pushed?.isExpanded).toBe(false);
    });

    it('manually expanded ref node stays expanded', () => {
      const vm = new RowEditorVM(
        fileFieldSchema,
        { avatar: fileValue, name: 'Test' },
        { refSchemas },
      );
      const root = vm.root;

      if (!root.isObject()) {
        throw new Error('Expected object root');
      }
      const avatar = root.child('avatar');
      expect(avatar?.isExpanded).toBe(false);

      avatar?.expand();

      expect(avatar?.isExpanded).toBe(true);
    });
  });

  describe('collapseComplexity', () => {
    const wideSchema = {
      type: 'object' as const,
      properties: {
        a: { type: 'string' as const, default: '' },
        b: { type: 'string' as const, default: '' },
        c: { type: 'string' as const, default: '' },
        nested: {
          type: 'object' as const,
          properties: {
            d: { type: 'string' as const, default: '' },
            e: { type: 'string' as const, default: '' },
          },
          additionalProperties: false,
          required: ['d', 'e'],
        },
      },
      additionalProperties: false,
      required: ['a', 'b', 'c', 'nested'],
    };

    it('below threshold: all expanded', () => {
      const vm = new RowEditorVM(
        wideSchema,
        { a: '', b: '', c: '', nested: { d: '', e: '' } },
        { collapseComplexity: 100 },
      );
      const root = vm.root;

      if (!root.isObject()) {
        throw new Error('Expected object root');
      }
      const nested = root.child('nested');
      expect(nested?.isExpanded).toBe(true);
    });

    it('at threshold: all collapsed except root', () => {
      const vm = new RowEditorVM(
        wideSchema,
        { a: '', b: '', c: '', nested: { d: '', e: '' } },
        { collapseComplexity: 1 },
      );
      const root = vm.root;

      expect(root.isExpanded).toBe(true);

      if (!root.isObject()) {
        throw new Error('Expected object root');
      }
      const nested = root.child('nested');
      expect(nested?.isExpanded).toBe(false);
    });

    it('root always stays expanded', () => {
      const vm = new RowEditorVM(
        wideSchema,
        { a: '', b: '', c: '', nested: { d: '', e: '' } },
        { collapseComplexity: 1 },
      );

      expect(vm.root.isExpanded).toBe(true);
    });
  });
});
