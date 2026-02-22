import { FilterFieldType } from '../../shared/field-types.js';
import type { ColumnSpec } from './types.js';

const SEMANTIC_NAME_PATTERNS =
  /^(title|name|label|subject|summary|description|heading|caption|email|username|displayName|firstName|lastName)$/i;

const PRIORITY_BY_TYPE: Record<FilterFieldType, number> = {
  [FilterFieldType.File]: 2,
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
  maxVisible: number = 4,
): ColumnSpec[] {
  const idColumn = columns.find((col) => col.isSystem && col.field === 'id');

  const fileFieldPrefixes = columns
    .filter((col) => col.fieldType === FilterFieldType.File)
    .map((col) => `${col.field}.`);

  const eligible = columns.filter(
    (col) =>
      !col.isSystem &&
      !col.isDeprecated &&
      !fileFieldPrefixes.some((prefix) => col.field.startsWith(prefix)),
  );
  const sorted = [...eligible].sort(
    (a, b) => columnPriority(a) - columnPriority(b),
  );

  const dataSlots = idColumn ? maxVisible - 1 : maxVisible;

  let fileIncluded = false;
  const dataColumns: ColumnSpec[] = [];
  for (const col of sorted) {
    if (dataColumns.length >= dataSlots) {
      break;
    }
    if (col.fieldType === FilterFieldType.File) {
      if (fileIncluded) {
        continue;
      }
      fileIncluded = true;
    }
    dataColumns.push(col);
  }

  if (idColumn) {
    return [idColumn, ...dataColumns];
  }
  return dataColumns;
}
