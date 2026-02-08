// Array aggregate functions: sum, avg, count
export const arrayAggregateFunctionsSchema = {
  type: 'object',
  properties: {
    values: {
      type: 'array',
      items: { type: 'number', default: 0 },
      default: [],
    },
    total: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'sum(values)' },
    },
    average: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'count(values) > 0 ? round(avg(values), 2) : 0',
      },
    },
    itemCount: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'count(values)' },
    },
  },
  additionalProperties: false,
};

// Array access functions: first, last
export const arrayAccessFunctionsSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          value: { type: 'number', default: 0 },
        },
        additionalProperties: false,
      },
      default: [],
    },
    firstValue: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'count(items) > 0 ? first(items).value : 0',
      },
    },
    lastValue: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'count(items) > 0 ? last(items).value : 0',
      },
    },
  },
  additionalProperties: false,
};

// Array index access: items[0], items[-1]
export const arrayIndexAccessSchema = {
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
    secondItem: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'count(items) > 1 ? items[1].value : 0',
      },
    },
    secondToLast: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'count(items) > 1 ? items[-2].value : 0',
      },
    },
  },
  additionalProperties: false,
};

// includes function
export const includesFunctionSchema = {
  type: 'object',
  properties: {
    tags: {
      type: 'array',
      items: { type: 'string', default: '' },
      default: [],
    },
    searchTag: { type: 'string', default: 'featured' },
    hasTag: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'includes(tags, searchTag)' },
    },
  },
  additionalProperties: false,
};

// join function
export const joinFunctionSchema = {
  type: 'object',
  properties: {
    tags: {
      type: 'array',
      items: { type: 'string', default: '' },
      default: [],
    },
    joinedComma: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': { version: 1, expression: 'join(tags)' },
    },
    joinedPipe: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': { version: 1, expression: 'join(tags, " | ")' },
    },
  },
  additionalProperties: false,
};

// Formulas inside array items
export const arrayItemFormulasSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          price: { type: 'number', default: 0 },
          quantity: { type: 'number', default: 1 },
          subtotal: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': { version: 1, expression: 'price * quantity' },
          },
        },
        additionalProperties: false,
      },
      default: [],
    },
    grandTotal: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression:
          'count(items) > 0 ? items[0].subtotal + (count(items) > 1 ? items[1].subtotal : 0) + (count(items) > 2 ? items[2].subtotal : 0) : 0',
      },
    },
  },
  additionalProperties: false,
};

// Wildcard property access: sum(items[*].price)
export const wildcardPropertyAccessSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          price: { type: 'number', default: 0 },
          quantity: { type: 'number', default: 1 },
        },
        additionalProperties: false,
      },
      default: [],
    },
    totalPrice: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'sum(items[*].price)' },
    },
    totalQuantity: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'sum(items[*].quantity)' },
    },
    averagePrice: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'count(items) > 0 ? round(avg(items[*].price), 2) : 0',
      },
    },
  },
  additionalProperties: false,
};

// Nested wildcard: sum(orders[*].items[*].amount)
export const nestedWildcardSchema = {
  type: 'object',
  properties: {
    orders: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          orderName: { type: 'string', default: '' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                productName: { type: 'string', default: '' },
                amount: { type: 'number', default: 0 },
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
    grandTotal: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'sum(orders[*].items[*].amount)' },
    },
    itemCount: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'count(orders[*].items[*])',
      },
    },
  },
  additionalProperties: false,
};

// Deeply nested wildcard: sum(data[*].nested.values[*].score)
export const deeplyNestedWildcardSchema = {
  type: 'object',
  properties: {
    data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: { type: 'string', default: '' },
          nested: {
            type: 'object',
            properties: {
              description: { type: 'string', default: '' },
              values: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string', default: '' },
                    score: { type: 'number', default: 0 },
                  },
                  additionalProperties: false,
                },
                default: [],
              },
            },
            additionalProperties: false,
          },
        },
        additionalProperties: false,
      },
      default: [],
    },
    totalScore: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'sum(data[*].nested.values[*].score)',
      },
    },
    averageScore: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression:
          'count(data[*].nested.values[*]) > 0 ? round(avg(data[*].nested.values[*].score), 2) : 0',
      },
    },
  },
  additionalProperties: false,
};
