import { FilterFieldType } from '../../shared/field-types.js';
import type { ColumnSpec } from './types.js';

const SEMANTIC_NAME_PATTERNS = /^(title|name|label)$/i;

const PRIORITY_BY_TYPE: Record<FilterFieldType, number> = {
  [FilterFieldType.File]: 0,
  [FilterFieldType.String]: 2,
  [FilterFieldType.Number]: 3,
  [FilterFieldType.Boolean]: 3,
  [FilterFieldType.DateTime]: 3,
  [FilterFieldType.ForeignKey]: 4,
};

function columnPriority(col: ColumnSpec): number {
  if (
    col.fieldType === FilterFieldType.String &&
    SEMANTIC_NAME_PATTERNS.test(col.label)
  ) {
    return 1;
  }
  return PRIORITY_BY_TYPE[col.fieldType];
}

export function selectDefaultColumns(
  columns: ColumnSpec[],
  maxVisible: number = 3,
): ColumnSpec[] {
  const eligible = columns.filter((col) => !col.isSystem && !col.isDeprecated);
  const sorted = [...eligible].sort(
    (a, b) => columnPriority(a) - columnPriority(b),
  );
  return sorted.slice(0, maxVisible);
}
