import type { JsonSchemaType } from '../schema/JsonSchema';

export type MetadataChangeType =
  | 'formula'
  | 'description'
  | 'deprecated'
  | 'foreignKey'
  | 'enum'
  | 'format'
  | 'default';

export type DefaultValueType = string | number | boolean | undefined;

export interface RichPatch {
  patch: {
    op: 'add' | 'remove' | 'replace' | 'move';
    path: string;
    from?: string;
    value?: JsonSchemaType;
  };
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
  isRename?: boolean;
  movesIntoArray?: boolean;
}

export interface MetadataChangesResult {
  metadataChanges: MetadataChangeType[];
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
}
