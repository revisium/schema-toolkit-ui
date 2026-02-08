// Ternary operator: condition ? then : else
export const ternaryOperatorSchema = {
  type: 'object',
  properties: {
    score: { type: 'number', default: 75 },
    passingScore: { type: 'number', default: 60 },
    result: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'score >= passingScore ? "Pass" : "Fail"',
      },
    },
    grade: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': {
        version: 1,
        expression:
          'score >= 90 ? "A" : (score >= 80 ? "B" : (score >= 70 ? "C" : (score >= 60 ? "D" : "F")))',
      },
    },
  },
  additionalProperties: false,
};

// if() function
export const ifFunctionSchema = {
  type: 'object',
  properties: {
    stock: { type: 'number', default: 10 },
    status: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'if(stock > 0, "In Stock", "Out of Stock")',
      },
    },
    price: { type: 'number', default: 150 },
    discountedPrice: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'if(price > 100, price * 0.9, price)',
      },
    },
  },
  additionalProperties: false,
};

// coalesce() function - first non-null value
export const coalesceFunctionSchema = {
  type: 'object',
  properties: {
    nickname: { type: 'string', default: '' },
    name: { type: 'string', default: 'John' },
    displayName: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': {
        version: 1,
        expression:
          'length(nickname) > 0 ? nickname : (length(name) > 0 ? name : "Anonymous")',
      },
    },
  },
  additionalProperties: false,
};

// Complex conditional with price tiers
export const priceTiersSchema = {
  type: 'object',
  properties: {
    basePrice: { type: 'number', default: 100 },
    quantity: { type: 'number', default: 5 },
    discount: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression:
          'quantity >= 100 ? 0.20 : (quantity >= 50 ? 0.15 : (quantity >= 10 ? 0.10 : 0))',
      },
    },
    discountPercent: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'concat(round(discount * 100), "%")',
      },
    },
    finalPrice: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'round(basePrice * quantity * (1 - discount), 2)',
      },
    },
  },
  additionalProperties: false,
};
