import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, fn } from 'storybook/test';
import { StoryWrapper, baseMeta } from '../shared';
import { nestedSchema } from '../schemas';
import {
  expandField,
  collapseField,
  editStringField,
  expectFieldValue,
  expectRowExists,
  expectRowNotExists,
} from './test-utils';

const meta: Meta<typeof StoryWrapper> = {
  ...baseMeta,
  title: 'RowEditor/E2E/ObjectInteractions',
  tags: ['test'],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const CollapseNestedObject: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={nestedSchema}
      initialValue={{
        name: 'Jane',
        address: { street: '123 Main St', city: 'NY', zip: '10001' },
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expectRowExists(canvas, 'address-street');

    await collapseField(canvas, 'address');

    await expectRowNotExists(canvas, 'address-street');
  },
};

export const ExpandNestedObject: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={nestedSchema}
      initialValue={{
        name: 'Jane',
        address: { street: '123 Main St', city: 'NY', zip: '10001' },
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await collapseField(canvas, 'address');
    await expectRowNotExists(canvas, 'address-street');

    await expandField(canvas, 'address');
    await expectRowExists(canvas, 'address-street');
  },
};

export const EditNestedField: Story = {
  args: { onSave: fn(), onCancel: fn() },
  render: (args) => (
    <StoryWrapper
      {...args}
      schema={nestedSchema}
      initialValue={{
        name: 'Jane',
        address: { street: '123 Main St', city: 'NY', zip: '10001' },
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await editStringField(canvas, 'address-street', '456 Oak Ave');
    await expectFieldValue(canvas, 'address-street', '456 Oak Ave');

    await waitFor(() => {
      const saveButton = canvas.getByRole('button', { name: /Save/ });
      expect(saveButton).not.toBeDisabled();
    });
  },
};
