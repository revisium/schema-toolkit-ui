import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from '../shared';
import {
  ternaryOperatorSchema,
  ifFunctionSchema,
  coalesceFunctionSchema,
  priceTiersSchema,
} from './conditional.schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Formulas/Conditional',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const TernaryOperator: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={ternaryOperatorSchema}
      initialValue={{
        score: 75,
        passingScore: 60,
        result: '',
        grade: '',
      }}
      hint="Ternary operator: condition ? then : else. Nested for grade: A/B/C/D/F based on score."
    />
  ),
};

export const IfFunction: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={ifFunctionSchema}
      initialValue={{
        stock: 10,
        status: '',
        price: 150,
        discountedPrice: 0,
      }}
      hint="if() function: if(condition, thenValue, elseValue). stock > 0 for status, price > 100 for discount."
    />
  ),
};

export const CoalescePattern: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={coalesceFunctionSchema}
      initialValue={{
        nickname: '',
        name: 'John',
        displayName: '',
      }}
      hint="Coalesce pattern: use nickname if not empty, else name, else 'Anonymous'. Clear both fields."
    />
  ),
};

export const PriceTiers: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={priceTiersSchema}
      initialValue={{
        basePrice: 100,
        quantity: 5,
        discount: 0,
        discountPercent: '',
        finalPrice: 0,
      }}
      hint="Tiered pricing: qty >= 100 → 20%, qty >= 50 → 15%, qty >= 10 → 10%. Change quantity to see."
    />
  ),
};
