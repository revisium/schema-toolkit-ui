import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from '../shared';
import {
  arithmeticOperatorsSchema,
  unaryAndParenthesesSchema,
  chainedFormulasSchema,
} from './arithmetic.schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Formulas/Arithmetic',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const ArithmeticOperators: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arithmeticOperatorsSchema}
      initialValue={{
        a: 10,
        b: 3,
        sum: 0,
        difference: 0,
        product: 0,
        quotient: 0,
        modulo: 0,
      }}
      hint="Arithmetic operators: +, -, *, /, %. Change a and b values to see all operations."
    />
  ),
};

export const UnaryAndParentheses: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={unaryAndParenthesesSchema}
      initialValue={{
        value: 5,
        negated: 0,
        complex: 0,
        doubleNegative: 0,
      }}
      hint="Unary minus (-value) and parentheses ((value + 3) * 2). Also value + -3."
    />
  ),
};

export const ChainedFormulas: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={chainedFormulasSchema}
      initialValue={{
        input: 5,
        step1: 0,
        step2: 0,
        step3: 0,
        final: 0,
      }}
      hint="Chained formulas: input(5) → step1(*2=10) → step2(+10=20) → step3(*3=60) → final(/2=30)"
    />
  ),
};
