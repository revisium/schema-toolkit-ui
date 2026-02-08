import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn, screen, userEvent } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../shared';
import { arraySchema, complexSchema } from '../schemas';
import {
  addArrayItem,
  editStringField,
  expandField,
  collapseField,
  expectRowExists,
  expectRowNotExists,
  expectFieldValue,
} from './test-utils';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/E2E/ArrayOperations',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const AddArrayItem: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{ title: 'Article', tags: ['react'] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectRowExists(canvas, 'tags-0');
    await addArrayItem(canvas, 'tags');
    await expectRowExists(canvas, 'tags-1');
  },
};

export const AddMultipleItems: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{ title: 'Article', tags: [] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await addArrayItem(canvas, 'tags');
    await addArrayItem(canvas, 'tags');
    await addArrayItem(canvas, 'tags');

    await expectRowExists(canvas, 'tags-0');
    await expectRowExists(canvas, 'tags-1');
    await expectRowExists(canvas, 'tags-2');
  },
};

export const DeleteArrayItem: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{ title: 'Article', tags: ['react', 'typescript', 'mobx'] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectRowExists(canvas, 'tags-0');
    await expectRowExists(canvas, 'tags-1');
    await expectRowExists(canvas, 'tags-2');

    const row = canvas.getByTestId('tags-1');
    await userEvent.hover(row);

    await waitFor(async () => {
      const menuTrigger = row.querySelector('[data-part="trigger"]');
      await expect(menuTrigger).toBeInTheDocument();
    });

    const menuTrigger = row.querySelector('[data-part="trigger"]');
    await userEvent.click(menuTrigger!);

    await waitFor(async () => {
      const deleteItem = screen.getByText('Delete');
      await expect(deleteItem).toBeInTheDocument();
    });

    const deleteItem = screen.getByText('Delete');
    await userEvent.click(deleteItem);

    await waitFor(() => {
      const items = canvas.queryAllByTestId(/^tags-\d+$/);
      expect(items).toHaveLength(2);
    });
  },
};

export const ExpandCollapseArray: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={arraySchema}
      initialValue={{ title: 'Article', tags: ['react', 'typescript'] }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectRowExists(canvas, 'tags-0');
    await collapseField(canvas, 'tags');
    await expectRowNotExists(canvas, 'tags-0');

    await expandField(canvas, 'tags');
    await expectRowExists(canvas, 'tags-0');
  },
};

export const ArrayOfObjectsEdit: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={complexSchema}
      initialValue={{
        id: '1',
        name: 'Product',
        price: 10,
        quantity: 2,
        items: [{ sku: 'A001', name: 'Item 1', price: 5 }],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectRowExists(canvas, 'items-0');
    await editStringField(canvas, 'items-0-name', 'Updated Item');
    await expectFieldValue(canvas, 'items-0-name', 'Updated Item');
  },
};
