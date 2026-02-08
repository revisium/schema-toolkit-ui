import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from '../shared';
import {
  nestedPathSchema,
  absolutePathSchema,
  relativePathSchema,
  deepRelativePathSchema,
  nestedObjectFormulaSchema,
  arrayIndexSchema,
} from './paths.schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/Formulas/Paths',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const NestedPath: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={nestedPathSchema}
      initialValue={{
        user: {
          profile: {
            firstName: 'John',
            lastName: 'Doe',
          },
        },
        fullName: '',
      }}
      hint="Nested object path: user.profile.firstName, user.profile.lastName. Change names."
    />
  ),
};

export const AbsolutePath: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={absolutePathSchema}
      initialValue={{
        taxRate: 0.1,
        items: [
          { name: 'Item A', price: 100, priceWithTax: 0 },
          { name: 'Item B', price: 200, priceWithTax: 0 },
        ],
      }}
      hint="Absolute path: /taxRate refers to root from inside array. Change taxRate to update all items."
    />
  ),
};

export const RelativePath: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={relativePathSchema}
      initialValue={{
        discount: 0.2,
        items: [
          { name: 'Product 1', price: 100, discountedPrice: 0 },
          { name: 'Product 2', price: 50, discountedPrice: 0 },
        ],
      }}
      hint="Relative path: ../discount goes up one level from array item. Change discount."
    />
  ),
};

export const DeepRelativePath: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={deepRelativePathSchema}
      initialValue={{
        config: {
          currency: 'USD',
        },
        categories: [
          {
            name: 'Electronics',
            products: [
              { name: 'Phone', price: 500, formatted: '' },
              { name: 'Laptop', price: 1200, formatted: '' },
            ],
          },
        ],
      }}
      hint="Deep path: /config.currency from nested array. Change currency to USD/EUR/GBP."
    />
  ),
};

export const NestedObjectFormula: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={nestedObjectFormulaSchema}
      initialValue={{
        item: { price: 50, quantity: 4 },
        total: 0,
      }}
      hint="Formula referencing nested object: total = item.price * item.quantity."
    />
  ),
};

export const ArrayIndexAccess: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arrayIndexSchema}
      initialValue={{
        items: [{ value: 10 }, { value: 20 }, { value: 30 }],
        firstItem: 0,
        lastItem: 0,
        sumFirstTwo: 0,
      }}
      hint="Array index access: items[0] (first), items[-1] (last), items[0]+items[1]. Add/remove items."
    />
  ),
};
