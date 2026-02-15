import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn, screen } from 'storybook/test';
import { UpdatingStoryWrapper, updatingBaseMeta } from '../../shared';
import type { UpdatingEditorVM } from '../../../../model/vm/UpdatingEditorVM';
import {
  addField,
  changeType,
  setFormula,
  selectForeignKey,
  clickApplyChangesButton,
  confirmApplyChanges,
  expectCollapsed,
  expectExpanded,
  expandField,
  expectTypeLabel,
} from '../test-utils';

const meta: Meta<typeof UpdatingStoryWrapper> = {
  ...updatingBaseMeta,
  title: 'SchemaEditor/E2E/Updating',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof UpdatingStoryWrapper>;

/**
 * Complex initial schema for comprehensive E2E testing.
 *
 * Structure:
 * - id: string (will test description)
 * - name: string (will test rename)
 * - price: number (will test default value change)
 * - quantity: number (used in total formula)
 * - isActive: boolean (will test deprecation + move)
 * - tax: number (will be moved into metadata, referenced by totalWithTax formula)
 * - bonus: number with formula 'price * 0.05' (will be moved into metadata)
 * - metadata: object with createdAt and tags
 * - total: number with formula (price * quantity)
 * - totalWithTax: number with formula (total + tax)
 * - summary: string (will test change to Markdown contentMediaType)
 * - avatar: File $ref (will test collapsed state and type label)
 * - createdAt: RowCreatedAt $ref (will test change type from ref to string)
 *
 * Formula move tests:
 * - Move 'bonus' (has formula 'price * 0.05') into metadata
 *   → formula should become '../price * 0.05'
 * - Move 'tax' (dependency of totalWithTax) into metadata
 *   → totalWithTax formula should become 'total + metadata.tax'
 */
const complexInitialSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', default: '' },
    name: { type: 'string', default: '' },
    price: { type: 'number', default: 0 },
    quantity: { type: 'number', default: 1 },
    isActive: { type: 'boolean', default: true },
    tax: { type: 'number', default: 10 },
    bonus: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'price * 0.05' },
    },
    metadata: {
      type: 'object',
      properties: {
        createdAt: { type: 'string', default: '' },
        tags: {
          type: 'array',
          items: { type: 'string', default: '' },
        },
      },
      additionalProperties: false,
      required: ['createdAt', 'tags'],
    },
    total: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'price * quantity' },
    },
    totalWithTax: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'total + tax' },
    },
    summary: { type: 'string', default: '' },
    avatar: { $ref: 'urn:jsonschema:io:revisium:file-schema:1.0.0' },
    recordCreatedAt: {
      $ref: 'urn:jsonschema:io:revisium:row-created-at-schema:1.0.0',
    },
  },
  additionalProperties: false,
  required: [
    'id',
    'name',
    'price',
    'quantity',
    'isActive',
    'tax',
    'bonus',
    'metadata',
    'total',
    'totalWithTax',
    'summary',
    'avatar',
    'recordCreatedAt',
  ],
};

const findAccessorByName = (
  vm: UpdatingEditorVM,
  parentId: string,
  name: string,
) => {
  const children = vm.tree.getChildAccessors(parentId);
  return children.find((a) => a.label.name === name);
};

const getTestId = (
  vm: UpdatingEditorVM,
  parentTestId: string,
  fieldName: string,
) => {
  const rootId = vm.tree.schemaModel.root.id();
  const children = vm.tree.getChildAccessors(rootId);
  const index = children.findIndex((a) => a.label.name === fieldName);
  if (index === -1) {
    throw new Error(`Field ${fieldName} not found`);
  }
  return `${parentTestId}-${index}`;
};

/**
 * Comprehensive E2E Test covering schema editor operations:
 *
 * 1. Set description on 'id' field (via VM)
 * 2. Rename 'name' to 'productName' (via VM)
 * 3. Change default value for 'price' (via VM)
 * 4. Mark 'isActive' as deprecated (via VM)
 * 5. Add new field 'categoryId' with foreign key (via UI)
 * 6. Add new field 'discount' with formula (via UI)
 * 7. Move 'isActive' into 'metadata' object (via VM)
 * 8. Move 'bonus' (field WITH formula) into 'metadata' (via VM)
 *    → Tests that formula path updates when formula field is moved
 * 9. Move 'tax' (formula DEPENDENCY) into 'metadata' (via VM)
 *    → Tests that dependent formula updates when dependency is moved
 * 10. Change 'summary' from string to Markdown (via UI)
 *     → Tests that contentMediaType: 'text/markdown' is set in patch
 * 11. Verify $ref fields (avatar, recordCreatedAt):
 *     - Check type labels show "File" and "CreatedAt" (not "object"/"string")
 *     - Verify avatar (File) is collapsed by default
 *     - Change recordCreatedAt from $ref to regular string
 * 12. Apply changes and verify all patches are generated correctly
 */
