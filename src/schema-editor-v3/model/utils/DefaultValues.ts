import type { JsonPatch } from '@revisium/schema-toolkit';
import { generateDefaultValue } from '@revisium/schema-toolkit';

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

interface SchemaLike {
  $ref?: string;
  type?: string;
  foreignKey?: string;
}

function getTypeFromSchema(schema: SchemaLike): SchemaType {
  if (schema.$ref) {
    return 'ref';
  }
  if (schema.type) {
    return schema.type as SchemaType;
  }
  return 'unknown';
}

function getForeignKeyTableId(schema: SchemaLike): string | undefined {
  if (schema.type === 'string' && schema.foreignKey) {
    return schema.foreignKey || undefined;
  }
  return undefined;
}

export function getDefaultValueExample(
  patch: JsonPatch,
): DefaultValueExample | null {
  if (patch.op !== 'add' || patch.value === undefined) {
    return null;
  }

  const schema = patch.value as SchemaLike;
  const value = generateDefaultValue(patch.value, { arrayItemCount: 1 });
  const type = getTypeFromSchema(schema);
  const foreignKeyTableId = getForeignKeyTableId(schema);

  return { value, type, foreignKeyTableId };
}
