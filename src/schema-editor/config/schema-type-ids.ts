import { SystemSchemaIds } from '@revisium/schema-toolkit';

const SYSTEM_SCHEMA_LABELS: Record<string, string> = {
  [SystemSchemaIds.RowId]: 'id',
  [SystemSchemaIds.RowCreatedId]: 'createdId',
  [SystemSchemaIds.RowVersionId]: 'versionId',
  [SystemSchemaIds.RowCreatedAt]: 'createdAt',
  [SystemSchemaIds.RowPublishedAt]: 'publishedAt',
  [SystemSchemaIds.RowUpdatedAt]: 'updatedAt',
  [SystemSchemaIds.RowHash]: 'hash',
  [SystemSchemaIds.RowSchemaHash]: 'schemaHash',
  [SystemSchemaIds.File]: 'File',
};

export const getLabelByRef = (ref: string): string => {
  return SYSTEM_SCHEMA_LABELS[ref] ?? ref;
};

export enum SchemaTypeIds {
  String = 'String',
  Number = 'Number',
  Boolean = 'Boolean',
  Object = 'Object',
  Array = 'Array',
  ForeignKeyString = 'ForeignKeyString',
  File = 'File',
  RowId = 'RowId',
  RowVersionId = 'RowVersionId',
  RowCreatedId = 'RowCreatedId',
  RowCreatedAt = 'RowCreatedAt',
  RowPublishedAt = 'RowPublishedAt',
  RowUpdatedAt = 'RowUpdatedAt',
  RowHash = 'RowHash',
  RowSchemaHash = 'RowSchemaHash',
  Markdown = 'Markdown',
}

type BaseOption = {
  id: string;
  label: string;
  type?: 'item' | 'submenu';
};

export type MenuOptionItem =
  | (BaseOption & {
      type?: 'item';
      addDividerAfter?: boolean;
    })
  | (BaseOption & {
      type: 'submenu';
      items: MenuOptionItem[];
    });

export type MenuGroup = {
  id: string;
  options: MenuOptionItem[];
  addDividerAfter?: boolean;
};

const typesOptions: MenuOptionItem[] = [
  { id: SchemaTypeIds.String, label: 'string' },
  { id: SchemaTypeIds.Number, label: 'number' },
  { id: SchemaTypeIds.Boolean, label: 'boolean' },
  { id: SchemaTypeIds.Object, label: 'object' },
  { id: SchemaTypeIds.Array, label: 'array' },
  { id: SchemaTypeIds.ForeignKeyString, label: 'foreign key' },
];

const schemasOptions: MenuOptionItem[] = [
  {
    id: 'schemas-submenu',
    label: 'Schemas',
    type: 'submenu',
    items: [
      { id: SchemaTypeIds.File, label: getLabelByRef(SystemSchemaIds.File) },
      { id: SchemaTypeIds.Markdown, label: 'Markdown' },
    ],
  },
];

const systemFieldsOptions: MenuOptionItem[] = [
  {
    id: 'system-fields-submenu',
    label: 'System fields',
    type: 'submenu',
    items: [
      { id: SchemaTypeIds.RowId, label: getLabelByRef(SystemSchemaIds.RowId) },
      {
        id: SchemaTypeIds.RowVersionId,
        label: getLabelByRef(SystemSchemaIds.RowVersionId),
      },
      {
        id: SchemaTypeIds.RowCreatedId,
        label: getLabelByRef(SystemSchemaIds.RowCreatedId),
        addDividerAfter: true,
      },
      {
        id: SchemaTypeIds.RowCreatedAt,
        label: getLabelByRef(SystemSchemaIds.RowCreatedAt),
      },
      {
        id: SchemaTypeIds.RowPublishedAt,
        label: getLabelByRef(SystemSchemaIds.RowPublishedAt),
      },
      {
        id: SchemaTypeIds.RowUpdatedAt,
        label: getLabelByRef(SystemSchemaIds.RowUpdatedAt),
        addDividerAfter: true,
      },
      {
        id: SchemaTypeIds.RowHash,
        label: getLabelByRef(SystemSchemaIds.RowHash),
      },
      {
        id: SchemaTypeIds.RowSchemaHash,
        label: getLabelByRef(SystemSchemaIds.RowSchemaHash),
      },
    ],
  },
];

export const typeMenuGroups: MenuGroup[] = [
  { id: 'types', options: typesOptions, addDividerAfter: true },
  { id: 'schemas', options: schemasOptions, addDividerAfter: true },
  { id: 'system-fields', options: systemFieldsOptions },
];