export const ComprehensiveSchemaUpdate: Story = {
  args: {
    onApplyChanges: fn(),
    onCancel: fn(),
  },
  render: function Render(args) {
    return (
      <UpdatingStoryWrapper
        {...args}
        initialSchema={complexInitialSchema}
        tableId="products"
        hint="Comprehensive E2E Test: Multiple operations including formula move tests"
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

    // STEP 1: Set description on 'id' field
    const idAccessor = findAccessorByName(vm, rootId, 'id');
    expect(idAccessor).toBeDefined();
    idAccessor!.actions.setDescription('Unique product identifier');

    // STEP 2: Rename 'name' to 'productName'
    const nameAccessor = findAccessorByName(vm, rootId, 'name');
    expect(nameAccessor).toBeDefined();
    nameAccessor!.actions.rename('productName');

    await new Promise((r) => setTimeout(r, 100));

    // STEP 3: Set default value for 'price'
    const priceAccessor = findAccessorByName(vm, rootId, 'price');
    expect(priceAccessor).toBeDefined();
    priceAccessor!.actions.setDefaultValue(100);

    // STEP 4: Mark 'isActive' as deprecated
    const isActiveAccessor = findAccessorByName(vm, rootId, 'isActive');
    expect(isActiveAccessor).toBeDefined();
    isActiveAccessor!.actions.setDeprecated(true);

    // STEP 5: Add 'categoryId' with foreign key
    await addField(canvas, 'root', 'categoryId');
    await new Promise((r) => setTimeout(r, 100));

    const categoryIdTestId = getTestId(vm, 'root', 'categoryId');
    await changeType(canvas, categoryIdTestId, 'ForeignKeyString');
    await selectForeignKey(canvas, categoryIdTestId, 'categories');

    // STEP 6: Add 'discount' with formula
    await addField(canvas, 'root', 'discount');
    await new Promise((r) => setTimeout(r, 100));

    const discountTestId = getTestId(vm, 'root', 'discount');
    await changeType(canvas, discountTestId, 'Number');
    await setFormula(canvas, discountTestId, 'price * 0.1');

    // Get fresh accessors after adding fields
    const getAccessor = (name: string) => {
      const children = vm.tree.getChildAccessors(rootId);
      return children.find((a) => a.label.name === name);
    };

    const metadataAccessor = getAccessor('metadata');
    expect(metadataAccessor).toBeDefined();

    // STEP 7: Move 'isActive' into 'metadata'
    const isActiveAccessorForMove = getAccessor('isActive');
    expect(isActiveAccessorForMove).toBeDefined();
    vm.tree.moveNode(isActiveAccessorForMove!.nodeId, metadataAccessor!.nodeId);
    await new Promise((r) => setTimeout(r, 100));

    // STEP 8: Move 'bonus' (field WITH formula 'price * 0.05') into 'metadata'
    // This tests that when a field with a formula is moved,
    // the formula expression updates to reference the dependency correctly
    const bonusAccessor = getAccessor('bonus');
    expect(bonusAccessor).toBeDefined();
    vm.tree.moveNode(bonusAccessor!.nodeId, metadataAccessor!.nodeId);
    await new Promise((r) => setTimeout(r, 100));

    // STEP 9: Move 'tax' (dependency of 'totalWithTax' formula) into 'metadata'
    // This tests that when a formula dependency is moved,
    // the formula that references it updates its expression
    const taxAccessor = getAccessor('tax');
    expect(taxAccessor).toBeDefined();
    vm.tree.moveNode(taxAccessor!.nodeId, metadataAccessor!.nodeId);
    await new Promise((r) => setTimeout(r, 200));

    // STEP 10: Change 'summary' from string to Markdown
    const summaryTestId = getTestId(vm, 'root', 'summary');
    await expectTypeLabel(canvas, summaryTestId, 'string');
    await changeType(canvas, summaryTestId, 'Markdown');
    await new Promise((r) => setTimeout(r, 100));
    await expectTypeLabel(canvas, summaryTestId, 'Markdown');

    // STEP 11: Verify $ref fields behavior
    // Get test IDs for avatar and recordCreatedAt
    const avatarTestId = getTestId(vm, 'root', 'avatar');
    const recordCreatedAtTestId = getTestId(vm, 'root', 'recordCreatedAt');

    // Verify avatar shows "File" label (not "object")
    await expectTypeLabel(canvas, avatarTestId, 'File');

    // Verify recordCreatedAt shows "createdAt" label (not "string")
    await expectTypeLabel(canvas, recordCreatedAtTestId, 'createdAt');

    // Verify avatar (File) is collapsed by default
    await expectCollapsed(canvas, avatarTestId);

    // Expand avatar to verify it has children
    await expandField(canvas, avatarTestId);
    await expectExpanded(canvas, avatarTestId);

    // Change recordCreatedAt from $ref (CreatedAt) to regular String via UI menu
    await changeType(canvas, recordCreatedAtTestId, 'String');
    await new Promise((r) => setTimeout(r, 100));

    // Verify type label changed to "string"
    await expectTypeLabel(canvas, recordCreatedAtTestId, 'string');

    // STEP 12: Apply changes
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
        screen.getByText('Review Changes for "products"'),
      ).toBeInTheDocument(),
    );

    await confirmApplyChanges();

    await waitFor(() => {
      expect(args.onApplyChanges).toHaveBeenCalled();
    });

    // Verify the patches
    const callArgs = (args.onApplyChanges as ReturnType<typeof fn>).mock
      .calls[0][0] as {
      tableId: string;
      jsonPatches: {
        op: string;
        path: string;
        from?: string;
        value?: unknown;
      }[];
    };

    expect(callArgs.tableId).toBe('products');

    const patches = callArgs.jsonPatches;
    const addPatches = patches.filter((p) => p.op === 'add');
    const replacePatches = patches.filter((p) => p.op === 'replace');
    const movePatches = patches.filter((p) => p.op === 'move');

    // Verify patch counts
    expect(addPatches.length).toBeGreaterThanOrEqual(2);
    expect(replacePatches.length).toBeGreaterThanOrEqual(1);
    expect(movePatches.length).toBeGreaterThanOrEqual(4); // name rename + isActive + bonus + tax

    // Verify rename: name -> productName
    const renamePatch = movePatches.find(
      (p) =>
        p.from === '/properties/name' && p.path === '/properties/productName',
    );
    expect(renamePatch).toBeDefined();

    // Verify isActive moved to metadata
    const isActiveMovePatch = movePatches.find(
      (p) =>
        p.from === '/properties/isActive' &&
        p.path === '/properties/metadata/properties/isActive',
    );
    expect(isActiveMovePatch).toBeDefined();

    // Verify bonus moved to metadata
    const bonusMovePatch = movePatches.find(
      (p) =>
        p.from === '/properties/bonus' &&
        p.path === '/properties/metadata/properties/bonus',
    );
    expect(bonusMovePatch).toBeDefined();

    // Verify tax moved to metadata
    const taxMovePatch = movePatches.find(
      (p) =>
        p.from === '/properties/tax' &&
        p.path === '/properties/metadata/properties/tax',
    );
    expect(taxMovePatch).toBeDefined();

    // ============ FORMULA MOVE TESTS ============

    // TEST CASE 1: When formula field is moved, its formula expression updates
    // bonus had formula 'price * 0.05', after moving into metadata it should be '../price * 0.05'
    const bonusReplacePatch = replacePatches.find(
      (p) => p.path === '/properties/metadata/properties/bonus',
    );
    expect(bonusReplacePatch).toBeDefined();
    const bonusValue = bonusReplacePatch?.value as {
      'x-formula'?: { expression: string };
    };
    expect(bonusValue['x-formula']?.expression).toBe('../price * 0.05');

    // TEST CASE 2: When formula dependency is moved, the formula referencing it updates
    // totalWithTax had formula 'total + tax', after moving tax into metadata
    // it should be 'total + metadata.tax'
    const totalWithTaxPatch = replacePatches.find(
      (p) => p.path === '/properties/totalWithTax',
    );
    expect(totalWithTaxPatch).toBeDefined();
    const totalWithTaxValue = totalWithTaxPatch?.value as {
      'x-formula'?: { expression: string };
    };
    expect(totalWithTaxValue['x-formula']?.expression).toBe(
      'total + metadata.tax',
    );

    // ============ OTHER VERIFICATIONS ============

    // Verify categoryId added with foreign key
    const categoryPatch = addPatches.find(
      (p) => p.path === '/properties/categoryId',
    );
    expect(categoryPatch).toBeDefined();
    expect((categoryPatch?.value as { foreignKey?: string }).foreignKey).toBe(
      'categories',
    );

    // Verify discount added with formula
    const discountPatch = addPatches.find(
      (p) => p.path === '/properties/discount',
    );
    expect(discountPatch).toBeDefined();
    expect(
      (discountPatch?.value as { 'x-formula'?: { expression: string } })[
        'x-formula'
      ]?.expression,
    ).toBe('price * 0.1');

    // Verify id has description
    const idPatch = replacePatches.find((p) => p.path === '/properties/id');
    expect(idPatch).toBeDefined();
    expect((idPatch?.value as { description?: string }).description).toBe(
      'Unique product identifier',
    );

    // Verify price default value changed
    const pricePatch = replacePatches.find(
      (p) => p.path === '/properties/price',
    );
    expect(pricePatch).toBeDefined();
    expect((pricePatch?.value as { default?: number }).default).toBe(100);

    // Verify summary changed to Markdown (contentMediaType: 'text/markdown')
    const summaryPatch = patches.find((p) => p.path === '/properties/summary');
    expect(summaryPatch).toBeDefined();
    expect(
      (summaryPatch?.value as { contentMediaType?: string }).contentMediaType,
    ).toBe('text/markdown');

    // Verify isActive deprecated flag (may be in move or replace patch)
    const isActiveReplacePatch = replacePatches.find(
      (p) => p.path === '/properties/metadata/properties/isActive',
    );
    if (isActiveReplacePatch) {
      expect(
        (isActiveReplacePatch.value as { deprecated?: boolean }).deprecated,
      ).toBe(true);
    }
  },
};
