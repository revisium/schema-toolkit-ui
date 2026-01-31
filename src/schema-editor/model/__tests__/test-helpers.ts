import type { JsonObjectSchema } from '../schema/index';

export const createSchema = (
  properties: Record<string, unknown>,
): JsonObjectSchema =>
  ({
    type: 'object',
    required: Object.keys(properties),
    properties,
    additionalProperties: false,
  }) as unknown as JsonObjectSchema;

export const stringField = (defaultValue = '') => ({
  type: 'string' as const,
  default: defaultValue,
});

export const numberField = (defaultValue = 0) => ({
  type: 'number' as const,
  default: defaultValue,
});

export const booleanField = (defaultValue = false) => ({
  type: 'boolean' as const,
  default: defaultValue,
});

export const objectField = (properties: Record<string, unknown>) => ({
  type: 'object' as const,
  required: Object.keys(properties),
  properties,
  additionalProperties: false as const,
});

export const arrayField = (items: unknown, withDefault = false) => ({
  type: 'array' as const,
  items,
  ...(withDefault ? { default: [] } : {}),
});

export const refField = (ref: string) => ({
  $ref: ref,
});

export const formulaField = (expression: string) => ({
  type: 'number' as const,
  default: 0,
  readOnly: true,
  'x-formula': { version: 1 as const, expression },
});

export const stringFormulaField = (expression: string) => ({
  type: 'string' as const,
  default: '',
  readOnly: true,
  'x-formula': { version: 1 as const, expression },
});

export const booleanFormulaField = (expression: string) => ({
  type: 'boolean' as const,
  default: false,
  readOnly: true,
  'x-formula': { version: 1 as const, expression },
});

export const stringWithForeignKey = (foreignKey: string) => ({
  type: 'string' as const,
  default: '',
  foreignKey,
});

export const withDescription = <T extends object>(
  field: T,
  description: string,
): T & { description: string } => ({
  ...field,
  description,
});

export const withDeprecated = <T extends object>(
  field: T,
): T & { deprecated: true } => ({
  ...field,
  deprecated: true as const,
});

export const stringWithContentMediaType = (
  contentMediaType: string,
  defaultValue = '',
) => ({
  type: 'string' as const,
  default: defaultValue,
  contentMediaType,
});
