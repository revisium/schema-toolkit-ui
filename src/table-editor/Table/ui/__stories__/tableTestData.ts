import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { col, FilterFieldType } from '../../../__stories__/helpers.js';

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
