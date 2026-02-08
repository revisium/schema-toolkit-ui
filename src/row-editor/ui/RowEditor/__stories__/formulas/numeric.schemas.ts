// Rounding functions: round, floor, ceil
export const roundingFunctionsSchema = {
  type: 'object',
  properties: {
    value: { type: 'number', default: 3.7 },
    rounded: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'round(value)' },
    },
    floored: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'floor(value)' },
    },
    ceiled: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'ceil(value)' },
    },
  },
  additionalProperties: false,
};

// Round with decimals
export const roundDecimalsSchema = {
  type: 'object',
  properties: {
    value: { type: 'number', default: 3.14159 },
    decimals: { type: 'number', default: 2 },
    rounded: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'round(value, decimals)' },
    },
  },
  additionalProperties: false,
};

// Math functions: abs, sqrt, pow, log, exp, sign
export const mathFunctionsSchema = {
  type: 'object',
  properties: {
    value: { type: 'number', default: -16 },
    absolute: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'abs(value)' },
    },
    squareRoot: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'sqrt(abs(value))' },
    },
    squared: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'pow(abs(value), 2)' },
    },
    sign: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'sign(value)' },
    },
  },
  additionalProperties: false,
};

// Min/Max functions
export const minMaxFunctionsSchema = {
  type: 'object',
  properties: {
    a: { type: 'number', default: 10 },
    b: { type: 'number', default: 25 },
    c: { type: 'number', default: 5 },
    minimum: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'min(a, b, c)' },
    },
    maximum: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'max(a, b, c)' },
    },
    clamped: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'max(min(a, 20), 0)' },
    },
  },
  additionalProperties: false,
};

// Logarithm functions: log, log10, exp
export const logFunctionsSchema = {
  type: 'object',
  properties: {
    value: { type: 'number', default: 100 },
    naturalLog: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'round(log(value), 4)' },
    },
    log10: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'log10(value)' },
    },
    expValue: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'round(exp(1), 4)' },
    },
  },
  additionalProperties: false,
};

// Length function for strings
export const lengthFunctionSchema = {
  type: 'object',
  properties: {
    text: { type: 'string', default: 'Hello' },
    length: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'length(text)' },
    },
  },
  additionalProperties: false,
};
