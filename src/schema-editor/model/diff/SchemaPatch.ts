import type { JsonSchemaType } from '../schema/JsonSchema';

export interface JsonPatch {
  op: 'add' | 'remove' | 'replace' | 'move';
  path: string;
  from?: string;
  value?: JsonSchemaType;
}

export type MetadataChangeType =
  | 'formula'
  | 'description'
  | 'deprecated'
  | 'foreignKey'
  | 'enum'
  | 'format'
  | 'default'
  | 'contentMediaType';

export type DefaultValueType = string | number | boolean | undefined;

export interface SchemaPatch {
  patch: JsonPatch;
  fieldName: string;
  metadataChanges: MetadataChangeType[];
  typeChange?: {
    fromType: string;
    toType: string;
  };
  formulaChange?: {
    fromFormula: string | undefined;
    toFormula: string | undefined;
  };
  defaultChange?: {
    fromDefault: DefaultValueType;
    toDefault: DefaultValueType;
  };
  descriptionChange?: {
    fromDescription: string | undefined;
    toDescription: string | undefined;
  };
  deprecatedChange?: {
    fromDeprecated: boolean | undefined;
    toDeprecated: boolean | undefined;
  };
  foreignKeyChange?: {
    fromForeignKey: string | undefined;
    toForeignKey: string | undefined;
  };
  contentMediaTypeChange?: {
    fromContentMediaType: string | undefined;
    toContentMediaType: string | undefined;
  };
  isRename?: boolean;
  movesIntoArray?: boolean;
}

export interface MetadataChangesResult {
  metadataChanges: MetadataChangeType[];
  formulaChange?: SchemaPatch['formulaChange'];
  defaultChange?: SchemaPatch['defaultChange'];
  descriptionChange?: SchemaPatch['descriptionChange'];
  deprecatedChange?: SchemaPatch['deprecatedChange'];
  foreignKeyChange?: SchemaPatch['foreignKeyChange'];
  contentMediaTypeChange?: SchemaPatch['contentMediaTypeChange'];
}
