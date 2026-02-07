import {
  fileSchema,
  rowIdSchema,
  rowCreatedIdSchema,
  rowVersionIdSchema,
  rowCreatedAtSchema,
  rowPublishedAtSchema,
  rowUpdatedAtSchema,
  rowHashSchema,
  rowSchemaHashSchema,
  SystemSchemaIds,
  type RefSchemas,
} from '@revisium/schema-toolkit';

export const defaultRefSchemas: RefSchemas = {
  [SystemSchemaIds.File]: fileSchema,
  [SystemSchemaIds.RowId]: rowIdSchema,
  [SystemSchemaIds.RowCreatedId]: rowCreatedIdSchema,
  [SystemSchemaIds.RowVersionId]: rowVersionIdSchema,
  [SystemSchemaIds.RowCreatedAt]: rowCreatedAtSchema,
  [SystemSchemaIds.RowPublishedAt]: rowPublishedAtSchema,
  [SystemSchemaIds.RowUpdatedAt]: rowUpdatedAtSchema,
  [SystemSchemaIds.RowHash]: rowHashSchema,
  [SystemSchemaIds.RowSchemaHash]: rowSchemaHashSchema,
};
