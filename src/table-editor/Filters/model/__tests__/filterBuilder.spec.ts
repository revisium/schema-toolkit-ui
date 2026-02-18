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
});
