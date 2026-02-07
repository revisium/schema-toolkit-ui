import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, waitFor, screen, within } from 'storybook/test';
import { UpdatingStoryWrapper, updatingBaseMeta } from '../../shared';
import { simpleFormulaSchema } from '../../schemas';
import {
  renameField,
  openSettingsMenu,
  expectErrorIndicator,
} from '../test-utils';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'V3/SchemaEditor/E2E/Updating/FormulaErrors',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

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

    // Open settings menu for 'total' and navigate to formula submenu
    await openSettingsMenu(canvas, 'root-2');

    const formulaMenuTestId = 'root-2-setting-button-formula-menu';
    await waitFor(async () => {
      const formulaOption = screen.getByTestId(formulaMenuTestId);
      await expect(formulaOption).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId(formulaMenuTestId));

    // Verify formula input is visible and contains the formula text (not empty)
    const formulaInputTestId = 'root-2-setting-button-formula-input';
    await waitFor(async () => {
      const formulaInput = screen.getByTestId(formulaInputTestId);
      await expect(formulaInput).toBeInTheDocument();
    });

    const formulaInput = screen.getByTestId(formulaInputTestId);
    await expect(formulaInput).toHaveValue('price * quantity');

    // Verify error message is displayed under the input
    await waitFor(async () => {
      const errorText = screen.getByTestId(
        'root-2-setting-button-formula-error',
      );
      await expect(errorText).toBeInTheDocument();
    });

    // Close the menu
    await userEvent.click(document.body);

    // Verify formula error indicator is still present (formula was not cleared)
    await expectErrorIndicator(canvas, 'root-2');
  },
};
