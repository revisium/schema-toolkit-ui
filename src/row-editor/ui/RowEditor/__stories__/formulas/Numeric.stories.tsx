import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from '../shared';
import {
  roundingFunctionsSchema,
  roundDecimalsSchema,
  mathFunctionsSchema,
  minMaxFunctionsSchema,
  logFunctionsSchema,
  lengthFunctionSchema,
} from './numeric.schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Formulas/Numeric',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const RoundingFunctions: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={roundingFunctionsSchema}
      initialValue={{
        value: 3.7,
        rounded: 0,
        floored: 0,
        ceiled: 0,
      }}
      hint="round(), floor(), ceil() functions. Try values like 3.2, 3.5, 3.7."
    />
  ),
};

export const RoundWithDecimals: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={roundDecimalsSchema}
      initialValue={{
        value: 3.14159,
        decimals: 2,
        rounded: 0,
      }}
      hint="round(value, decimals). round(3.14159, 2) = 3.14. Change decimals to see effect."
    />
  ),
};

export const MathFunctions: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={mathFunctionsSchema}
      initialValue={{
        value: -16,
        absolute: 0,
        squareRoot: 0,
        squared: 0,
        sign: 0,
      }}
      hint="abs(), sqrt(), pow(), sign() functions. abs(-16)=16, sqrt(16)=4, pow(16,2)=256, sign(-16)=-1."
    />
  ),
};

export const MinMaxFunctions: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={minMaxFunctionsSchema}
      initialValue={{
        a: 10,
        b: 25,
        c: 5,
        minimum: 0,
        maximum: 0,
        clamped: 0,
      }}
      hint="min(), max() functions. clamped = clamp(a, 0, 20) = max(min(a, 20), 0)."
    />
  ),
};

export const LogFunctions: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={logFunctionsSchema}
      initialValue={{
        value: 100,
        naturalLog: 0,
        log10: 0,
        expValue: 0,
      }}
      hint="log() (natural), log10(), exp() functions. log10(100) = 2, exp(1) ≈ 2.7183."
    />
  ),
};

export const LengthFunction: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={lengthFunctionSchema}
      initialValue={{
        text: 'Hello',
        length: 0,
      }}
      hint="length() function. Returns string length. 'Hello' → 5."
    />
  ),
};
