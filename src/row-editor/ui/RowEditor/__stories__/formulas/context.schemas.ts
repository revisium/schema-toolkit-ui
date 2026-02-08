// #index - current array element index (0-based)
export const indexTokenSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          position: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': { version: 1, expression: '#index' },
          },
          position1Based: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': { version: 1, expression: '#index + 1' },
          },
        },
        additionalProperties: false,
      },
      default: [],
    },
  },
  additionalProperties: false,
};

// #length - total number of elements in current array
export const lengthTokenSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          totalCount: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': { version: 1, expression: '#length' },
          },
          isHalf: {
            type: 'boolean',
            default: false,
            readOnly: true,
            'x-formula': { version: 1, expression: '#index < #length / 2' },
          },
        },
        additionalProperties: false,
      },
      default: [],
    },
  },
  additionalProperties: false,
};

// #first - true if current element is first in array
export const firstTokenSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          isFirst: {
            type: 'boolean',
            default: false,
            readOnly: true,
            'x-formula': { version: 1, expression: '#first' },
          },
          prefix: {
            type: 'string',
            default: '',
            readOnly: true,
            'x-formula': { version: 1, expression: '#first ? ">> " : "   "' },
          },
        },
        additionalProperties: false,
      },
      default: [],
    },
  },
  additionalProperties: false,
};

// #last - true if current element is last in array
export const lastTokenSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          isLast: {
            type: 'boolean',
            default: false,
            readOnly: true,
            'x-formula': { version: 1, expression: '#last' },
          },
          suffix: {
            type: 'string',
            default: '',
            readOnly: true,
            'x-formula': { version: 1, expression: '#last ? " (end)" : ""' },
          },
        },
        additionalProperties: false,
      },
      default: [],
    },
  },
  additionalProperties: false,
};

// @prev - access previous element's fields
export const prevTokenSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'number', default: 0 },
          prevValue: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': {
              version: 1,
              expression: 'if(#first, 0, @prev.value)',
            },
          },
          delta: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': {
              version: 1,
              expression: 'if(#first, 0, value - @prev.value)',
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

// @next - access next element's fields
export const nextTokenSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          value: { type: 'number', default: 0 },
          nextValue: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': {
              version: 1,
              expression: 'if(#last, 0, @next.value)',
            },
          },
          isIncreasing: {
            type: 'boolean',
            default: false,
            readOnly: true,
            'x-formula': {
              version: 1,
              expression: 'if(#last, false, @next.value > value)',
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

// Running total using @prev
export const runningTotalSchema = {
  type: 'object',
  properties: {
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string', default: '' },
          amount: { type: 'number', default: 0 },
          balance: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': {
              version: 1,
              expression: '#first ? amount : @prev.balance + amount',
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

// #parent.index - access parent array's index in nested arrays
export const parentIndexSchema = {
  type: 'object',
  properties: {
    orders: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                product: { type: 'string', default: '' },
                orderIndex: {
                  type: 'number',
                  default: 0,
                  readOnly: true,
                  'x-formula': { version: 1, expression: '#parent.index' },
                },
                itemIndex: {
                  type: 'number',
                  default: 0,
                  readOnly: true,
                  'x-formula': { version: 1, expression: '#index' },
                },
                label: {
                  type: 'string',
                  default: '',
                  readOnly: true,
                  'x-formula': {
                    version: 1,
                    expression:
                      'concat("Order ", #parent.index + 1, " - Item ", #index + 1)',
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

// #parent.length - access parent array's length
export const parentLengthSchema = {
  type: 'object',
  properties: {
    groups: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          members: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', default: '' },
                totalGroups: {
                  type: 'number',
                  default: 0,
                  readOnly: true,
                  'x-formula': { version: 1, expression: '#parent.length' },
                },
                groupPosition: {
                  type: 'string',
                  default: '',
                  readOnly: true,
                  'x-formula': {
                    version: 1,
                    expression:
                      'concat("Group ", #parent.index + 1, " of ", #parent.length)',
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

// #root.index - access topmost array's index in deeply nested arrays
export const rootIndexSchema = {
  type: 'object',
  properties: {
    sections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string', default: '' },
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string', default: '' },
                answers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      text: { type: 'string', default: '' },
                      sectionIndex: {
                        type: 'number',
                        default: 0,
                        readOnly: true,
                        'x-formula': { version: 1, expression: '#root.index' },
                      },
                      questionIndex: {
                        type: 'number',
                        default: 0,
                        readOnly: true,
                        'x-formula': {
                          version: 1,
                          expression: '#parent.index',
                        },
                      },
                      answerIndex: {
                        type: 'number',
                        default: 0,
                        readOnly: true,
                        'x-formula': { version: 1, expression: '#index' },
                      },
                      fullNumber: {
                        type: 'string',
                        default: '',
                        readOnly: true,
                        'x-formula': {
                          version: 1,
                          expression:
                            'concat(#root.index + 1, ".", #parent.index + 1, ".", #index + 1)',
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
      },
      default: [],
    },
  },
  additionalProperties: false,
};

// #parent.parent.index - access grandparent array's index (3-level nesting)
export const grandparentIndexSchema = {
  type: 'object',
  properties: {
    buildings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: '' },
          floors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                level: { type: 'number', default: 1 },
                rooms: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string', default: '' },
                      buildingIndex: {
                        type: 'number',
                        default: 0,
                        readOnly: true,
                        'x-formula': {
                          version: 1,
                          expression: '#parent.parent.index',
                        },
                      },
                      floorIndex: {
                        type: 'number',
                        default: 0,
                        readOnly: true,
                        'x-formula': {
                          version: 1,
                          expression: '#parent.index',
                        },
                      },
                      roomIndex: {
                        type: 'number',
                        default: 0,
                        readOnly: true,
                        'x-formula': { version: 1, expression: '#index' },
                      },
                      fullCode: {
                        type: 'string',
                        default: '',
                        readOnly: true,
                        'x-formula': {
                          version: 1,
                          expression:
                            'concat("B", #parent.parent.index + 1, "-F", #parent.index + 1, "-R", #index + 1)',
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
      },
      default: [],
    },
  },
  additionalProperties: false,
};

// Combined: label generation with index
export const labelGenerationSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string', default: 'Item' },
          label: {
            type: 'string',
            default: '',
            readOnly: true,
            'x-formula': {
              version: 1,
              expression: 'concat(#index + 1, ". ", name)',
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

// Combined: weighted price by position
export const weightedByPositionSchema = {
  type: 'object',
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          price: { type: 'number', default: 10 },
          weightedPrice: {
            type: 'number',
            default: 0,
            readOnly: true,
            'x-formula': { version: 1, expression: 'price * (#index + 1)' },
          },
        },
        additionalProperties: false,
      },
      default: [],
    },
  },
  additionalProperties: false,
};
