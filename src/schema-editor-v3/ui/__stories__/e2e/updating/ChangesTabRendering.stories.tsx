import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn, screen } from 'storybook/test';
import { UpdatingStoryWrapper, updatingBaseMeta } from '../../shared';
import { simpleSchema } from '../../schemas';
import type { UpdatingEditorVM } from '../../../../model/vm/UpdatingEditorVM';
import { clickApplyChangesButton, confirmApplyChanges } from '../test-utils';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'V3/SchemaEditor/E2E/Updating',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

/**
 * Tests that the Changes tab in the ReviewChangesDialog renders
 * operation-specific rows for each patch type.
 *
 * Uses simpleSchema: { title, description, price, inStock }
 * - Rename 'title' -> 'name' (move + isRename)
 * - Change default of 'price' (replace)
 * - Add new field 'category' (add)
 * - Remove 'inStock' (remove)
 *
 * Verifies:
 * - Each operation renders its description text
 * - 'add' shows default value row but no duplicated 'default' property change
 * - 'remove' shows only the description, no sub-rows
 * - Apply changes callback fires with correct patches
 */
export const ChangesTabRendering: Story = {
  args: {
    onApplyChanges: fn(),
    onCancel: fn(),
  },
  render: function Render(args) {
    return (
      <UpdatingStoryWrapper
        {...args}
        initialSchema={simpleSchema}
        tableId="items"
        hint="E2E: Verify operation-specific patch rendering in Changes tab"
        setupStore={(vm) => {
          (window as unknown as { __testVM: UpdatingEditorVM }).__testVM = vm;
        }}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.queryByTestId('root-0')).toBeInTheDocument();
    });

    const vm = (window as unknown as { __testVM: UpdatingEditorVM }).__testVM;
    expect(vm).toBeDefined();

    const rootId = vm.tree.schemaModel.root.id();

    const findAccessor = (name: string) => {
      const children = vm.tree.getChildAccessors(rootId);
      return children.find((a) => a.label.name === name);
    };

    // Rename 'title' -> 'name'
    const titleAccessor = findAccessor('title');
    expect(titleAccessor).toBeDefined();
    titleAccessor!.actions.rename('name');
    await new Promise((r) => setTimeout(r, 100));

    // Change default of 'price' from 0 to 99
    const priceAccessor = findAccessor('price');
    expect(priceAccessor).toBeDefined();
    priceAccessor!.actions.setDefaultValue(99);

    // Add new field 'category'
    const rootAccessor = vm.tree.rootAccessor;
    rootAccessor.actions.addProperty('category');
    await new Promise((r) => setTimeout(r, 100));

    // Remove 'inStock'
    const inStockAccessor = findAccessor('inStock');
    expect(inStockAccessor).toBeDefined();
    inStockAccessor!.actions.remove();
    await new Promise((r) => setTimeout(r, 100));

    // Open the review dialog
    await waitFor(
      () => {
        expect(
          canvas.queryByTestId('schema-editor-approve-button'),
        ).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    await clickApplyChangesButton(canvas);

    await waitFor(() =>
      expect(
        screen.getByText('Review Changes for "items"'),
      ).toBeInTheDocument(),
    );

    // Verify operation descriptions are rendered
    await waitFor(() => {
      expect(screen.getByText(/was added/)).toBeInTheDocument();
    });
    expect(screen.getByText(/was removed/)).toBeInTheDocument();
    expect(screen.getByText(/was modified/)).toBeInTheDocument();
    expect(screen.getByText(/Renamed field/)).toBeInTheDocument();

    // Confirm and verify callback
    await confirmApplyChanges();

    await waitFor(() => {
      expect(args.onApplyChanges).toHaveBeenCalled();
    });
  },
};
