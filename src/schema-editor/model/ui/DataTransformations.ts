export type DataLossSeverity = 'none' | 'possible' | 'certain';

export interface TransformationStep {
  name: string;
  dataLossSeverity: DataLossSeverity;
}

export interface TransformationInfo {
  fromType: string;
  toType: string;
  example: { before: unknown; after: unknown };
  dataLossSeverity: DataLossSeverity;
  steps: TransformationStep[];
}

type SchemaType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array'
  | 'ref'
  | 'unknown';

interface TransformationRule {
  fromType: SchemaType;
  toType: SchemaType;
  example: { before: unknown; after: unknown };
  dataLossSeverity: DataLossSeverity;
  stepName: string;
}

interface TransformationContext {
  fromType: SchemaType;
  toType: SchemaType;
  fromItemsType?: SchemaType;
  toItemsType?: SchemaType;
}

const transformationRules: TransformationRule[] = [
  {
    fromType: 'number',
    toType: 'string',
    example: { before: 123, after: '123' },
    dataLossSeverity: 'none',
    stepName: 'number → string',
  },
  {
    fromType: 'boolean',
    toType: 'string',
    example: { before: true, after: 'true' },
    dataLossSeverity: 'none',
    stepName: 'boolean → string',
  },
  {
    fromType: 'boolean',
    toType: 'number',
    example: { before: true, after: 1 },
    dataLossSeverity: 'none',
    stepName: 'boolean → number',
  },
  {
    fromType: 'string',
    toType: 'number',
    example: { before: '123', after: 123 },
    dataLossSeverity: 'possible',
    stepName: 'string → number',
  },
  {
    fromType: 'string',
    toType: 'boolean',
    example: { before: 'hello', after: true },
    dataLossSeverity: 'possible',
    stepName: 'string → boolean',
  },
  {
    fromType: 'number',
    toType: 'boolean',
    example: { before: 42, after: true },
    dataLossSeverity: 'possible',
    stepName: 'number → boolean',
  },
  {
    fromType: 'object',
    toType: 'string',
    example: { before: { a: 1 }, after: '' },
    dataLossSeverity: 'certain',
    stepName: 'object → string',
  },
  {
    fromType: 'object',
    toType: 'number',
    example: { before: { a: 1 }, after: 0 },
    dataLossSeverity: 'certain',
    stepName: 'object → number',
  },
  {
    fromType: 'object',
    toType: 'boolean',
    example: { before: { a: 1 }, after: false },
    dataLossSeverity: 'certain',
    stepName: 'object → boolean',
  },
  {
    fromType: 'array',
    toType: 'string',
    example: { before: ['a', 'b'], after: 'a' },
    dataLossSeverity: 'possible',
    stepName: 'array → string (first element)',
  },
  {
    fromType: 'array',
    toType: 'number',
    example: { before: [1, 2], after: 1 },
    dataLossSeverity: 'possible',
    stepName: 'array → number (first element)',
  },
  {
    fromType: 'array',
    toType: 'boolean',
    example: { before: [true, false], after: true },
    dataLossSeverity: 'possible',
    stepName: 'array → boolean (first element)',
  },
  {
    fromType: 'string',
    toType: 'object',
    example: { before: 'hello', after: {} },
    dataLossSeverity: 'certain',
    stepName: 'string → object',
  },
  {
    fromType: 'number',
    toType: 'object',
    example: { before: 42, after: {} },
    dataLossSeverity: 'certain',
    stepName: 'number → object',
  },
  {
    fromType: 'boolean',
    toType: 'object',
    example: { before: true, after: {} },
    dataLossSeverity: 'certain',
    stepName: 'boolean → object',
  },
  {
    fromType: 'string',
    toType: 'array',
    example: { before: 'hello', after: ['hello'] },
    dataLossSeverity: 'none',
    stepName: 'wrap in array',
  },
  {
    fromType: 'number',
    toType: 'array',
    example: { before: 42, after: [42] },
    dataLossSeverity: 'none',
    stepName: 'wrap in array',
  },
  {
    fromType: 'boolean',
    toType: 'array',
    example: { before: true, after: [true] },
    dataLossSeverity: 'none',
    stepName: 'wrap in array',
  },
  {
    fromType: 'object',
    toType: 'array',
    example: { before: { a: 1 }, after: [] },
    dataLossSeverity: 'certain',
    stepName: 'object → array',
  },
  {
    fromType: 'array',
    toType: 'object',
    example: { before: [1, 2], after: {} },
    dataLossSeverity: 'certain',
    stepName: 'array → object',
  },
];

const sampleValues: Record<SchemaType, unknown> = {
  string: 'hello',
  number: 42,
  boolean: true,
  object: { a: 1 },
  array: [1, 2],
  ref: null,
  unknown: null,
};

const validSchemaTypes = new Set<SchemaType>([
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'ref',
  'unknown',
]);

function toSchemaType(typeStr: string): SchemaType {
  return validSchemaTypes.has(typeStr as SchemaType)
    ? (typeStr as SchemaType)
    : 'unknown';
}

function parseTypeString(typeStr: string): {
  baseType: SchemaType;
  itemsType?: SchemaType;
} {
  const arrayMatch = typeStr.match(/^array<(.+)>$/);
  if (arrayMatch && arrayMatch[1]) {
    return { baseType: 'array', itemsType: toSchemaType(arrayMatch[1]) };
  }
  return { baseType: toSchemaType(typeStr) };
}

