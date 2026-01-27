import type { JsonSchemaType } from '../schema/JsonSchema';

export interface DefaultValueExample {
  value: unknown;
  type: string;
  foreignKeyTableId?: string;
}

type SchemaType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'ref'
  | 'unknown';

function getTypeFromSchema(schema: JsonSchemaType): SchemaType {
  if ('$ref' in schema) {
    return 'ref';
  }
  if ('type' in schema) {
    return schema.type as SchemaType;
  }
  return 'unknown';
}

function getForeignKeyTableId(schema: JsonSchemaType): string | undefined {
  if ('type' in schema && schema.type === 'string' && 'foreignKey' in schema) {
    const fk = (schema as { foreignKey?: string }).foreignKey;
    return fk || undefined;
  }
  return undefined;
}

function getDefaultForPrimitive(
  schema: JsonSchemaType,
  fallback: unknown,
): unknown {
  return 'default' in schema ? schema.default : fallback;
}

function getDefaultForArray(schema: JsonSchemaType): unknown {
  if ('default' in schema) {
    return schema.default;
  }
  const arrSchema = schema as { items?: JsonSchemaType };
  if (arrSchema.items) {
    return [getDefaultValueFromSchema(arrSchema.items)];
  }
  return [];
}

function getDefaultForObject(schema: JsonSchemaType): unknown {
  if ('default' in schema) {
    return schema.default;
  }
  const objSchema = schema as { properties?: Record<string, JsonSchemaType> };
  if (!objSchema.properties) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(objSchema.properties).map(([key, propSchema]) => [
      key,
      getDefaultValueFromSchema(propSchema),
    ]),
  );
}

const typeHandlers: Record<string, (schema: JsonSchemaType) => unknown> = {
  string: (schema) => getDefaultForPrimitive(schema, ''),
  number: (schema) => getDefaultForPrimitive(schema, 0),
  boolean: (schema) => getDefaultForPrimitive(schema, false),
  array: getDefaultForArray,
  object: getDefaultForObject,
};

export function getDefaultValueFromSchema(schema: JsonSchemaType): unknown {
  if ('$ref' in schema) {
    return null;
  }

  if (!('type' in schema)) {
    return null;
  }

  const handler = typeHandlers[schema.type];
  return handler ? handler(schema) : null;
}

interface AddPatch {
  op: 'add';
  path: string;
  value: JsonSchemaType;
}

export function getDefaultValueExample(
  patch: AddPatch,
): DefaultValueExample | null {
  if (patch.op !== 'add') {
    return null;
  }

  const value = getDefaultValueFromSchema(patch.value);
  const type = getTypeFromSchema(patch.value);
  const foreignKeyTableId = getForeignKeyTableId(patch.value);

  return { value, type, foreignKeyTableId };
}
