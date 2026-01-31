import type { JsonObjectSchema } from '../../../model';

// ============ EMPTY / BASIC ============

export const emptyObjectSchema: JsonObjectSchema = {
  type: 'object',
  properties: {},
  additionalProperties: false,
  required: [],
};

export const simpleSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    price: { type: 'number', default: 0 },
    inStock: { type: 'boolean', default: true },
  },
  additionalProperties: false,
  required: ['title', 'description', 'price', 'inStock'],
};

// ============ ROOT TYPES ============

export const arrayOfStringsSchema: JsonObjectSchema = {
  type: 'array',
  items: { type: 'string', default: '' },
  default: [],
} as unknown as JsonObjectSchema;

export const arrayOfNumbersSchema: JsonObjectSchema = {
  type: 'array',
  items: { type: 'number', default: 0 },
  default: [],
} as unknown as JsonObjectSchema;

export const arrayOfObjectsSchema: JsonObjectSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      name: { type: 'string', default: '' },
      value: { type: 'number', default: 0 },
    },
    additionalProperties: false,
    required: ['name', 'value'],
  },
  default: [],
} as unknown as JsonObjectSchema;

export const arrayOfArraysSchema: JsonObjectSchema = {
  type: 'array',
  items: {
    type: 'array',
    items: { type: 'string', default: '' },
    default: [],
  },
  default: [],
} as unknown as JsonObjectSchema;

export const primitiveStringSchema: JsonObjectSchema = {
  type: 'string',
  default: '',
} as unknown as JsonObjectSchema;

export const primitiveNumberSchema: JsonObjectSchema = {
  type: 'number',
  default: 0,
} as unknown as JsonObjectSchema;

export const primitiveBooleanSchema: JsonObjectSchema = {
  type: 'boolean',
  default: false,
} as unknown as JsonObjectSchema;

// ============ FIELD TYPES ============

export const allPrimitivesSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    stringField: { type: 'string', default: '' },
    numberField: { type: 'number', default: 0 },
    booleanField: { type: 'boolean', default: false },
  },
  additionalProperties: false,
  required: ['stringField', 'numberField', 'booleanField'],
};

export const nestedObjectSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            firstName: { type: 'string', default: '' },
            lastName: { type: 'string', default: '' },
          },
          additionalProperties: false,
          required: ['firstName', 'lastName'],
        },
      },
      additionalProperties: false,
      required: ['profile'],
    },
  },
  additionalProperties: false,
  required: ['user'],
};

export const arrayFieldsSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    tags: {
      type: 'array',
      items: { type: 'string', default: '' },
      default: [],
    },
    scores: {
      type: 'array',
      items: { type: 'number', default: 0 },
      default: [],
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', default: '' },
          quantity: { type: 'number', default: 1 },
        },
        additionalProperties: false,
        required: ['id', 'quantity'],
      },
      default: [],
    },
    matrix: {
      type: 'array',
      items: {
        type: 'array',
        items: { type: 'number', default: 0 },
        default: [],
      },
      default: [],
    },
  },
  additionalProperties: false,
  required: ['tags', 'scores', 'items', 'matrix'],
};

export const foreignKeysSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', default: '' },
    categoryId: { type: 'string', default: '', foreignKey: 'categories' },
    authorId: { type: 'string', default: '', foreignKey: 'authors' },
  },
  additionalProperties: false,
  required: ['title', 'categoryId', 'authorId'],
};

export const systemRefsSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', default: '' },
    image: { $ref: 'urn:jsonschema:io:revisium:file-schema:1.0.0' },
    createdAt: {
      $ref: 'urn:jsonschema:io:revisium:row-created-at-schema:1.0.0',
    },
    updatedAt: {
      $ref: 'urn:jsonschema:io:revisium:row-updated-at-schema:1.0.0',
    },
  },
  additionalProperties: false,
  required: ['title', 'image', 'createdAt', 'updatedAt'],
};

// ============ FORMULAS ============

export const simpleFormulaSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    price: { type: 'number', default: 0 },
    quantity: { type: 'number', default: 1 },
    total: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'price * quantity' },
    },
  },
  additionalProperties: false,
  required: ['price', 'quantity', 'total'],
} as JsonObjectSchema;

