import type { SchemaNode } from '@revisium/schema-toolkit';
import { SystemSchemaIds } from '@revisium/schema-toolkit';
import { FilterFieldType } from '../../shared/field-types.js';
import { SYSTEM_FIELD_BY_REF } from '../../shared/system-fields.js';
import type { ColumnSpec } from './types.js';

const NODE_TYPE_TO_FIELD_TYPE: Readonly<
  Record<string, FilterFieldType | undefined>
> = {
  string: FilterFieldType.String,
  number: FilterFieldType.Number,
  boolean: FilterFieldType.Boolean,
};

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
    const fieldPath = buildFieldPath(parentPath, child.name());
    const column = resolveColumn(child, fieldPath);

    if (column === 'recurse') {
      collectColumns(child, fieldPath, columns);
    } else if (column) {
      columns.push(column);
    }
  }
}

function buildFieldPath(parentPath: string, fieldName: string): string {
  return parentPath ? `${parentPath}.${fieldName}` : fieldName;
}

function resolveColumn(
  child: SchemaNode,
  fieldPath: string,
): ColumnSpec | 'recurse' | null {
  if (child.isArray()) {
    return null;
  }

  const refColumn = resolveRefColumn(child, fieldPath);
  if (refColumn) {
    return refColumn;
  }

  if (child.isObject() && !child.isRef()) {
    return 'recurse';
  }

  if (child.foreignKey() !== undefined) {
    return createColumn(fieldPath, child, FilterFieldType.ForeignKey);
  }

  const fieldType = NODE_TYPE_TO_FIELD_TYPE[child.nodeType()];
  if (fieldType) {
    return createColumn(fieldPath, child, fieldType);
  }

  return null;
}

function resolveRefColumn(
  child: SchemaNode,
  fieldPath: string,
): ColumnSpec | null {
  const refValue = child.ref();
  if (!refValue) {
    return null;
  }

  const systemDef = SYSTEM_FIELD_BY_REF.get(refValue);
  if (systemDef) {
    return {
      field: systemDef.id,
      label: systemDef.label,
      fieldType: systemDef.fieldType,
      isSystem: true,
      systemFieldId: systemDef.id,
      isDeprecated: child.metadata().deprecated ?? false,
      hasFormula: child.hasFormula(),
    };
  }

  if (refValue === SystemSchemaIds.File) {
    return createColumn(fieldPath, child, FilterFieldType.File);
  }

  return null;
}

function createColumn(
  fieldPath: string,
  child: SchemaNode,
  fieldType: FilterFieldType,
): ColumnSpec {
  return {
    field: fieldPath,
    label: child.name(),
    fieldType,
    isSystem: false,
    isDeprecated: child.metadata().deprecated ?? false,
    hasFormula: child.hasFormula(),
  };
}
