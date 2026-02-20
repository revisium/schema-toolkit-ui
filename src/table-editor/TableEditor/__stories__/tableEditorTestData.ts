import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { col, FilterFieldType } from '../../__stories__/helpers.js';

export const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
});

export const TEST_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
];

export const MOCK_ROWS_DATA = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
  { name: 'Charlie', age: 35, active: true },
  { name: 'Diana', age: 28, active: true },
  { name: 'Eve', age: 22, active: false },
];

export const MANY_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
  col('email', FilterFieldType.String),
  col('score', FilterFieldType.Number),
  col('city', FilterFieldType.String),
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
