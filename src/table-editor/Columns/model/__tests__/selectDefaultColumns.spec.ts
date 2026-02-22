import { FilterFieldType } from '../../../shared/field-types';
import { testCol as col } from '../../../__tests__/helpers';
import { selectDefaultColumns } from '../selectDefaultColumns';

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

  it('more than default maxVisible returns only 4', () => {
    const columns = [
      col({ field: 'a' }),
      col({ field: 'b' }),
      col({ field: 'c' }),
      col({ field: 'd' }),
      col({ field: 'e' }),
    ];
    expect(selectDefaultColumns(columns)).toHaveLength(4);
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

  it('semantic string ("name") selected over file', () => {
    const columns = [
      col({ field: 'avatar', fieldType: FilterFieldType.File }),
      col({ field: 'name' }),
    ];
    const result = selectDefaultColumns(columns, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ field: 'name' });
  });

  it('file and non-semantic string have same priority (input order preserved)', () => {
    const columns = [
      col({ field: 'description' }),
      col({ field: 'avatar', fieldType: FilterFieldType.File }),
    ];
    const result = selectDefaultColumns(columns, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ field: 'description' });
    expect(result[1]).toMatchObject({ field: 'avatar' });
  });

  it('semantic string ("name") selected over non-semantic ("code")', () => {
    const columns = [col({ field: 'code' }), col({ field: 'name' })];
    const result = selectDefaultColumns(columns, 1);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ field: 'name' });
  });

  it('additional semantic patterns are recognized', () => {
    const columns = [
      col({ field: 'code' }),
      col({ field: 'email' }),
      col({ field: 'username' }),
    ];
    const result = selectDefaultColumns(columns, 2);
    expect(result.map((c) => c.field)).toEqual(['email', 'username']);
  });

  it('at most one file column in defaults', () => {
    const columns = [
      col({ field: 'avatar', fieldType: FilterFieldType.File }),
      col({ field: 'document', fieldType: FilterFieldType.File }),
      col({ field: 'title' }),
      col({ field: 'age', fieldType: FilterFieldType.Number }),
    ];
    const result = selectDefaultColumns(columns, 3);
    const fileCount = result.filter(
      (c) => c.fieldType === FilterFieldType.File,
    ).length;
    expect(fileCount).toBe(1);
    expect(result.map((c) => c.field)).toEqual(['title', 'avatar', 'age']);
  });

  it('excludes deprecated fields but includes id system column', () => {
    const columns = [
      col({ field: 'id', isSystem: true }),
      col({ field: 'oldField', isDeprecated: true }),
      col({ field: 'active', fieldType: FilterFieldType.Boolean }),
    ];
    const result = selectDefaultColumns(columns);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ field: 'id' });
    expect(result[1]).toMatchObject({ field: 'active' });
  });

  it('id is always first, other system fields excluded', () => {
    const columns = [
      col({ field: 'id', isSystem: true }),
      col({
        field: 'createdAt',
        isSystem: true,
        fieldType: FilterFieldType.DateTime,
      }),
      col({ field: 'name' }),
      col({ field: 'email' }),
      col({ field: 'age', fieldType: FilterFieldType.Number }),
    ];
    const result = selectDefaultColumns(columns, 4);
    const fields = result.map((c) => c.field);
    expect(fields[0]).toBe('id');
    expect(fields).not.toContain('createdAt');
    expect(fields).toEqual(['id', 'name', 'email', 'age']);
  });

  it('without id system column all slots go to data columns', () => {
    const columns = [
      col({ field: 'name' }),
      col({ field: 'age', fieldType: FilterFieldType.Number }),
      col({ field: 'active', fieldType: FilterFieldType.Boolean }),
      col({ field: 'email' }),
    ];
    const result = selectDefaultColumns(columns);
    expect(result).toHaveLength(4);
    expect(result.map((c) => c.field)).toEqual([
      'name',
      'email',
      'age',
      'active',
    ]);
  });

  it('maxVisible 4 with id selects id + 3 data columns', () => {
    const columns = [
      col({ field: 'id', isSystem: true }),
      col({ field: 'name' }),
      col({ field: 'age', fieldType: FilterFieldType.Number }),
      col({ field: 'active', fieldType: FilterFieldType.Boolean }),
      col({ field: 'email' }),
      col({ field: 'score', fieldType: FilterFieldType.Number }),
      col({ field: 'city' }),
    ];
    const result = selectDefaultColumns(columns, 4);
    expect(result).toHaveLength(4);
    expect(result.map((c) => c.field)).toEqual(['id', 'name', 'email', 'city']);
  });

  it('excludes file sub-fields from defaults', () => {
    const columns = [
      col({ field: 'name' }),
      col({ field: 'avatar', fieldType: FilterFieldType.File }),
      col({ field: 'avatar.fileName' }),
      col({ field: 'avatar.size', fieldType: FilterFieldType.Number }),
    ];
    const result = selectDefaultColumns(columns);
    const fields = result.map((c) => c.field);
    expect(fields).toContain('avatar');
    expect(fields).toContain('name');
    expect(fields).not.toContain('avatar.fileName');
    expect(fields).not.toContain('avatar.size');
  });

  it('file sub-fields excluded even with high maxVisible', () => {
    const columns = [
      col({ field: 'name' }),
      col({ field: 'avatar', fieldType: FilterFieldType.File }),
      col({ field: 'avatar.fileName' }),
      col({ field: 'avatar.status' }),
      col({ field: 'avatar.url' }),
    ];
    const result = selectDefaultColumns(columns, 10);
    const fields = result.map((c) => c.field);
    expect(fields).toEqual(['name', 'avatar']);
  });
});