function findTransformationRule(
  fromType: SchemaType,
  toType: SchemaType,
): TransformationRule | null {
  if (fromType === toType) {
    return null;
  }
  return (
    transformationRules.find(
      (rule) => rule.fromType === fromType && rule.toType === toType,
    ) ?? null
  );
}

function transformValue(
  value: unknown,
  fromType: SchemaType,
  toType: SchemaType,
): unknown {
  if (fromType === toType) {
    return value;
  }
  switch (toType) {
    case 'string':
      return String(value);
    case 'number':
      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }
      return typeof value === 'number' ? value : 0;
    case 'boolean':
      return Boolean(value);
    default:
      return value;
  }
}

function getConversionSeverity(
  fromType: SchemaType,
  toType: SchemaType,
): DataLossSeverity {
  if (fromType === toType) {
    return 'none';
  }
  const rule = findTransformationRule(fromType, toType);
  return rule ? rule.dataLossSeverity : 'certain';
}

function maxSeverity(
  a: DataLossSeverity,
  b: DataLossSeverity,
): DataLossSeverity {
  const order: DataLossSeverity[] = ['none', 'possible', 'certain'];
  return order[Math.max(order.indexOf(a), order.indexOf(b))] ?? 'certain';
}

function computeOverallSeverity(steps: TransformationStep[]): DataLossSeverity {
  return steps.reduce<DataLossSeverity>(
    (acc, step) => maxSeverity(acc, step.dataLossSeverity),
    'none',
  );
}

function buildTransformationSteps(
  ctx: TransformationContext,
): TransformationStep[] {
  const { fromType, toType, fromItemsType, toItemsType } = ctx;
  const steps: TransformationStep[] = [];

  if (
    toType === 'array' &&
    toItemsType !== undefined &&
    fromType !== 'array' &&
    fromType !== 'object'
  ) {
    steps.push({ name: 'wrap in array', dataLossSeverity: 'none' });
    if (fromType !== toItemsType) {
      const severity = getConversionSeverity(fromType, toItemsType);
      steps.push({
        name: `${fromType} → ${toItemsType}`,
        dataLossSeverity: severity,
      });
    }
  } else if (
    fromType === 'array' &&
    fromItemsType !== undefined &&
    toType !== 'array' &&
    toType !== 'object'
  ) {
    steps.push({
      name: 'unwrap array (first element)',
      dataLossSeverity: 'possible',
    });
    if (fromItemsType !== toType) {
      const severity = getConversionSeverity(fromItemsType, toType);
      steps.push({
        name: `${fromItemsType} → ${toType}`,
        dataLossSeverity: severity,
      });
    }
  } else if (
    fromType === 'object' ||
    toType === 'object' ||
    fromType === 'array' ||
    toType === 'array'
  ) {
    steps.push({
      name: `${fromType} → ${toType}`,
      dataLossSeverity: 'certain',
    });
  } else {
    const severity = getConversionSeverity(fromType, toType);
    steps.push({ name: `${fromType} → ${toType}`, dataLossSeverity: severity });
  }

  return steps;
}

function computeArrayTransformationExample(
  fromType: SchemaType,
  itemsType: SchemaType,
): { before: unknown; after: unknown } {
  const before = sampleValues[fromType];
  const transformedValue = transformValue(before, fromType, itemsType);
  return { before, after: [transformedValue] };
}

function computeArrayToPrimitiveExample(
  fromItemsType: SchemaType,
  toType: SchemaType,
): { before: unknown; after: unknown } {
  const itemValue = sampleValues[fromItemsType];
  const before = [itemValue, itemValue];
  const after = transformValue(itemValue, fromItemsType, toType);
  return { before, after };
}

export function getTransformationInfoFromTypeChange(
  fromType: string,
  toType: string,
): TransformationInfo | null {
  if (fromType === toType) {
    return null;
  }

  const from = parseTypeString(fromType);
  const to = parseTypeString(toType);

  if (from.baseType === 'unknown' || to.baseType === 'unknown') {
    return null;
  }

  if (
    to.baseType === 'array' &&
    to.itemsType &&
    from.baseType !== 'array' &&
    from.baseType !== 'object'
  ) {
    const example = computeArrayTransformationExample(
      from.baseType,
      to.itemsType,
    );
    const steps = buildTransformationSteps({
      fromType: from.baseType,
      toType: to.baseType,
      toItemsType: to.itemsType,
    });
    return {
      fromType,
      toType,
      example,
      dataLossSeverity: computeOverallSeverity(steps),
      steps,
    };
  }

  if (
    from.baseType === 'array' &&
    from.itemsType &&
    to.baseType !== 'array' &&
    to.baseType !== 'object'
  ) {
    const example = computeArrayToPrimitiveExample(from.itemsType, to.baseType);
    const steps = buildTransformationSteps({
      fromType: from.baseType,
      toType: to.baseType,
      fromItemsType: from.itemsType,
    });
    return {
      fromType,
      toType,
      example,
      dataLossSeverity: computeOverallSeverity(steps),
      steps,
    };
  }

  const rule = findTransformationRule(from.baseType, to.baseType);
  if (rule) {
    const steps = buildTransformationSteps({
      fromType: from.baseType,
      toType: to.baseType,
    });
    return {
      fromType,
      toType,
      example: rule.example,
      dataLossSeverity: rule.dataLossSeverity,
      steps,
    };
  }

  return {
    fromType,
    toType,
    example: { before: '?', after: '?' },
    dataLossSeverity: 'certain',
    steps: [
      {
        name: `${from.baseType} → ${to.baseType}`,
        dataLossSeverity: 'certain',
      },
    ],
  };
}
