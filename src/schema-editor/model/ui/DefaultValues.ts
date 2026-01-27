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

export function getDefaultValueFromSchema(schema: JsonSchemaType): unknown {
  if ('$ref' in schema) {
    return null;
  }

  if ('type' in schema) {
    switch (schema.type) {
      case 'string':
        return 'default' in schema ? schema.default : '';
      case 'number':
        return 'default' in schema ? schema.default : 0;
      case 'boolean':
        return 'default' in schema ? schema.default : false;
      case 'array': {
        if ('default' in schema) {
          return schema.default;
        }
        const arrSchema = schema;
        if (arrSchema.items) {
          const itemDefault = getDefaultValueFromSchema(arrSchema.items);
          return [itemDefault];
        }
        return [];
      }
      case 'object': {
        if ('default' in schema) {
          return schema.default;
        }
        const objSchema = schema;
        if (objSchema.properties) {
          const result: Record<string, unknown> = {};
          for (const [key, propSchema] of Object.entries(
            objSchema.properties,
          )) {
            result[key] = getDefaultValueFromSchema(propSchema);
          }
          return result;
        }
        return {};
      }
      default:
        return null;
    }
  }

  return null;
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
