// Comparison operators: ==, !=, >, <, >=, <=
export const comparisonOperatorsSchema = {
  type: 'object',
  properties: {
    a: { type: 'number', default: 10 },
    b: { type: 'number', default: 5 },
    isEqual: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a == b' },
    },
    isNotEqual: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a != b' },
    },
    isGreater: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a > b' },
    },
    isLess: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a < b' },
    },
    isGreaterOrEqual: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a >= b' },
    },
    isLessOrEqual: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a <= b' },
    },
  },
  additionalProperties: false,
};

// Logical operators: &&, ||, !, and(), or(), not()
export const logicalOperatorsSchema = {
  type: 'object',
  properties: {
    isActive: { type: 'boolean', default: true },
    hasPermission: { type: 'boolean', default: false },
    andResult: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'isActive && hasPermission' },
    },
    orResult: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'isActive || hasPermission' },
    },
    notActive: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: '!isActive' },
    },
    andFunction: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'and(isActive, hasPermission)' },
    },
    orFunction: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'or(isActive, hasPermission)' },
    },
    notFunction: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'not(isActive)' },
    },
  },
  additionalProperties: false,
};

// String boolean functions: contains, startswith, endswith
export const stringBooleanFunctionsSchema = {
  type: 'object',
  properties: {
    text: { type: 'string', default: 'Hello World' },
    search: { type: 'string', default: 'llo' },
    containsSearch: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'contains(text, search)' },
    },
    startsWithHello: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'startswith(text, "Hello")' },
    },
    endsWithWorld: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'endswith(text, "World")' },
    },
  },
  additionalProperties: false,
};

// isnull function
export const isnullFunctionSchema = {
  type: 'object',
  properties: {
    value: { type: 'string', default: '' },
    isEmpty: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'length(value) == 0' },
    },
  },
  additionalProperties: false,
};
