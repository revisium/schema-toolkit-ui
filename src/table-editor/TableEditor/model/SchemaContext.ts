import {
  SchemaParser,
  SystemSchemaIds,
  fileSchema,
  rowIdSchema,
  rowCreatedAtSchema,
  rowCreatedIdSchema,
  rowVersionIdSchema,
  rowPublishedAtSchema,
  rowUpdatedAtSchema,
  rowHashSchema,
  rowSchemaHashSchema,
} from '@revisium/schema-toolkit';
import type {
  JsonObjectSchema,
  RefSchemas,
  SchemaNode,
} from '@revisium/schema-toolkit';
import { extractColumns } from '../../Columns/model/extractColumns.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { FilterFieldType } from '../../shared/field-types.js';
import { SYSTEM_FIELDS } from '../../shared/system-fields.js';

const SYSTEM_REF_SCHEMAS: RefSchemas = {
  [SystemSchemaIds.File]: fileSchema,
  [SystemSchemaIds.RowId]: rowIdSchema,
  [SystemSchemaIds.RowCreatedAt]: rowCreatedAtSchema,
  [SystemSchemaIds.RowCreatedId]: rowCreatedIdSchema,
  [SystemSchemaIds.RowVersionId]: rowVersionIdSchema,
  [SystemSchemaIds.RowPublishedAt]: rowPublishedAtSchema,
  [SystemSchemaIds.RowUpdatedAt]: rowUpdatedAtSchema,
  [SystemSchemaIds.RowHash]: rowHashSchema,
  [SystemSchemaIds.RowSchemaHash]: rowSchemaHashSchema,
};

function buildRowSchema(dataSchema: JsonObjectSchema): JsonObjectSchema {
  const systemProperties: Record<string, { $ref: string }> = {};
  for (const sf of SYSTEM_FIELDS) {
    systemProperties[sf.id] = { $ref: sf.ref };
  }

  return {
    type: 'object',
    properties: {
      ...systemProperties,
      ...dataSchema.properties,
    },
    additionalProperties: false,
    required: [
      ...Object.keys(systemProperties),
      ...(dataSchema.required ?? []),
    ],
  } as JsonObjectSchema;
}

export class SchemaContext {
  private _allColumns: ColumnSpec[] = [];
  private _dataSchema: JsonObjectSchema | null = null;
  private _fullRefSchemas: RefSchemas = {};
  private _rootNode: SchemaNode | null = null;

  get allColumns(): ColumnSpec[] {
    return this._allColumns;
  }

  get sortableFields(): ColumnSpec[] {
    return this._allColumns.filter(
      (col) => !col.isDeprecated && col.fieldType !== FilterFieldType.File,
    );
  }

  get filterableFields(): ColumnSpec[] {
    return this.sortableFields;
  }

  get dataSchema(): JsonObjectSchema | null {
    return this._dataSchema;
  }

  get fullRefSchemas(): RefSchemas {
    return this._fullRefSchemas;
  }

  get rootNode(): SchemaNode | null {
    return this._rootNode;
  }

  init(dataSchema: JsonObjectSchema, refSchemas?: RefSchemas): void {
    this._dataSchema = dataSchema;
    this._fullRefSchemas = { ...SYSTEM_REF_SCHEMAS, ...refSchemas };

    const rowSchema = buildRowSchema(dataSchema);
    const parser = new SchemaParser();
    this._rootNode = parser.parse(rowSchema, this._fullRefSchemas);
    this._allColumns = extractColumns(this._rootNode);
  }
}
