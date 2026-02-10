import type { SchemaNode } from '@revisium/schema-toolkit';
import { SystemSchemaIds } from '@revisium/schema-toolkit';
import { FilterFieldType } from '../../shared/field-types.js';
import { SYSTEM_FIELD_BY_REF } from '../../shared/system-fields.js';
import type { ColumnSpec } from './types.js';

export function extractColumns(rootNode: SchemaNode): ColumnSpec[] {
  const columns: ColumnSpec[] = [];
  if (!rootNode.isObject()) {
    return columns;
  }
  collectColumns(rootNode, '', columns);
  return columns;
}

function collectColumns(
  node: SchemaNode,
  parentPath: string,
  columns: ColumnSpec[],
): void {
  for (const child of node.properties()) {
    const fieldName = child.name();
    const fieldPath = parentPath ? `${parentPath}.${fieldName}` : fieldName;

    if (child.isArray()) {
      continue;
    }

    const refValue = child.ref();

    if (refValue) {
      const systemDef = SYSTEM_FIELD_BY_REF.get(refValue);
      if (systemDef) {
        columns.push({
          field: systemDef.id,
          label: systemDef.label,
          fieldType: systemDef.fieldType,
          isSystem: true,
          systemFieldId: systemDef.id,
          isDeprecated: child.metadata().deprecated ?? false,
          hasFormula: child.hasFormula(),
        });
        continue;
      }

      if (refValue === SystemSchemaIds.File) {
        columns.push({
          field: fieldPath,
          label: fieldName,
          fieldType: FilterFieldType.File,
          isSystem: false,
          isDeprecated: child.metadata().deprecated ?? false,
          hasFormula: child.hasFormula(),
        });
        continue;
      }
    }

    if (child.isObject() && !child.isRef()) {
      collectColumns(child, fieldPath, columns);
      continue;
    }

    if (child.foreignKey() !== undefined) {
      columns.push({
        field: fieldPath,
        label: fieldName,
        fieldType: FilterFieldType.ForeignKey,
        isSystem: false,
        isDeprecated: child.metadata().deprecated ?? false,
        hasFormula: child.hasFormula(),
      });
      continue;
    }

    const nodeType = child.nodeType();
    let fieldType: FilterFieldType | undefined;

    switch (nodeType) {
      case 'string':
        fieldType = FilterFieldType.String;
        break;
      case 'number':
        fieldType = FilterFieldType.Number;
        break;
      case 'boolean':
        fieldType = FilterFieldType.Boolean;
        break;
    }

    if (fieldType) {
      columns.push({
        field: fieldPath,
        label: fieldName,
        fieldType,
        isSystem: false,
        isDeprecated: child.metadata().deprecated ?? false,
        hasFormula: child.hasFormula(),
      });
    }
  }
}
