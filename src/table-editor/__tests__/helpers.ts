import type { ColumnSpec } from '../Columns/model/types';
import { FilterFieldType } from '../shared/field-types';

export function testCol(
  overrides: Partial<ColumnSpec> & { field: string },
): ColumnSpec {
  return {
    label: overrides.field,
    fieldType: FilterFieldType.String,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    ...overrides,
  };
}
