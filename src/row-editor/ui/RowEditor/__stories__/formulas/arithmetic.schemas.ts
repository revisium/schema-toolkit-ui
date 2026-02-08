// Basic arithmetic operators: +, -, *, /, %
export const arithmeticOperatorsSchema = {
  type: 'object',
  properties: {
    a: { type: 'number', default: 10 },
    b: { type: 'number', default: 3 },
    sum: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a + b' },
    },
    difference: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a - b' },
    },
    product: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a * b' },
    },
    quotient: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a / b' },
    },
    modulo: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'a % b' },
    },
  },
  additionalProperties: false,
};

// Unary minus and parentheses
export const unaryAndParenthesesSchema = {
  type: 'object',
  properties: {
    value: { type: 'number', default: 5 },
    negated: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: '-value' },
    },
    complex: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: '(value + 3) * 2' },
    },
    doubleNegative: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'value + -3' },
    },
  },
  additionalProperties: false,
};

// Chained formulas: A -> B -> C -> D
export const chainedFormulasSchema = {
  type: 'object',
  properties: {
    input: { type: 'number', default: 5 },
    step1: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'input * 2' },
    },
    step2: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'step1 + 10' },
    },
    step3: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'step2 * 3' },
    },
    final: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'step3 / 2' },
    },
  },
  additionalProperties: false,
};
