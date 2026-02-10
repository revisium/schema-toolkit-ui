import { FilterFieldType } from '../../../shared/field-types';
import type { ColumnSpec } from '../../../Columns/model/types';
import { InlineEditModel } from '../InlineEditModel';
import { CellVM } from '../CellVM';

function col(overrides: Partial<ColumnSpec> & { field: string }): ColumnSpec {
  return {
    label: overrides.field,
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    ...overrides,
  };
}

function createMockRowModel(data: Record<string, unknown> = {}) {
  const nodes = new Map<string, ReturnType<typeof createMockNode>>();

  for (const [key, value] of Object.entries(data)) {
    nodes.set(key, createMockNode(value));
  }

  return {
    get(path: string) {
      return nodes.get(path);
    },
  };
}

interface MockNode {
  getPlainValue(): unknown;
  isPrimitive(): boolean;
  isObject(): boolean;
  isArray(): boolean;
  readonly isReadOnly: boolean;
  readonly value: unknown;
  setValue(v: unknown): void;
}

function createMockNode(
  value: unknown,
  options: { isReadOnly?: boolean; isPrimitive?: boolean } = {},
): MockNode {
  const { isReadOnly = false, isPrimitive: isPrim = true } = options;
  let currentValue = value;

  return {
    getPlainValue() {
      return currentValue;
    },
    isPrimitive() {
      return isPrim;
    },
    isObject() {
      return !isPrim && typeof value === 'object' && !Array.isArray(value);
    },
    isArray() {
      return !isPrim && Array.isArray(value);
    },
    get isReadOnly() {
      return isReadOnly;
    },
    get value() {
      return currentValue;
    },
    setValue(v: unknown) {
      currentValue = v;
    },
  };
}

function createMockRowModelFromNodes(entries: Array<[string, MockNode]>): {
  get(path: string): MockNode | undefined;
} {
  const nodes = new Map<string, MockNode>(entries);
  return {
    get(path: string) {
      return nodes.get(path);
    },
  };
}

describe('CellVM', () => {
  let inlineEdit: InlineEditModel;

  beforeEach(() => {
    inlineEdit = new InlineEditModel();
  });

  describe('value resolution', () => {
    it('returns value from rowModel.get(field)', () => {
      const rowModel = createMockRowModel({ name: 'Alice' });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.value).toBe('Alice');
    });

    it('returns undefined for missing field', () => {
      const rowModel = createMockRowModel({});
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'missing' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.value).toBeUndefined();
    });
  });

  describe('displayValue', () => {
    it('formats string value', () => {
      const rowModel = createMockRowModel({ name: 'Alice' });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.displayValue).toBe('Alice');
    });

    it('formats number value', () => {
      const rowModel = createMockRowModel({ age: 42 });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'age', fieldType: FilterFieldType.Number }),
        'row-1',
        inlineEdit,
      );
      expect(cell.displayValue).toBe('42');
    });

    it('formats boolean value', () => {
      const rowModel = createMockRowModel({ active: true });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'active', fieldType: FilterFieldType.Boolean }),
        'row-1',
        inlineEdit,
      );
      expect(cell.displayValue).toBe('true');
    });

    it('formats null as empty string', () => {
      const rowModel = createMockRowModel({ name: null });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.displayValue).toBe('');
    });

    it('formats undefined (missing field) as empty string', () => {
      const rowModel = createMockRowModel({});
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'missing' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.displayValue).toBe('');
    });

    it('formats object as "{...}"', () => {
      const rowModel = createMockRowModelFromNodes([
        ['meta', createMockNode({ foo: 'bar' }, { isPrimitive: false })],
      ]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'meta' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.displayValue).toBe('{...}');
    });

    it('formats array as "[N]"', () => {
      const rowModel = createMockRowModelFromNodes([
        ['tags', createMockNode([1, 2, 3], { isPrimitive: false })],
      ]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'tags' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.displayValue).toBe('[3]');
    });
  });

  describe('isReadOnly', () => {
    it('returns true for missing field', () => {
      const rowModel = createMockRowModel({});
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'missing' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.isReadOnly).toBe(true);
    });

    it('returns false for writable primitive', () => {
      const rowModel = createMockRowModel({ name: 'Alice' });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.isReadOnly).toBe(false);
    });

    it('returns true for read-only primitive', () => {
      const rowModel = createMockRowModelFromNodes([
        ['id', createMockNode('x', { isReadOnly: true })],
      ]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'id', isSystem: true }),
        'row-1',
        inlineEdit,
      );
      expect(cell.isReadOnly).toBe(true);
    });

    it('returns true for non-primitive node', () => {
      const rowModel = createMockRowModelFromNodes([
        ['meta', createMockNode({}, { isPrimitive: false })],
      ]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'meta' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.isReadOnly).toBe(true);
    });
  });

  describe('isEditable', () => {
    it('returns true for writable primitive', () => {
      const rowModel = createMockRowModel({ name: 'Alice' });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.isEditable).toBe(true);
    });

    it('returns false for read-only field', () => {
      const rowModel = createMockRowModelFromNodes([
        ['id', createMockNode('x', { isReadOnly: true })],
      ]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'id', isSystem: true }),
        'row-1',
        inlineEdit,
      );
      expect(cell.isEditable).toBe(false);
    });
  });

  describe('focus and edit', () => {
    it('isFocused delegates to inlineEdit', () => {
      const rowModel = createMockRowModel({ name: 'Alice' });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        inlineEdit,
      );
      expect(cell.isFocused).toBe(false);
      cell.focus();
      expect(cell.isFocused).toBe(true);
    });

    it('isEditing is true when focused and editing', () => {
      const rowModel = createMockRowModel({ name: 'Alice' });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        inlineEdit,
      );
      cell.startEdit();
      expect(cell.isEditing).toBe(true);
    });

    it('startEdit does nothing for read-only cell', () => {
      const rowModel = createMockRowModelFromNodes([
        ['id', createMockNode('x', { isReadOnly: true })],
      ]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'id', isSystem: true }),
        'row-1',
        inlineEdit,
      );
      cell.startEdit();
      expect(cell.isEditing).toBe(false);
    });

    it('commitEdit updates node value', () => {
      const node = createMockNode('Alice');
      const rowModel = createMockRowModelFromNodes([['name', node]]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        inlineEdit,
      );
      cell.startEdit();
      cell.commitEdit('Bob');
      expect(node.value).toBe('Bob');
      expect(cell.isEditing).toBe(false);
    });

    it('cancelEdit exits edit mode', () => {
      const rowModel = createMockRowModel({ name: 'Alice' });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        inlineEdit,
      );
      cell.startEdit();
      cell.cancelEdit();
      expect(cell.isEditing).toBe(false);
    });
  });
});
