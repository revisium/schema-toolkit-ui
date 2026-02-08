// Nested object path: object.property.subproperty
export const nestedPathSchema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        profile: {
          type: 'object',
          properties: {
            firstName: { type: 'string', default: 'John' },
            lastName: { type: 'string', default: 'Doe' },
          },
          additionalProperties: false,
        },
      },
      additionalProperties: false,
    },
    fullName: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': {
        version: 1,
        expression:
          'concat(user.profile.firstName, " ", user.profile.lastName)',
      },
    },
  },
  additionalProperties: false,
};

// Absolute path from root: /field (useful in array item formulas)
export const absolutePathSchema = {
  type: 'object',
  properties: {
    taxRate: { type: 'number', default: 0.1 },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          price: { type: 'number', default: 0 },
          priceWithTax: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': {
              version: 1,
              expression: 'round(price * (1 + /taxRate), 2)',
            },
          },
        },
        additionalProperties: false,
      },
      default: [],
    },
  },
  additionalProperties: false,
};

// Relative path: ../field (go up one level)
export const relativePathSchema = {
  type: 'object',
  properties: {
    discount: { type: 'number', default: 0.2 },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          price: { type: 'number', default: 0 },
          discountedPrice: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': {
              version: 1,
              expression: 'round(price * (1 - ../discount), 2)',
            },
          },
        },
        additionalProperties: false,
      },
      default: [],
    },
  },
  additionalProperties: false,
};

// Nested relative path: ../../field (go up two levels)
export const deepRelativePathSchema = {
  type: 'object',
  properties: {
    config: {
      type: 'object',
      properties: {
        currency: { type: 'string', default: 'USD' },
      },
      additionalProperties: false,
    },
    categories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', default: '' },
                price: { type: 'number', default: 0 },
                formatted: {
                  type: 'string',
                  default: '',
                  readOnly: true,
                  'x-formula': {
                    version: 1,
                    expression: 'concat(price, " ", /config.currency)',
                  },
                },
              },
              additionalProperties: false,
            },
            default: [],
          },
        },
        additionalProperties: false,
      },
      default: [],
    },
  },
  additionalProperties: false,
};

// Array index access: items[0], items[-1], items[1]
export const arrayIndexSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'number', default: 0 },
        },
        additionalProperties: false,
      },
      default: [],
    },
    firstItem: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'count(items) > 0 ? items[0].value : 0',
      },
    },
    lastItem: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'count(items) > 0 ? items[-1].value : 0',
      },
    },
    sumFirstTwo: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression:
          '(count(items) > 0 ? items[0].value : 0) + (count(items) > 1 ? items[1].value : 0)',
      },
    },
  },
  additionalProperties: false,
};

// Formula referencing sibling field in nested object
export const nestedObjectFormulaSchema = {
  type: 'object',
  properties: {
    item: {
      type: 'object',
      properties: {
        price: { type: 'number', default: 50 },
        quantity: { type: 'number', default: 4 },
      },
      additionalProperties: false,
    },
    total: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'item.price * item.quantity' },
    },
  },
  additionalProperties: false,
};
