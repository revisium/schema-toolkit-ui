import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from '../shared';
import {
  arrayAggregateFunctionsSchema,
  arrayAccessFunctionsSchema,
  arrayIndexAccessSchema,
  includesFunctionSchema,
  joinFunctionSchema,
  arrayItemFormulasSchema,
  wildcardPropertyAccessSchema,
  nestedWildcardSchema,
  deeplyNestedWildcardSchema,
} from './array.schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Formulas/Array',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const AggregateFunctions: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arrayAggregateFunctionsSchema}
      initialValue={{
        values: [10, 20, 30, 40],
        total: 0,
        average: 0,
        itemCount: 0,
      }}
      hint="Aggregate functions: sum(), avg(), count(). Add/remove/change values to see updates."
    />
  ),
};

export const AccessFunctions: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arrayAccessFunctionsSchema}
      initialValue={{
        items: [
          { name: 'First', value: 100 },
          { name: 'Second', value: 200 },
          { name: 'Third', value: 300 },
        ],
        firstValue: 0,
        lastValue: 0,
      }}
      hint="Access functions: first(), last(). first(items).value, last(items).value."
    />
  ),
};

export const IndexAccess: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arrayIndexAccessSchema}
      initialValue={{
        items: [{ value: 10 }, { value: 20 }, { value: 30 }, { value: 40 }],
        firstItem: 0,
        lastItem: 0,
        secondItem: 0,
        secondToLast: 0,
      }}
      hint="Index access: items[0], items[1], items[-1] (last), items[-2] (second to last). Add/remove items."
    />
  ),
};

export const IncludesFunction: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={includesFunctionSchema}
      initialValue={{
        tags: ['premium', 'featured', 'sale'],
        searchTag: 'featured',
        hasTag: false,
      }}
      hint="includes() function. Check if array contains a value. Change searchTag."
    />
  ),
};

export const JoinFunction: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={joinFunctionSchema}
      initialValue={{
        tags: ['apple', 'banana', 'cherry'],
        joinedComma: '',
        joinedPipe: '',
      }}
      hint="join() function. join(tags) with default comma, join(tags, ' | ') with custom separator."
    />
  ),
};

export const FormulasInArrayItems: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arrayItemFormulasSchema}
      initialValue={{
        items: [
          { name: 'Widget', price: 10, quantity: 3, subtotal: 0 },
          { name: 'Gadget', price: 25, quantity: 2, subtotal: 0 },
        ],
        grandTotal: 0,
      }}
      hint="Each array item has subtotal = price * quantity formula. grandTotal sums first 3 items."
    />
  ),
};

export const WildcardPropertyAccess: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={wildcardPropertyAccessSchema}
      initialValue={{
        items: [
          { name: 'Widget', price: 10, quantity: 3 },
          { name: 'Gadget', price: 25, quantity: 2 },
          { name: 'Gizmo', price: 15, quantity: 4 },
        ],
        totalPrice: 0,
        totalQuantity: 0,
        averagePrice: 0,
      }}
      hint="Wildcard property access: sum(items[*].price), sum(items[*].quantity), avg(items[*].price). Add/edit items."
    />
  ),
};

export const NestedWildcard: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={nestedWildcardSchema}
      initialValue={{
        orders: [
          {
            orderName: 'Order A',
            items: [
              { productName: 'Widget', amount: 100 },
              { productName: 'Gadget', amount: 200 },
            ],
          },
          {
            orderName: 'Order B',
            items: [{ productName: 'Gizmo', amount: 150 }],
          },
        ],
        grandTotal: 0,
        itemCount: 0,
      }}
      hint="Nested wildcard: sum(orders[*].items[*].amount) flattens and sums all nested amounts."
    />
  ),
};

export const DeeplyNestedWildcard: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={deeplyNestedWildcardSchema}
      initialValue={{
        data: [
          {
            category: 'A',
            nested: {
              description: 'Category A',
              values: [
                { label: 'A1', score: 10 },
                { label: 'A2', score: 20 },
              ],
            },
          },
          {
            category: 'B',
            nested: {
              description: 'Category B',
              values: [{ label: 'B1', score: 30 }],
            },
          },
        ],
        totalScore: 0,
        averageScore: 0,
      }}
      hint="Deeply nested: sum(data[*].nested.values[*].score). Accesses deeply nested array values."
    />
  ),
};
