import { FilterFieldType } from '../../../shared/field-types';
import type { ColumnSpec } from '../types';
import { selectDefaultColumns } from '../selectDefaultColumns';

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

describe('selectDefaultColumns', () => {
  it('empty columns returns empty array', () => {
    expect(selectDefaultColumns([])).toEqual([]);
  });

  it('single field returns it', () => {
    const columns = [col({ field: 'name' })];
    expect(selectDefaultColumns(columns)).toEqual(columns);
  });

  it('three fields returns all three', () => {
    const columns = [
      col({ field: 'a' }),
      col({ field: 'b' }),
      col({ field: 'c' }),
    ];
    expect(selectDefaultColumns(columns)).toHaveLength(3);
  });

  it('more than default maxVisible returns only 3', () => {
    const columns = [
      col({ field: 'a' }),
      col({ field: 'b' }),
      col({ field: 'c' }),
      col({ field: 'd' }),
      col({ field: 'e' }),
    ];
    expect(selectDefaultColumns(columns)).toHaveLength(3);
  });

  it('custom maxVisible is respected', () => {
    const columns = [
      col({ field: 'a' }),
      col({ field: 'b' }),
      col({ field: 'c' }),
      col({ field: 'd' }),
    ];
    expect(selectDefaultColumns(columns, 2)).toHaveLength(2);
  });

  it('file field selected over string', () => {
    const columns = [
      col({ field: 'description' }),
      col({ field: 'avatar', fieldType: FilterFieldType.File }),
    ];
    const result = selectDefaultColumns(columns, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      field: 'avatar',
      fieldType: FilterFieldType.File,
    });
  });

  it('semantic string ("name") selected over non-semantic ("code")', () => {
    const columns = [col({ field: 'code' }), col({ field: 'name' })];
    const result = selectDefaultColumns(columns, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ field: 'name' });
  });

  it('excludes system and deprecated fields', () => {
    const columns = [
      col({ field: 'id', isSystem: true }),
      col({ field: 'oldField', isDeprecated: true }),
      col({ field: 'active', fieldType: FilterFieldType.Boolean }),
    ];
    const result = selectDefaultColumns(columns);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ field: 'active' });
  });
});
