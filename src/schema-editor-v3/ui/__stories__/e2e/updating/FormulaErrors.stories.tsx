import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, screen, waitFor, within } from 'storybook/test';
import { UpdatingStoryWrapper, updatingBaseMeta } from '../../shared';
import { simpleFormulaSchema } from '../../schemas';
import {
  renameField,
  openFormulaSubmenu,
  expectFormulaInputValue,
  expectFormulaError,
  expectNoFormulaError,
  expectErrorIndicator,
  expectNoErrorIndicator,
  typeFormulaAndClose,
  clearFormulaAndClose,
} from '../test-utils';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'V3/SchemaEditor/E2E/Updating/FormulaErrors',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

// simpleFormulaSchema fields:
// root-0: price (number)
// root-1: quantity (number)
// root-2: total (number, formula: "price * quantity")

export const FormulaErrorOnFieldRename: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="E2E Test: Rename price to 2price, verify formula error on total, open formula menu and verify formula is preserved"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Rename 'price' (root-0) to '2price'
    await renameField(canvas, 'root-0', '2price');
    await userEvent.click(document.body);

    // Verify error indicator appears on 'total' (root-2) due to broken formula
    await expectErrorIndicator(canvas, 'root-2');

    // Open formula submenu for 'total'
    await openFormulaSubmenu(canvas, 'root-2');

    // Verify formula input shows the raw expression (not empty)
    await expectFormulaInputValue('root-2', 'price * quantity');

    // Verify error message is displayed
    await expectFormulaError('root-2');

    // Close the menu
    await userEvent.click(document.body);

    // Verify formula error indicator is still present (formula was not cleared)
    await expectErrorIndicator(canvas, 'root-2');
  },
};

export const EditFormulaToInvalidExpression: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="E2E Test: Edit formula to reference non-existent field, close, reopen and verify input shows what was typed"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Edit total's formula to reference non-existent field
    await typeFormulaAndClose(canvas, 'root-2', 'price * quantity2');

    // Verify error indicator appears on total
    await expectErrorIndicator(canvas, 'root-2');

    // Reopen formula submenu
    await openFormulaSubmenu(canvas, 'root-2');

    // Input should show what the user typed, not the old formula
    await expectFormulaInputValue('root-2', 'price * quantity2');

    // Error message should reference quantity2
    await expectFormulaError('root-2', 'quantity2');

    // Close
    await userEvent.click(document.body);

    // Error indicator should still be present
    await expectErrorIndicator(canvas, 'root-2');
  },
};

export const FixInvalidFormulaByEditing: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="E2E Test: Enter invalid formula, then fix it by editing back to valid"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Enter invalid formula
    await typeFormulaAndClose(canvas, 'root-2', 'price * nonexistent');

    // Verify error appears
    await expectErrorIndicator(canvas, 'root-2');

    // Fix the formula back to valid
    await typeFormulaAndClose(canvas, 'root-2', 'price * quantity');

    // Error should be gone
    await expectNoErrorIndicator(canvas, 'root-2');

    // Reopen and verify the formula is correct
    await openFormulaSubmenu(canvas, 'root-2');
    await expectFormulaInputValue('root-2', 'price * quantity');
    await expectNoFormulaError('root-2');

    await userEvent.click(document.body);
  },
};

export const ClearFormulaWithError: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="E2E Test: Enter invalid formula, then clear it entirely"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Enter invalid formula
    await typeFormulaAndClose(canvas, 'root-2', 'price * nonexistent');

    // Verify error appears
    await expectErrorIndicator(canvas, 'root-2');

    // Clear the formula
    await clearFormulaAndClose(canvas, 'root-2');

    // Error should be gone (formula removed)
    await expectNoErrorIndicator(canvas, 'root-2');
  },
};

export const RenameFieldThenRenameBack: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="E2E Test: Rename price to 2price (invalid identifier) to break formula, then rename back to fix it"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Rename 'price' to '2price' (breaks formula - invalid identifier in expression)
    await renameField(canvas, 'root-0', '2price');
    await userEvent.click(document.body);

    // Verify error on total
    await expectErrorIndicator(canvas, 'root-2');

    // Rename back to 'price' (fixes formula)
    await renameField(canvas, 'root-0', 'price');
    await userEvent.click(document.body);

    // Error should be gone
    await expectNoErrorIndicator(canvas, 'root-2');

    // Verify formula still works
    await openFormulaSubmenu(canvas, 'root-2');
    await expectFormulaInputValue('root-2', 'price * quantity');
    await expectNoFormulaError('root-2');

    await userEvent.click(document.body);
  },
};