export const formulaChainSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    price: { type: 'number', default: 0 },
    quantity: { type: 'number', default: 1 },
    discount: { type: 'number', default: 0 },
    subtotal: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'price * quantity' },
    },
    discountAmount: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'subtotal * discount / 100' },
    },
    total: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'subtotal - discountAmount' },
    },
  },
  additionalProperties: false,
  required: [
    'price',
    'quantity',
    'discount',
    'subtotal',
    'discountAmount',
    'total',
  ],
} as JsonObjectSchema;

export const formulaInNestedSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    order: {
      type: 'object',
      properties: {
        price: { type: 'number', default: 0 },
        quantity: { type: 'number', default: 1 },
        total: {
          type: 'number',
          default: 0,
          readOnly: true,
          'x-formula': { version: 1, expression: 'price * quantity' },
        },
      },
      additionalProperties: false,
      required: ['price', 'quantity', 'total'],
    },
  },
  additionalProperties: false,
  required: ['order'],
} as JsonObjectSchema;

export const formulaInArraySchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          price: { type: 'number', default: 0 },
          quantity: { type: 'number', default: 1 },
          total: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': { version: 1, expression: 'price * quantity' },
          },
        },
        additionalProperties: false,
        required: ['price', 'quantity', 'total'],
      },
      default: [],
    },
  },
  additionalProperties: false,
  required: ['items'],
} as JsonObjectSchema;

export const formulaWithErrorSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    value: { type: 'number', default: 0 },
    computed: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'unknownField * 2' },
    },
  },
  additionalProperties: false,
  required: ['value', 'computed'],
} as JsonObjectSchema;

// ============ COMPLEX ============

export const deepNestedSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    level1: {
      type: 'object',
      properties: {
        level2: {
          type: 'object',
          properties: {
            level3: {
              type: 'object',
              properties: {
                level4: {
                  type: 'object',
                  properties: {
                    value: { type: 'string', default: '' },
                  },
                  additionalProperties: false,
                  required: ['value'],
                },
              },
              additionalProperties: false,
              required: ['level4'],
            },
          },
          additionalProperties: false,
          required: ['level3'],
        },
      },
      additionalProperties: false,
      required: ['level2'],
    },
  },
  additionalProperties: false,
  required: ['level1'],
};

export const largeSchema: JsonObjectSchema = {
  type: 'object',
  properties: Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => [
      `field${i + 1}`,
      { type: 'string', default: '' },
    ]),
  ),
  additionalProperties: false,
  required: Array.from({ length: 20 }, (_, i) => `field${i + 1}`),
};

export const mixedComplexSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: '' },
    categoryId: { type: 'string', default: '', foreignKey: 'categories' },
    metadata: {
      type: 'object',
      properties: {
        createdBy: { type: 'string', default: '' },
        tags: {
          type: 'array',
          items: { type: 'string', default: '' },
          default: [],
        },
      },
      additionalProperties: false,
      required: ['createdBy', 'tags'],
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          productId: { type: 'string', default: '', foreignKey: 'products' },
          price: { type: 'number', default: 0 },
          quantity: { type: 'number', default: 1 },
          total: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': { version: 1, expression: 'price * quantity' },
          },
        },
        additionalProperties: false,
        required: ['productId', 'price', 'quantity', 'total'],
      },
      default: [],
    },
    attachment: { $ref: 'urn:jsonschema:io:revisium:file-schema:1.0.0' },
    createdAt: {
      $ref: 'urn:jsonschema:io:revisium:row-created-at-schema:1.0.0',
    },
  },
  additionalProperties: false,
  required: [
    'name',
    'categoryId',
    'metadata',
    'items',
    'attachment',
    'createdAt',
  ],
};

// ============ EDGE CASES ============

export const longFieldNamesSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    thisIsAVeryLongFieldNameThatMightCauseLayoutIssues: {
      type: 'string',
      default: '',
    },
    anotherExtremelyLongFieldNameForTestingPurposes: {
      type: 'number',
      default: 0,
    },
  },
  additionalProperties: false,
  required: [
    'thisIsAVeryLongFieldNameThatMightCauseLayoutIssues',
    'anotherExtremelyLongFieldNameForTestingPurposes',
  ],
};

export const unicodeFieldsSchema: JsonObjectSchema = {
  type: 'object',
  properties: {
    field_with_emoji: { type: 'string', default: '' },
    field_кириллица: { type: 'string', default: '' },
    field_日本語: { type: 'string', default: '' },
  },
  additionalProperties: false,
  required: ['field_with_emoji', 'field_кириллица', 'field_日本語'],
};
