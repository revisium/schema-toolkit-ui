import { resetNodeIdCounter } from '@revisium/schema-toolkit';
import { RowEditorVM } from '../RowEditorVM';
import type { RowEditorCallbacks } from '../types';

beforeEach(() => {
  resetNodeIdCounter();
});

describe('ForeignKeyNodeVM', () => {
  const fkSchema = {
    type: 'object' as const,
    properties: {
      productId: {
        type: 'string' as const,
        default: '',
        foreignKey: 'products',
      },
    },
    additionalProperties: false,
    required: ['productId'],
  };

  describe('foreignKeyTableId', () => {
    it('returns the foreign key table ID', () => {
      const vm = new RowEditorVM(fkSchema, { productId: 'row-1' });
      const root = vm.root;

      if (root.isObject()) {
        const fk = root.child('productId');
        expect(fk).toBeDefined();
        if (fk && 'foreignKeyTableId' in fk) {
          expect(fk.foreignKeyTableId).toBe('products');
        }
      }
    });
  });

  describe('callbacks', () => {
    it('returns null when no callbacks configured', () => {
      const vm = new RowEditorVM(fkSchema, { productId: 'row-1' });
      const root = vm.root;

      if (root.isObject()) {
        const fk = root.child('productId');
        expect(fk).toBeDefined();
        if (fk && 'callbacks' in fk) {
          expect(fk.callbacks).toBeNull();
        }
      }
    });

    it('returns callbacks when configured', () => {
      const callbacks: RowEditorCallbacks = {
        onSearchForeignKey: () => Promise.resolve({ ids: [], hasMore: false }),
        onNavigateToForeignKey: () => {},
      };
      const vm = new RowEditorVM(
        fkSchema,
        { productId: 'row-1' },
        { callbacks },
      );
      const root = vm.root;

      if (root.isObject()) {
        const fk = root.child('productId');
        expect(fk).toBeDefined();
        if (fk && 'callbacks' in fk) {
          expect(fk.callbacks).not.toBeNull();
          expect(fk.callbacks?.onSearchForeignKey).toBeDefined();
          expect(fk.callbacks?.onNavigateToForeignKey).toBeDefined();
        }
      }
    });
  });

  describe('value', () => {
    it('exposes string value', () => {
      const vm = new RowEditorVM(fkSchema, { productId: 'row-1' });
      const root = vm.root;

      if (root.isObject()) {
        const fk = root.child('productId');
        if (fk?.isPrimitive()) {
          expect(fk.value).toBe('row-1');
        }
      }
    });

    it('allows setting value', () => {
      const vm = new RowEditorVM(fkSchema, { productId: 'row-1' });
      const root = vm.root;

      if (root.isObject()) {
        const fk = root.child('productId');
        if (fk?.isPrimitive()) {
          fk.setValue('row-2');
          expect(fk.value).toBe('row-2');
        }
      }
    });
  });
});
