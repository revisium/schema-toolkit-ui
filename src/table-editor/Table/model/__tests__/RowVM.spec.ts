import { FilterFieldType } from '../../../shared/field-types';
import type { ColumnSpec } from '../../../Columns/model/types';
import { CellFSM } from '../CellFSM';
import { SelectionModel } from '../SelectionModel';
import { RowVM } from '../RowVM';

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
  const nodes = new Map<
    string,
    {
      getPlainValue(): unknown;
      isPrimitive(): boolean;
      isReadOnly: boolean;
      value: unknown;
      setValue(v: unknown): void;
    }
  >();

  for (const [key, value] of Object.entries(data)) {
    let currentValue = value;
    nodes.set(key, {
      getPlainValue() {
        return currentValue;
      },
      isPrimitive() {
        return true;
      },
      get isReadOnly() {
        return false;
      },
      get value() {
        return currentValue;
      },
      setValue(v: unknown) {
        currentValue = v;
      },
    });
  }

  return {
    get(path: string) {
      return nodes.get(path);
    },
  };
}

describe('RowVM', () => {
  let cellFSM: CellFSM;
  let selection: SelectionModel;

  beforeEach(() => {
    cellFSM = new CellFSM();
    selection = new SelectionModel();
  });

  it('exposes rowId', () => {
    const rowModel = createMockRowModel({});
    const row = new RowVM(rowModel as never, 'row-1', cellFSM, selection);
    expect(row.rowId).toBe('row-1');
  });

  it('getCellVM returns cached CellVM for same column', () => {
    const rowModel = createMockRowModel({ name: 'Alice' });
    const row = new RowVM(rowModel as never, 'row-1', cellFSM, selection);
    const column = col({ field: 'name' });
    const cell1 = row.getCellVM(column);
    const cell2 = row.getCellVM(column);
    expect(cell1).toBe(cell2);
  });

  it('getCellVM returns different CellVM for different columns', () => {
    const rowModel = createMockRowModel({ name: 'Alice', age: 30 });
    const row = new RowVM(rowModel as never, 'row-1', cellFSM, selection);
    const nameCol = col({ field: 'name' });
    const ageCol = col({ field: 'age', fieldType: FilterFieldType.Number });
    const nameCell = row.getCellVM(nameCol);
    const ageCell = row.getCellVM(ageCol);
    expect(nameCell).not.toBe(ageCell);
    expect(nameCell.field).toBe('name');
    expect(ageCell.field).toBe('age');
  });

  it('isSelected delegates to SelectionModel', () => {
    const rowModel = createMockRowModel({});
    const row = new RowVM(rowModel as never, 'row-1', cellFSM, selection);
    expect(row.isSelected).toBe(false);
    selection.toggle('row-1');
    expect(row.isSelected).toBe(true);
  });

  it('toggleSelection delegates to SelectionModel', () => {
    const rowModel = createMockRowModel({});
    const row = new RowVM(rowModel as never, 'row-1', cellFSM, selection);
    row.toggleSelection();
    expect(selection.isSelected('row-1')).toBe(true);
    row.toggleSelection();
    expect(selection.isSelected('row-1')).toBe(false);
  });

  it('dispose clears cell cache', () => {
    const rowModel = createMockRowModel({ name: 'Alice' });
    const row = new RowVM(rowModel as never, 'row-1', cellFSM, selection);
    const column = col({ field: 'name' });
    const cellBefore = row.getCellVM(column);
    row.dispose();
    const cellAfter = row.getCellVM(column);
    expect(cellBefore).not.toBe(cellAfter);
  });
});
