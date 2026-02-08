export const simpleSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: '' },
    email: { type: 'string', default: '' },
    age: { type: 'number', default: 0 },
    active: { type: 'boolean', default: false },
  },
  additionalProperties: false,
};

export const nestedSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: '' },
    address: {
      type: 'object',
      properties: {
        street: { type: 'string', default: '' },
        city: { type: 'string', default: '' },
        zip: { type: 'string', default: '' },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};

export const arraySchema = {
  type: 'object',
  properties: {
    title: { type: 'string', default: '' },
    tags: {
      type: 'array',
      items: { type: 'string', default: '' },
      default: [],
    },
  },
  additionalProperties: false,
};

export const complexSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', default: '' },
    name: { type: 'string', default: '' },
    price: { type: 'number', default: 0 },
    quantity: { type: 'number', default: 0 },
    total: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'price * quantity' },
    },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          sku: { type: 'string', default: '' },
          name: { type: 'string', default: '' },
          price: { type: 'number', default: 0 },
        },
        additionalProperties: false,
      },
      default: [],
    },
  },
  additionalProperties: false,
};

export const withValidationSchema = {
  type: 'object',
  properties: {
    username: {
      type: 'string',
      default: '',
      minLength: 3,
      maxLength: 20,
    },
    email: {
      type: 'string',
      default: '',
      pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    },
    age: {
      type: 'number',
      default: 0,
      minimum: 0,
      maximum: 150,
    },
  },
  additionalProperties: false,
};

// Root type schemas
export const rootStringSchema = {
  type: 'string',
  default: '',
};

export const rootNumberSchema = {
  type: 'number',
  default: 0,
};

export const rootBooleanSchema = {
  type: 'boolean',
  default: false,
};

export const rootArrayOfStringsSchema = {
  type: 'array',
  items: { type: 'string', default: '' },
  default: [],
};

export const rootArrayOfNumbersSchema = {
  type: 'array',
  items: { type: 'number', default: 0 },
  default: [],
};

export const rootArrayOfObjectsSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      id: { type: 'number', default: 0 },
      name: { type: 'string', default: '' },
      active: { type: 'boolean', default: true },
    },
    additionalProperties: false,
  },
  default: [],
};

export const longTextSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', default: '' },
    description: { type: 'string', default: '' },
    content: { type: 'string', default: '' },
  },
  additionalProperties: false,
};
