import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import { complexSchema, withValidationSchema } from './schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Complex',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const OrderWithItems: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={complexSchema}
      initialValue={{
        id: 'ORD-001',
        name: 'Sample Order',
        price: 100,
        quantity: 5,
        total: 0,
        items: [
          { sku: 'SKU-001', name: 'Widget', price: 10 },
          { sku: 'SKU-002', name: 'Gadget', price: 20 },
        ],
      }}
      hint="Complex form with nested array of objects and computed total field."
    />
  ),
};

export const EmptyOrder: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={complexSchema}
      hint="Empty order form. Total is computed from price * quantity."
    />
  ),
};

export const WithValidation: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={withValidationSchema}
      initialValue={{
        username: 'ab',
        email: 'invalid-email',
        age: 200,
      }}
      hint="Form with validation constraints. Check error indicators."
    />
  ),
};

export const DeeplyNested: Story = {
  render: (args) => {
    const deepSchema = {
      type: 'object' as const,
      properties: {
        level1: {
          type: 'object' as const,
          properties: {
            level2: {
              type: 'object' as const,
              properties: {
                level3: {
                  type: 'object' as const,
                  properties: {
                    value: { type: 'string' as const, default: '' },
                  },
                  additionalProperties: false,
                  required: ['value'],
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

    return (
      <StoryWrapper
        {...args}
        schema={deepSchema}
        initialValue={{
          level1: {
            level2: {
              level3: {
                value: 'Deep value',
              },
            },
          },
        }}
        hint="Deeply nested structure (4 levels). Click arrows to navigate."
      />
    );
  },
};

export const LargeArray: Story = {
  render: (args) => {
    const schema = {
      type: 'object' as const,
      properties: {
        items: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              id: { type: 'number' as const, default: 0 },
              name: { type: 'string' as const, default: '' },
            },
            additionalProperties: false,
            required: ['id', 'name'],
          },
          default: [],
        },
      },
      additionalProperties: false,
      required: ['items'],
    };

    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
    }));

    return (
      <StoryWrapper
        {...args}
        schema={schema}
        initialValue={{ items }}
        hint="Array with 20 items. Test collapse/expand performance."
      />
    );
  },
};
