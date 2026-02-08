// String functions: concat, upper, lower, trim, left, right, replace
export const stringFunctionsSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', default: 'John' },
    lastName: { type: 'string', default: 'Doe' },
    fullName: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'concat(firstName, " ", lastName)',
      },
    },
    upperName: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': { version: 1, expression: 'upper(firstName)' },
    },
    lowerName: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': { version: 1, expression: 'lower(lastName)' },
    },
  },
  additionalProperties: false,
};

// String manipulation: trim, left, right, replace
export const stringManipulationSchema = {
  type: 'object',
  properties: {
    text: { type: 'string', default: '  Hello World  ' },
    trimmed: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': { version: 1, expression: 'trim(text)' },
    },
    leftThree: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': { version: 1, expression: 'left(trim(text), 3)' },
    },
    rightThree: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': { version: 1, expression: 'right(trim(text), 3)' },
    },
    replaced: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': { version: 1, expression: 'replace(trim(text), "o", "0")' },
    },
  },
  additionalProperties: false,
};

// String + number concatenation
export const stringConcatSchema = {
  type: 'object',
  properties: {
    price: { type: 'number', default: 99.99 },
    currency: { type: 'string', default: 'USD' },
    formatted: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'concat("Price: ", price, " ", currency)',
      },
    },
  },
  additionalProperties: false,
};
