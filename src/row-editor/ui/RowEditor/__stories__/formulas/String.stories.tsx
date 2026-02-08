import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from '../shared';
import {
  stringFunctionsSchema,
  stringManipulationSchema,
  stringConcatSchema,
} from './string.schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Formulas/String',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const StringFunctions: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={stringFunctionsSchema}
      initialValue={{
        firstName: 'John',
        lastName: 'Doe',
        fullName: '',
        upperName: '',
        lowerName: '',
      }}
      hint="concat(), upper(), lower() functions. fullName joins names, upperName/lowerName change case."
    />
  ),
};

export const StringManipulation: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={stringManipulationSchema}
      initialValue={{
        text: '  Hello World  ',
        trimmed: '',
        leftThree: '',
        rightThree: '',
        replaced: '',
      }}
      hint="trim(), left(), right(), replace() functions. Note leading/trailing spaces in input."
    />
  ),
};

export const StringConcat: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={stringConcatSchema}
      initialValue={{
        price: 99.99,
        currency: 'USD',
        formatted: '',
      }}
      hint="concat() with numbers: 'Price: ' + price + ' ' + currency."
    />
  ),
};
