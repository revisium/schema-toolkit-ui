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

export type JsonPatch =
  | { op: 'add'; path: string; value: JsonValue }
  | { op: 'remove'; path: string }
  | { op: 'replace'; path: string; value: JsonValue }
  | { op: 'move'; from: string; path: string }
  | { op: 'copy'; from: string; path: string }
  | { op: 'test'; path: string; value: JsonValue };

export enum ViewerSwitcherMode {
  Tree = 'Tree',
  Json = 'Json',
  RefBy = 'RefBy',
}

export enum SystemSchemaIds {
  File = 'File',
  RowId = 'RowId',
  RowVersionId = 'RowVersionId',
  RowCreatedId = 'RowCreatedId',
  RowCreatedAt = 'RowCreatedAt',
  RowPublishedAt = 'RowPublishedAt',
  RowUpdatedAt = 'RowUpdatedAt',
  RowHash = 'RowHash',
  RowSchemaHash = 'RowSchemaHash',
}

export const getLabelByRef = (ref: string): string => {
  const refMap: Record<string, string> = {
    File: 'file',
    RowId: 'rowId',
    RowVersionId: 'versionId',
    RowCreatedId: 'createdId',
    RowCreatedAt: 'createdAt',
    RowPublishedAt: 'publishedAt',
    RowUpdatedAt: 'updatedAt',
    RowHash: 'hash',
    RowSchemaHash: 'schemaHash',
  };
  return refMap[ref] ?? ref;
};
