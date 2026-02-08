import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from '../shared';
import {
  comparisonOperatorsSchema,
  logicalOperatorsSchema,
  stringBooleanFunctionsSchema,
  isnullFunctionSchema,
} from './boolean.schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Formulas/Boolean',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const ComparisonOperators: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={comparisonOperatorsSchema}
      initialValue={{
        a: 10,
        b: 5,
        isEqual: false,
        isNotEqual: false,
        isGreater: false,
        isLess: false,
        isGreaterOrEqual: false,
        isLessOrEqual: false,
      }}
      hint="Comparison operators: ==, !=, >, <, >=, <=. Change a and b to test."
    />
  ),
};

export const LogicalOperators: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={logicalOperatorsSchema}
      initialValue={{
        isActive: true,
        hasPermission: false,
        andResult: false,
        orResult: false,
        notActive: false,
        andFunction: false,
        orFunction: false,
        notFunction: false,
      }}
      hint="Logical operators: &&, ||, ! and functions: and(), or(), not(). Toggle isActive and hasPermission."
    />
  ),
};

export const StringBooleanFunctions: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={stringBooleanFunctionsSchema}
      initialValue={{
        text: 'Hello World',
        search: 'llo',
        containsSearch: false,
        startsWithHello: false,
        endsWithWorld: false,
      }}
      hint="String boolean functions: contains(), startswith(), endswith(). Change text and search."
    />
  ),
};

export const IsNullFunction: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={isnullFunctionSchema}
      initialValue={{
        value: '',
        isEmpty: false,
      }}
      hint="Check if string is empty using length(value) == 0. Enter text to see change."
    />
  ),
};
