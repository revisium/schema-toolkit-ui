import { FilterFieldType } from '../../../shared/field-types';
import { testCol as col } from '../../../__tests__/helpers';
import { CellFSM } from '../CellFSM';
import { CellVM } from '../CellVM';

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
  readonly defaultValue: unknown;
  readonly value: unknown;
  setValue(v: unknown): void;
}

function createMockNode(
  value: unknown,
  options: {
    isReadOnly?: boolean;
    isPrimitive?: boolean;
    defaultValue?: unknown;
  } = {},
): MockNode {
  const { isReadOnly = false, isPrimitive: isPrim = true } = options;
  let defaultVal: unknown;
  if (options.defaultValue !== undefined) {
    defaultVal = options.defaultValue;
  } else if (isPrim) {
    defaultVal = getDefaultForValue(value);
  }
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
    get defaultValue() {
      return defaultVal;
    },
    get value() {
      return currentValue;
    },
    setValue(v: unknown) {
      currentValue = v;
    },
  };
}

function getDefaultForValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return '';
  }
  if (typeof value === 'number') {
    return 0;
  }
  if (typeof value === 'boolean') {
    return false;
  }
  return undefined;
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
  let cellFSM: CellFSM;

  beforeEach(() => {
    cellFSM = new CellFSM();
  });

  describe('value resolution', () => {
    it('returns value from rowModel.get(field)', () => {
      const rowModel = createMockRowModel({ name: 'Alice' });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        cellFSM,
      );
      expect(cell.value).toBe('Alice');
    });

    it('returns undefined for missing field', () => {
      const rowModel = createMockRowModel({});
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'missing' }),
        'row-1',
        cellFSM,
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
        cellFSM,
      );
      expect(cell.displayValue).toBe('Alice');
    });

    it('formats number value', () => {
      const rowModel = createMockRowModel({ age: 42 });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'age', fieldType: FilterFieldType.Number }),
        'row-1',
        cellFSM,
      );
      expect(cell.displayValue).toBe('42');
    });

    it('formats boolean value', () => {
      const rowModel = createMockRowModel({ active: true });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'active', fieldType: FilterFieldType.Boolean }),
        'row-1',
        cellFSM,
      );
      expect(cell.displayValue).toBe('true');
    });

    it('formats null as empty string', () => {
      const rowModel = createMockRowModel({ name: null });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        cellFSM,
      );
      expect(cell.displayValue).toBe('');
    });

    it('formats undefined (missing field) as empty string', () => {
      const rowModel = createMockRowModel({});
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'missing' }),
        'row-1',
        cellFSM,
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
        cellFSM,
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
        cellFSM,
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
        cellFSM,
      );
      expect(cell.isReadOnly).toBe(true);
    });

    it('returns false for writable primitive', () => {
      const rowModel = createMockRowModel({ name: 'Alice' });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        cellFSM,
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
        cellFSM,
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
        cellFSM,
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
        cellFSM,
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
        cellFSM,
      );
      expect(cell.isEditable).toBe(false);
    });
  });

  describe('focus and edit', () => {
    it('isFocused delegates to cellFSM', () => {
      const rowModel = createMockRowModel({ name: 'Alice' });
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        cellFSM,
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
        cellFSM,
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
        cellFSM,
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
        cellFSM,
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
        cellFSM,
      );
      cell.startEdit();
      cell.cancelEdit();
      expect(cell.isEditing).toBe(false);
    });

    it('cancelEdit does not change node value', () => {
      const node = createMockNode('Alice');
      const rowModel = createMockRowModelFromNodes([['name', node]]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        cellFSM,
      );
      cell.startEdit();
      cell.cancelEdit();
      expect(node.value).toBe('Alice');
    });
  });

  describe('clearToDefault', () => {
    it('resets value to schema default', () => {
      const node = createMockNode('Hello', { defaultValue: '' });
      const rowModel = createMockRowModelFromNodes([['name', node]]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'name' }),
        'row-1',
        cellFSM,
      );
      cell.clearToDefault();
      expect(node.value).toBe('');
    });

    it('resets number value to schema default', () => {
      const node = createMockNode(42, { defaultValue: 0 });
      const rowModel = createMockRowModelFromNodes([['age', node]]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'age', fieldType: FilterFieldType.Number }),
        'row-1',
        cellFSM,
      );
      cell.clearToDefault();
      expect(node.value).toBe(0);
    });

    it('does nothing for readonly cell', () => {
      const node = createMockNode('computed', {
        isReadOnly: true,
        defaultValue: '',
      });
      const rowModel = createMockRowModelFromNodes([['id', node]]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'id', isSystem: true }),
        'row-1',
        cellFSM,
      );
      cell.clearToDefault();
      expect(node.value).toBe('computed');
    });

    it('does nothing for non-primitive node', () => {
      const node = createMockNode({ foo: 'bar' }, { isPrimitive: false });
      const rowModel = createMockRowModelFromNodes([['meta', node]]);
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'meta' }),
        'row-1',
        cellFSM,
      );
      cell.clearToDefault();
      expect(node.value).toEqual({ foo: 'bar' });
    });

    it('does nothing for missing field', () => {
      const rowModel = createMockRowModel({});
      const cell = new CellVM(
        rowModel as never,
        col({ field: 'missing' }),
        'row-1',
        cellFSM,
      );
      cell.clearToDefault();
      expect(cell.value).toBeUndefined();
    });
  });
});
