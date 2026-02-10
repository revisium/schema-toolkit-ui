import { SystemSchemaIds } from '@revisium/schema-toolkit';
import { FilterFieldType } from './field-types.js';

export enum SystemFieldId {
  Id = 'id',
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  CreatedId = 'createdId',
  VersionId = 'versionId',
  PublishedAt = 'publishedAt',
  Hash = 'hash',
  SchemaHash = 'schemaHash',
}

export interface SystemFieldDef {
  id: SystemFieldId;
  label: string;
  fieldType: FilterFieldType;
  ref: SystemSchemaIds;
}

export const SYSTEM_FIELDS: SystemFieldDef[] = [
  {
    id: SystemFieldId.Id,
    label: 'id',
    fieldType: FilterFieldType.String,
    ref: SystemSchemaIds.RowId,
  },
  {
    id: SystemFieldId.CreatedAt,
    label: 'createdAt',
    fieldType: FilterFieldType.DateTime,
    ref: SystemSchemaIds.RowCreatedAt,
  },
  {
    id: SystemFieldId.UpdatedAt,
    label: 'updatedAt',
    fieldType: FilterFieldType.DateTime,
    ref: SystemSchemaIds.RowUpdatedAt,
  },
  {
    id: SystemFieldId.CreatedId,
    label: 'createdId',
    fieldType: FilterFieldType.String,
    ref: SystemSchemaIds.RowCreatedId,
  },
  {
    id: SystemFieldId.VersionId,
    label: 'versionId',
    fieldType: FilterFieldType.String,
    ref: SystemSchemaIds.RowVersionId,
  },
  {
    id: SystemFieldId.PublishedAt,
    label: 'publishedAt',
    fieldType: FilterFieldType.DateTime,
    ref: SystemSchemaIds.RowPublishedAt,
  },
  {
    id: SystemFieldId.Hash,
    label: 'hash',
    fieldType: FilterFieldType.String,
    ref: SystemSchemaIds.RowHash,
  },
  {
    id: SystemFieldId.SchemaHash,
    label: 'schemaHash',
    fieldType: FilterFieldType.String,
    ref: SystemSchemaIds.RowSchemaHash,
  },
];

export const SYSTEM_FIELD_BY_REF: ReadonlyMap<string, SystemFieldDef> = new Map(
  SYSTEM_FIELDS.map((f) => [f.ref, f]),
);
