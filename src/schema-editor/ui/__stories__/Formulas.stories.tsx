import type { Meta, StoryObj } from '@storybook/react';
import { UpdatingStoryWrapper, updatingBaseMeta } from './shared';
import {
  simpleFormulaSchema,
  formulaChainSchema,
  formulaInNestedSchema,
  formulaInArraySchema,
  formulaWithErrorSchema,
} from './schemas';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'SchemaEditor/Formulas',
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

export const SimpleFormula: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="Simple formula: total = price * quantity. Formula fields show fx icon."
    />
  ),
};

export const FormulaChain: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={formulaChainSchema}
      tableId="invoice"
      hint="Formula chain: subtotal -> discountAmount -> total. Dependencies tracked automatically."
    />
  ),
};

export const FormulaInNested: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={formulaInNestedSchema}
      tableId="orders"
      hint="Formula inside nested object: order.total = order.price * order.quantity."
    />
  ),
};

export const FormulaInArray: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={formulaInArraySchema}
      tableId="cart"
      hint="Formula inside array items: items[*].total = items[*].price * items[*].quantity."
    />
  ),
};

export const FormulaWithError: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={formulaWithErrorSchema}
      tableId="data"
      hint="Formula with error: references unknown field. Click 'Review Errors' to see formula errors."
    />
  ),
};
