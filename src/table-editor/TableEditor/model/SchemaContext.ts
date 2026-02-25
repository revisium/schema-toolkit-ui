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
  JsonSchema,
  RefSchemas,
  SchemaNode,
} from '@revisium/schema-toolkit';
import { extractColumns } from '../../Columns/model/extractColumns.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { FilterFieldType } from '../../shared/field-types.js';
import { SYSTEM_FIELDS } from '../../shared/system-fields.js';

export const DATA_FIELD = 'data';

export function stripDataFieldPrefix(field: string): string {
  const prefix = `${DATA_FIELD}.`;
  if (field.startsWith(prefix)) {
    return field.slice(prefix.length);
  }
  if (field === DATA_FIELD) {
    return '';
  }
  return field;
}

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

export function wrapDataSchema(dataSchema: JsonSchema): JsonObjectSchema {
  return {
    type: 'object',
    properties: { [DATA_FIELD]: dataSchema },
    additionalProperties: false,
    required: [DATA_FIELD],
  } as JsonObjectSchema;
}

function buildRowSchema(wrappedDataSchema: JsonObjectSchema): JsonObjectSchema {
  const systemProperties: Record<string, { $ref: string }> = {};
  for (const sf of SYSTEM_FIELDS) {
    systemProperties[sf.id] = { $ref: sf.ref };
  }

  return {
    type: 'object',
    properties: {
      ...systemProperties,
      ...wrappedDataSchema.properties,
    },
    additionalProperties: false,
    required: [...Object.keys(systemProperties), ...wrappedDataSchema.required],
  } as JsonObjectSchema;
}

export class SchemaContext {
  private _allColumns: ColumnSpec[] = [];
  private _dataSchema: JsonSchema | null = null;
  private _wrappedDataSchema: JsonObjectSchema | null = null;
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

  get dataSchema(): JsonSchema | null {
    return this._dataSchema;
  }

  get wrappedDataSchema(): JsonObjectSchema | null {
    return this._wrappedDataSchema;
  }

  get fullRefSchemas(): RefSchemas {
    return this._fullRefSchemas;
  }

  get rootNode(): SchemaNode | null {
    return this._rootNode;
  }

  init(dataSchema: JsonSchema, refSchemas?: RefSchemas): void {
    this._dataSchema = dataSchema;
    this._fullRefSchemas = { ...SYSTEM_REF_SCHEMAS, ...refSchemas };

    const wrapped = wrapDataSchema(dataSchema);
    this._wrappedDataSchema = wrapped;
    const rowSchema = buildRowSchema(wrapped);
    const parser = new SchemaParser();
    this._rootNode = parser.parse(rowSchema, this._fullRefSchemas);
    this._allColumns = extractColumns(this._rootNode);
  }
}
