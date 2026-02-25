import { FilterFieldType } from '../../shared/field-types.js';
import type { ColumnSpec } from './types.js';

export interface FileFieldGroup {
  parent: ColumnSpec;
  children: ColumnSpec[];
  parentVisible: boolean;
}

export type ColumnOrFileGroup = ColumnSpec | FileFieldGroup;

export function isFileFieldGroup(
  item: ColumnOrFileGroup,
): item is FileFieldGroup {
  return 'parent' in item && 'children' in item;
}

export function groupFileFields(
  columns: ColumnSpec[],
  allColumns?: ColumnSpec[],
): ColumnOrFileGroup[] {
  const allLookup = allColumns
    ? new Map(allColumns.map((c) => [c.field, c]))
    : null;
  const groups = new Map<string, FileFieldGroup>();
  const result: ColumnOrFileGroup[] = [];

  for (const col of columns) {
    if (col.fieldType === FilterFieldType.File) {
      const group: FileFieldGroup = {
        parent: col,
        children: [],
        parentVisible: false,
      };
      groups.set(col.field, group);
      result.push(group);
    } else if (col.parentFileField) {
      let group = groups.get(col.parentFileField);
      if (!group) {
        const parentCol = allLookup?.get(col.parentFileField);
        if (parentCol) {
          group = {
            parent: parentCol,
            children: [],
            parentVisible: true,
          };
          groups.set(col.parentFileField, group);
          result.push(group);
        }
      }
      if (group) {
        group.children.push(col);
      } else {
        result.push(col);
      }
    } else {
      result.push(col);
    }
  }

  return result;
}
