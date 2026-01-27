export interface JsonSchemaSharedFields {
  deprecated?: boolean;
  description?: string;
  title?: string;
}

export interface XFormula {
  version: 1;
  expression: string;
}

export interface JsonStringSchema extends JsonSchemaSharedFields {
  type: 'string';
  default: string;
  foreignKey?: string;
  readOnly?: boolean;
  pattern?: string;
  format?: 'date-time' | 'date' | 'time' | 'email' | 'regex';
  contentMediaType?:
    | 'text/plain'
    | 'text/markdown'
    | 'text/html'
    | 'application/json'
    | 'application/schema+json'
    | 'application/yaml';
  enum?: string[];
  'x-formula'?: XFormula;
}

export interface JsonNumberSchema extends JsonSchemaSharedFields {
  type: 'number';
  default: number;
  readOnly?: boolean;
  'x-formula'?: XFormula;
}

export interface JsonBooleanSchema extends JsonSchemaSharedFields {
  type: 'boolean';
  default: boolean;
  readOnly?: boolean;
  'x-formula'?: XFormula;
}

export type JsonSchemaPrimitives =
  | JsonStringSchema
  | JsonNumberSchema
  | JsonBooleanSchema;

export interface JsonObjectSchema extends JsonSchemaSharedFields {
  type: 'object';
  additionalProperties: false;
  required: string[];
  properties: Record<string, JsonSchemaType>;
}

export interface JsonArraySchema extends JsonSchemaSharedFields {
  type: 'array';
  items: JsonSchemaType;
  default?: unknown[];
}

export interface JsonRefSchema {
  $ref: string;
  title?: string;
  description?: string;
  deprecated?: boolean;
}

export type JsonSchemaType =
  | JsonObjectSchema
  | JsonArraySchema
  | JsonSchemaPrimitives
  | JsonRefSchema;
