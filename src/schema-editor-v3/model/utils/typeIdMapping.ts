import type { FieldType } from '@revisium/schema-toolkit';

const TYPE_ID_TO_FIELD_TYPE: Record<string, FieldType> = {
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Object: 'object',
  Array: 'array',
};

export function typeIdToFieldType(typeId: string): FieldType | null {
  return TYPE_ID_TO_FIELD_TYPE[typeId] ?? null;
}
