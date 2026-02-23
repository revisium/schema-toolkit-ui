import {
  obj,
  str,
  num,
  bool,
  fileSchema,
  SystemSchemaIds,
} from '@revisium/schema-toolkit';
import type { JsonObjectSchema, RefSchemas } from '@revisium/schema-toolkit';
import type { RowDataItem } from '../../__stories__/helpers.js';
import { MockDataSource } from '../model/MockDataSource.js';

export const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
});

export const MOCK_ROWS_DATA = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
  { name: 'Charlie', age: 35, active: true },
  { name: 'Diana', age: 28, active: true },
  { name: 'Eve', age: 22, active: false },
];

export const MANY_COLUMNS_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
  email: str(),
  score: num(),
  city: str(),
});

export const MANY_COLUMNS_ROWS = [
  {
    name: 'Alice',
    age: 30,
    active: true,
    email: 'alice@example.com',
    score: 95,
    city: 'New York',
  },
  {
    name: 'Bob',
    age: 25,
    active: false,
    email: 'bob@example.com',
    score: 80,
    city: 'London',
  },
  {
    name: 'Charlie',
    age: 35,
    active: true,
    email: 'charlie@example.com',
    score: 72,
    city: 'Tokyo',
  },
  {
    name: 'Diana',
    age: 28,
    active: true,
    email: 'diana@example.com',
    score: 88,
    city: 'Paris',
  },
  {
    name: 'Eve',
    age: 22,
    active: false,
    email: 'eve@example.com',
    score: 91,
    city: 'Berlin',
  },
];

export const FILE_REF_SCHEMAS: RefSchemas = {
  [SystemSchemaIds.File]: fileSchema,
};

export const FILE_TABLE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', default: '' },
    avatar: { $ref: SystemSchemaIds.File },
  },
  additionalProperties: false,
  required: ['name', 'avatar'],
} as unknown as JsonObjectSchema;

export const FILE_MOCK_ROWS_DATA = [
  {
    name: 'Alice',
    avatar: {
      status: 'uploaded',
      fileId: 'file-1',
      url: 'https://picsum.photos/200',
      fileName: 'avatar.png',
      hash: 'abc123',
      extension: '.png',
      mimeType: 'image/png',
      size: 1024,
      width: 200,
      height: 200,
    },
  },
  {
    name: 'Bob',
    avatar: {
      status: 'ready',
      fileId: 'file-2',
      url: '',
      fileName: '',
      hash: '',
      extension: '',
      mimeType: '',
      size: 0,
      width: 0,
      height: 0,
    },
  },
  {
    name: 'Charlie',
    avatar: {
      status: '',
      fileId: '',
      url: '',
      fileName: '',
      hash: '',
      extension: '',
      mimeType: '',
      size: 0,
      width: 0,
      height: 0,
    },
  },
  {
    name: 'Diana',
    avatar: {
      status: 'uploaded',
      fileId: 'file-4',
      url: 'https://example.com/doc.pdf',
      fileName: 'document.pdf',
      hash: 'def456',
      extension: '.pdf',
      mimeType: 'application/pdf',
      size: 5120,
      width: 0,
      height: 0,
    },
  },
];

const FIRST_NAMES = [
  'Alice',
  'Bob',
  'Charlie',
  'Diana',
  'Eve',
  'Frank',
  'Grace',
  'Henry',
  'Ivy',
  'Jack',
  'Karen',
  'Leo',
  'Mia',
  'Noah',
  'Olivia',
  'Paul',
  'Quinn',
  'Ruby',
  'Sam',
  'Tina',
];

const CITIES = [
  'New York',
  'London',
  'Tokyo',
  'Paris',
  'Berlin',
  'Sydney',
  'Toronto',
  'Seoul',
  'Dubai',
  'Rome',
];

export function generateManyRows(count: number): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    const name = FIRST_NAMES[i % FIRST_NAMES.length] ?? 'User';
    const city = CITIES[i % CITIES.length] ?? 'Unknown';
    rows.push({
      name: `${name} ${i + 1}`,
      age: 20 + (i % 50),
      active: i % 3 !== 0,
      email: `${name.toLowerCase()}${i + 1}@example.com`,
      score: 50 + (i % 51),
      city,
    });
  }
  return rows;
}

export const FK_TABLE_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', default: '' },
    price: { type: 'number', default: 0 },
    categoryId: { type: 'string', default: '', foreignKey: 'categories' },
  },
  additionalProperties: false,
  required: ['name', 'price', 'categoryId'],
} as unknown as JsonObjectSchema;

export const FK_MOCK_ROWS_DATA = [
  { name: 'Laptop', price: 999, categoryId: 'electronics' },
  { name: 'Desk Chair', price: 350, categoryId: 'furniture' },
  { name: 'Headphones', price: 150, categoryId: 'electronics' },
  { name: 'Notebook', price: 5, categoryId: '' },
  { name: 'Monitor', price: 450, categoryId: 'electronics' },
];

const FK_CATEGORY_IDS = [
  'electronics',
  'furniture',
  'clothing',
  'books',
  'sports',
  'toys',
  'food',
];

export const mockSearchForeignKey = async (
  _tableId: string,
  search: string,
): Promise<{ ids: string[]; hasMore: boolean }> => {
  await new Promise((r) => setTimeout(r, 200));
  const filtered = search
    ? FK_CATEGORY_IDS.filter((id) =>
        id.toLowerCase().includes(search.toLowerCase()),
      )
    : FK_CATEGORY_IDS;
  return { ids: filtered, hasMore: false };
};

export const SYSTEM_FIELDS_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
});

export const SYSTEM_FIELDS_ROWS: RowDataItem[] = [
  MockDataSource.createRow(
    'row-1',
    { name: 'Alice', age: 30, active: true },
    {
      createdAt: '2025-11-15T09:30:00Z',
      updatedAt: '2026-01-20T14:15:00Z',
      versionId: 'v-abc-001',
    },
  ),
  MockDataSource.createRow(
    'row-2',
    { name: 'Bob', age: 25, active: false },
    {
      createdAt: '2025-12-01T11:00:00Z',
      updatedAt: '2026-02-10T08:45:00Z',
      versionId: 'v-abc-002',
    },
  ),
  MockDataSource.createRow(
    'row-3',
    { name: 'Charlie', age: 35, active: true },
    {
      createdAt: '2026-01-05T16:20:00Z',
      updatedAt: '2026-02-18T10:30:00Z',
      versionId: 'v-abc-003',
    },
  ),
];
