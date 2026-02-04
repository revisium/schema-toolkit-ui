// Re-export types from schema-toolkit
export type { JsonPatch } from '@revisium/schema-toolkit';

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export enum JsonSchemaTypeName {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object',
  Array = 'array',
}

export enum ViewerSwitcherMode {
  Tree = 'Tree',
  Json = 'Json',
  RefBy = 'RefBy',
}

export enum SystemSchemaIds {
  RowId = 'urn:jsonschema:io:revisium:row-id-schema:1.0.0',
  RowCreatedId = 'urn:jsonschema:io:revisium:row-created-id-schema:1.0.0',
  RowVersionId = 'urn:jsonschema:io:revisium:row-version-id-schema:1.0.0',
  RowCreatedAt = 'urn:jsonschema:io:revisium:row-created-at-schema:1.0.0',
  RowPublishedAt = 'urn:jsonschema:io:revisium:row-published-at-schema:1.0.0',
  RowUpdatedAt = 'urn:jsonschema:io:revisium:row-updated-at-schema:1.0.0',
  RowHash = 'urn:jsonschema:io:revisium:row-hash-schema:1.0.0',
  RowSchemaHash = 'urn:jsonschema:io:revisium:row-schema-hash-schema:1.0.0',
  File = 'urn:jsonschema:io:revisium:file-schema:1.0.0',
}

export const getLabelByRef = (ref: string): string => {
  const refMap: Record<string, string> = {
    [SystemSchemaIds.RowId]: 'id',
    [SystemSchemaIds.RowVersionId]: 'versionId',
    [SystemSchemaIds.RowCreatedId]: 'createdId',
    [SystemSchemaIds.RowCreatedAt]: 'createdAt',
    [SystemSchemaIds.RowPublishedAt]: 'publishedAt',
    [SystemSchemaIds.RowUpdatedAt]: 'updatedAt',
    [SystemSchemaIds.RowHash]: 'hash',
    [SystemSchemaIds.RowSchemaHash]: 'schemaHash',
    [SystemSchemaIds.File]: 'File',
  };
  return refMap[ref] ?? ref;
};
