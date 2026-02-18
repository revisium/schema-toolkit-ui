import { FilterFieldType } from '../../../shared/field-types';
import { FilterOperator } from '../operators';
import { buildWhereClause } from '../filterBuilder';
import type { FilterGroup } from '../types';

function createGroup(overrides: Partial<FilterGroup> = {}): FilterGroup {
  return {
    id: 'g-1',
    logic: 'and',
    conditions: [],
    groups: [],
    ...overrides,
  };
}

describe('buildWhereClause', () => {
  it('empty group returns null', () => {
    const group = createGroup();
    expect(buildWhereClause(group)).toBeNull();
  });

  it('string equals', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Equals,
          value: 'Alice',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'name', equals: 'Alice' },
    });
  });

  it('number gt', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'age',
          fieldType: FilterFieldType.Number,
          operator: FilterOperator.Gt,
          value: '18',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'age', gt: 18 },
    });
  });

  it('boolean is_true', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'active',
          fieldType: FilterFieldType.Boolean,
          operator: FilterOperator.IsTrue,
          value: '',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'active', equals: true },
    });
  });

  it('system field (id contains)', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'id',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Contains,
          value: 'abc',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      id: { string_contains: 'abc' },
    });
  });

  it('AND group with multiple conditions', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Equals,
          value: 'Alice',
        },
        {
          id: 'c-2',
          field: 'age',
          fieldType: FilterFieldType.Number,
          operator: FilterOperator.Gte,
          value: '21',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      AND: [
        { data: { path: 'name', equals: 'Alice' } },
        { data: { path: 'age', gte: 21 } },
      ],
    });
  });

  it('OR group', () => {
    const group = createGroup({
      logic: 'or',
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Equals,
          value: 'Alice',
        },
        {
          id: 'c-2',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Equals,
          value: 'Bob',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      OR: [
        { data: { path: 'name', equals: 'Alice' } },
        { data: { path: 'name', equals: 'Bob' } },
      ],
    });
  });

  it('datetime before', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'createdAt',
          fieldType: FilterFieldType.DateTime,
          operator: FilterOperator.Lt,
          value: '2024-01-15T10:30:00.000Z',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      createdAt: { lt: '2024-01-15T10:30:00.000Z' },
    });
  });

  it('search operator', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Search,
          value: 'hello world',
          searchLanguage: 'english',
          searchType: 'phrase',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: {
        path: 'name',
        search: 'hello world',
        searchLanguage: 'english',
        searchType: 'phrase',
      },
    });
  });

  it('string not_equals', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.NotEquals,
          value: 'Alice',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'name', not: { equals: 'Alice' } },
    });
  });

  it('string not_contains', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.NotContains,
          value: 'test',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'name', not: { string_contains: 'test' } },
    });
  });

  it('string starts_with', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.StartsWith,
          value: 'Al',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'name', string_starts_with: 'Al' },
    });
  });

  it('string ends_with', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.EndsWith,
          value: 'ice',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'name', string_ends_with: 'ice' },
    });
  });

  it('number lte', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'age',
          fieldType: FilterFieldType.Number,
          operator: FilterOperator.Lte,
          value: '65',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'age', lte: 65 },
    });
  });

  it('string is_not_empty', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.IsNotEmpty,
          value: '',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'name', not: { equals: null } },
    });
  });

  it('boolean is_false', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'active',
          fieldType: FilterFieldType.Boolean,
          operator: FilterOperator.IsFalse,
          value: '',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'active', equals: false },
    });
  });

  it('search on system field', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'id',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Search,
          value: 'abc',
          searchLanguage: 'english',
          searchType: 'phrase',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      id: {
        search: 'abc',
        searchLanguage: 'english',
        searchType: 'phrase',
      },
    });
  });

  it('search on system field uses defaults when language and type not provided', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'id',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Search,
          value: 'test',
        },
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      id: {
        search: 'test',
        searchLanguage: 'simple',
        searchType: 'plain',
      },
    });
  });

  it('skips condition when operator requires value and value is empty', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Equals,
          value: '',
        },
      ],
    });
    expect(buildWhereClause(group)).toBeNull();
  });

  it('nested subgroup', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Equals,
          value: 'Alice',
        },
      ],
      groups: [
        createGroup({
          id: 'g-2',
          logic: 'or',
          conditions: [
            {
              id: 'c-2',
              field: 'age',
              fieldType: FilterFieldType.Number,
              operator: FilterOperator.Gt,
              value: '18',
            },
            {
              id: 'c-3',
              field: 'age',
              fieldType: FilterFieldType.Number,
              operator: FilterOperator.Lt,
              value: '65',
            },
          ],
        }),
      ],
    });
    expect(buildWhereClause(group)).toEqual({
      AND: [
        { data: { path: 'name', equals: 'Alice' } },
        {
          OR: [
            { data: { path: 'age', gt: 18 } },
            { data: { path: 'age', lt: 65 } },
          ],
        },
      ],
    });
  });

  it('nested empty subgroup is ignored', () => {
    const group = createGroup({
      conditions: [
        {
          id: 'c-1',
          field: 'name',
          fieldType: FilterFieldType.String,
          operator: FilterOperator.Equals,
          value: 'Alice',
        },
      ],
      groups: [createGroup({ id: 'g-2' })],
    });
    expect(buildWhereClause(group)).toEqual({
      data: { path: 'name', equals: 'Alice' },
    });
  });
});