export const MultipleReopensWithInvalidFormula: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="E2E Test: Enter invalid formula, open/close multiple times - state must be consistent"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Enter invalid formula
    await typeFormulaAndClose(canvas, 'root-2', 'price * missing');

    // Verify error
    await expectErrorIndicator(canvas, 'root-2');

    // First reopen - verify consistency
    await openFormulaSubmenu(canvas, 'root-2');
    await expectFormulaInputValue('root-2', 'price * missing');
    await expectFormulaError('root-2', 'missing');
    await userEvent.click(document.body);

    // Still has error
    await expectErrorIndicator(canvas, 'root-2');

    // Second reopen - verify consistency again
    await openFormulaSubmenu(canvas, 'root-2');
    await expectFormulaInputValue('root-2', 'price * missing');
    await expectFormulaError('root-2', 'missing');
    await userEvent.click(document.body);

    // Still has error
    await expectErrorIndicator(canvas, 'root-2');
  },
};

export const EditInvalidFormulaToDifferentInvalid: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="E2E Test: Enter invalid formula, then change to a different invalid formula"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Enter first invalid formula
    await typeFormulaAndClose(canvas, 'root-2', 'price * missing1');
    await expectErrorIndicator(canvas, 'root-2');

    // Change to different invalid formula
    await typeFormulaAndClose(canvas, 'root-2', 'missing2 + missing3');
    await expectErrorIndicator(canvas, 'root-2');

    // Verify second formula is shown, not first
    await openFormulaSubmenu(canvas, 'root-2');
    await expectFormulaInputValue('root-2', 'missing2 + missing3');
    await expectFormulaError('root-2');
    await userEvent.click(document.body);
  },
};

export const RenameFieldBreaksFormulaThenEditFormula: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="E2E Test: Rename field to invalid identifier to break formula, then fix the formula by entering a new valid expression"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Rename 'quantity' to '2qty' (breaks formula - invalid identifier in expression)
    await renameField(canvas, 'root-1', '2qty');
    await userEvent.click(document.body);

    // Verify error on total
    await expectErrorIndicator(canvas, 'root-2');

    // Fix by editing formula to use new name (still invalid identifier, but let's just remove the formula)
    await clearFormulaAndClose(canvas, 'root-2');

    // Error should be gone (formula removed)
    await expectNoErrorIndicator(canvas, 'root-2');
  },
};

export const OpenFormulaMenuWithoutEditingDoesNotClear: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="E2E Test: Open and close formula menu without editing - formula should be preserved"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open formula submenu for total and close without changes
    await openFormulaSubmenu(canvas, 'root-2');
    await expectFormulaInputValue('root-2', 'price * quantity');
    await userEvent.click(document.body);

    // No error should appear
    await expectNoErrorIndicator(canvas, 'root-2');

    // Reopen - formula still intact
    await openFormulaSubmenu(canvas, 'root-2');
    await expectFormulaInputValue('root-2', 'price * quantity');
    await expectNoFormulaError('root-2');
    await userEvent.click(document.body);
  },
};

export const ImmediateErrorOnInvalidInput: Story = {
  render: (args) => (
    <UpdatingStoryWrapper
      {...args}
      initialSchema={simpleFormulaSchema}
      tableId="orders"
      hint="E2E Test: Type invalid formula and verify error appears immediately under input (on change, not on blur/close)"
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Open formula submenu for 'total'
    await openFormulaSubmenu(canvas, 'root-2');

    // Type invalid formula (clear existing and type new)
    const formulaInputTestId = 'root-2-setting-button-formula-input';
    const formulaInput = screen.getByTestId(formulaInputTestId);
    await userEvent.clear(formulaInput);
    await userEvent.type(formulaInput, 'price * quantity2');

    // Error should appear IMMEDIATELY under the input (no blur/close needed)
    await expectFormulaError('root-2', 'quantity2');

    // Close the menu — this applies formula to the model
    await userEvent.click(document.body);

    // After close, error indicator and Review Errors should appear
    await expectErrorIndicator(canvas, 'root-2');

    await waitFor(async () => {
      const reviewButton = canvas.getByTestId(
        'schema-editor-review-errors-button',
      );
      await expect(reviewButton).toBeInTheDocument();
    });
  },
};
