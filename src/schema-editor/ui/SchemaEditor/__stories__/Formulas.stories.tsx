import type { Meta, StoryObj } from '@storybook/react';
import { StoryWrapper, baseMeta } from './shared';
import {
  simpleFormulaSchema,
  formulaChainSchema,
  formulaInNestedSchema,
  formulaInArraySchema,
  formulaWithErrorSchema,
} from './schemas';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'SchemaEditor/Formulas',
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const SimpleFormula: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      mode="updating"
      tableId="orders"
      hint="Simple formula: total = price * quantity. Try renaming 'price' field."
    />
  ),
};

export const FormulaChain: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={formulaChainSchema}
      mode="updating"
      tableId="invoices"
      hint="Formula dependency chain: subtotal → discountAmount → total. Rename 'price' to see cascading updates."
    />
  ),
};

export const FormulaInNestedObject: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={formulaInNestedSchema}
      mode="updating"
      tableId="nested-orders"
      hint="Formula inside nested object: order.total = order.price * order.quantity."
    />
  ),
};

export const FormulaInArrayItems: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={formulaInArraySchema}
      mode="updating"
      tableId="cart"
      hint="Formula inside array items: items[*].total = items[*].price * items[*].quantity."
    />
  ),
};

export const FormulaWithError: Story = {
  render: (args) => (
    <StoryWrapper
      {...args}
      initialSchema={formulaWithErrorSchema}
      mode="updating"
      tableId="broken"
      hint="Formula references non-existent field 'unknownField'. Should show error."
    />
  ),
};
