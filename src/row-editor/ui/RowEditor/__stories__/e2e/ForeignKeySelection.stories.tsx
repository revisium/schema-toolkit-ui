import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn, screen, userEvent } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../shared';
import { foreignKeyFieldSchema } from '../schemas';
import type { RowEditorCallbacks } from '../../../../vm/types';
import type { RowEditorVM } from '../../../../vm/RowEditorVM';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const allRowIds = ['row-1', 'row-2', 'row-3', 'product-alpha', 'product-beta'];

const mockCallbacks: RowEditorCallbacks = {
  onSearchForeignKey: async (_tableId: string, search: string) => {
    await delay(100);
    const filtered = search
      ? allRowIds.filter((id) => id.includes(search))
      : allRowIds;
    return { ids: filtered, hasMore: false };
  },
  onNavigateToForeignKey: () => {},
};

function getTestVM(): RowEditorVM {
  return (window as unknown as Record<string, unknown>).__testVM as RowEditorVM;
}

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/E2E/ForeignKeySelection',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const SelectFromPickerGeneratesSinglePatch: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={foreignKeyFieldSchema}
      initialValue={{ name: 'Laptop', productId: 'row-1' }}
      callbacks={mockCallbacks}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const editor = await canvas.findByTestId('productId-editor');
    await userEvent.click(editor);

    await waitFor(
      () => {
        const picker = screen.getByTestId('fk-picker');
        expect(picker).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await waitFor(
      () => {
        const item = screen.getByTestId('fk-item-product-alpha');
        expect(item).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    const item = screen.getByTestId('fk-item-product-alpha');
    await userEvent.click(item);

    await delay(100);

    const vm = getTestVM();

    expect(vm.patches).toHaveLength(1);
    expect(vm.patches[0]).toEqual({
      op: 'replace',
      path: '/productId',
      value: 'product-alpha',
    });
  },
};

export const SelectFromPickerUpdatesValue: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={foreignKeyFieldSchema}
      initialValue={{ name: 'Laptop', productId: 'row-1' }}
      callbacks={mockCallbacks}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const editor = await canvas.findByTestId('productId-editor');
    await userEvent.click(editor);

    await waitFor(
      () => {
        const item = screen.getByTestId('fk-item-row-2');
        expect(item).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    const item = screen.getByTestId('fk-item-row-2');
    await userEvent.click(item);

    await waitFor(() => {
      const updatedEditor = canvas.getByTestId('productId-editor');
      expect(updatedEditor).toHaveTextContent('row-2');
    });
  },
};

export const RevertToOriginalValueSkipsOnChange: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={foreignKeyFieldSchema}
      initialValue={{ name: 'Laptop', productId: 'row-1' }}
      callbacks={mockCallbacks}
    />
  ),
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Select row-2
    const editor = await canvas.findByTestId('productId-editor');
    await userEvent.click(editor);

    await waitFor(
      () => {
        const item = screen.getByTestId('fk-item-row-2');
        expect(item).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await userEvent.click(screen.getByTestId('fk-item-row-2'));
    await delay(200);

    const vm = getTestVM();
    expect(vm.patches).toHaveLength(1);
    expect(args.onChange).toHaveBeenCalledTimes(1);

    // Select back row-1 (original value)
    const editor2 = await canvas.findByTestId('productId-editor');
    await userEvent.click(editor2);

    await waitFor(
      () => {
        const item = screen.getByTestId('fk-item-row-1');
        expect(item).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await userEvent.click(screen.getByTestId('fk-item-row-1'));
    await delay(200);

    // Value reverted to original
    expect(vm.isDirty).toBe(false);
    expect(args.onChange).toHaveBeenCalledTimes(2);
  },
};

export const PickerClosesAfterSelection: Story = {
  args: { onSave: fn(), onChange: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={foreignKeyFieldSchema}
      initialValue={{ name: 'Laptop', productId: 'row-1' }}
      callbacks={mockCallbacks}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const editor = await canvas.findByTestId('productId-editor');
    await userEvent.click(editor);

    await waitFor(
      () => {
        const picker = screen.getByTestId('fk-picker');
        expect(picker).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    const item = await waitFor(() => {
      const el = screen.getByTestId('fk-item-row-3');
      expect(el).toBeInTheDocument();
      return el;
    });

    await userEvent.click(item);

    await waitFor(() => {
      const picker = screen.queryByTestId('fk-picker');
      expect(picker).not.toBeInTheDocument();
    });
  },
};
