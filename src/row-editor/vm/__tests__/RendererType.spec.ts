import {
  resetNodeIdCounter,
  SystemSchemaIds,
  fileSchema,
} from '@revisium/schema-toolkit';
import { RowEditorVM } from '../RowEditorVM';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('RendererType detection', () => {
  describe('foreignKey', () => {
    const fkSchema = {
      type: 'object' as const,
      properties: {
        productId: {
          type: 'string' as const,
          default: '',
          foreignKey: 'products',
        },
        name: { type: 'string' as const, default: '' },
      },
      additionalProperties: false,
      required: ['productId', 'name'],
    };

    it('returns foreignKey for FK string fields', () => {
      const vm = new RowEditorVM(fkSchema, {
        productId: 'row-1',
        name: 'Test',
      });
      const root = vm.root;

      if (root.isObject()) {
        const fkChild = root.child('productId');
        expect(fkChild).toBeDefined();
        expect(fkChild?.rendererType).toBe('foreignKey');
      }
    });

    it('returns string for regular string fields', () => {
      const vm = new RowEditorVM(fkSchema, {
        productId: '',
        name: 'Test',
      });
      const root = vm.root;

      if (root.isObject()) {
        const nameChild = root.child('name');
        expect(nameChild).toBeDefined();
        expect(nameChild?.rendererType).toBe('string');
      }
    });
  });

  describe('file', () => {
    const fileFieldSchema = {
      type: 'object' as const,
      properties: {
        avatar: { $ref: SystemSchemaIds.File },
        name: { type: 'string' as const, default: '' },
      },
      additionalProperties: false,
      required: ['avatar', 'name'],
    };

    it('returns file for $ref File object fields', () => {
      const vm = new RowEditorVM(
        fileFieldSchema,
        {
          avatar: {
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
          },
          name: 'Test',
        },
        { refSchemas: { [SystemSchemaIds.File]: fileSchema } },
      );
      const root = vm.root;

      if (root.isObject()) {
        const avatarChild = root.child('avatar');
        expect(avatarChild).toBeDefined();
        expect(avatarChild?.rendererType).toBe('file');
      }
    });

    it('returns container for regular object fields', () => {
      const regularSchema = {
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

      const vm = new RowEditorVM(regularSchema, {
        address: { city: 'NYC' },
      });
      const root = vm.root;

      if (root.isObject()) {
        const addrChild = root.child('address');
        expect(addrChild).toBeDefined();
        expect(addrChild?.rendererType).toBe('container');
      }
    });
  });

  describe('standard types', () => {
    const standardSchema = {
      type: 'object' as const,
      properties: {
        text: { type: 'string' as const, default: '' },
        count: { type: 'number' as const, default: 0 },
        active: { type: 'boolean' as const, default: false },
        tags: {
          type: 'array' as const,
          items: { type: 'string' as const, default: '' },
          default: [],
        },
      },
      additionalProperties: false,
      required: ['text', 'count', 'active', 'tags'],
    };

    it('returns correct types for standard fields', () => {
      const vm = new RowEditorVM(standardSchema, {
        text: 'hello',
        count: 5,
        active: true,
        tags: ['a'],
      });
      const root = vm.root;

      if (root.isObject()) {
        expect(root.child('text')?.rendererType).toBe('string');
        expect(root.child('count')?.rendererType).toBe('number');
        expect(root.child('active')?.rendererType).toBe('boolean');
        expect(root.child('tags')?.rendererType).toBe('container');
      }
    });
  });
});
