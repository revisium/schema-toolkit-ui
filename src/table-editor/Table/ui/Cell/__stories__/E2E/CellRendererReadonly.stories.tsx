import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { FilterFieldType } from '../../../../../shared/field-types.js';
import { mockClipboard } from '../../../../../__stories__/helpers.js';
import { StoryWrapper, createSchema } from '../helpers.js';

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Cell/E2E/Readonly',
  decorators: [(Story) => <Story />],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const ReadonlyCellFocus: Story = {
  tags: ['test'],
  args: {
    field: 'greeting',
    fieldType: FilterFieldType.String,
    schema: createSchema({
      greeting: { type: 'string', readOnly: true },
    }),
    initialData: { greeting: 'Hello, World' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-greeting');

    expect(cell).toHaveTextContent('Hello, World');
    expect(cell).toHaveAttribute('tabindex', '-1');

    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });
    expect(cell).toHaveTextContent('readonly');

    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="string-cell-input"]'),
      ).toBeNull();
    });
    expect(cell).toHaveAttribute('tabindex', '0');

    await userEvent.keyboard('X');
    expect(
      document.querySelector('[data-testid="string-cell-input"]'),
    ).toBeNull();
    expect(cell).toHaveAttribute('tabindex', '0');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const ReadonlyNumberCellFocus: Story = {
  tags: ['test'],
  args: {
    field: 'total',
    fieldType: FilterFieldType.Number,
    schema: createSchema({
      total: { type: 'number', readOnly: true },
    }),
    initialData: { total: 1998 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-total');

    expect(cell).toHaveTextContent('1998');

    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });
    expect(cell).toHaveTextContent('readonly');

    await userEvent.keyboard('{Enter}');
    expect(
      document.querySelector('[data-testid="number-cell-input"]'),
    ).toBeNull();

    await userEvent.keyboard('5');
    expect(
      document.querySelector('[data-testid="number-cell-input"]'),
    ).toBeNull();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const CopyPasteInteractions: Story = {
  tags: ['test'],
  args: {
    field: 'name',
    fieldType: FilterFieldType.String,
    schema: createSchema({ name: 'string' }),
    initialData: { name: 'Hello' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-name');

    const clipboard = mockClipboard();

    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Control>}c{/Control}');
    expect(clipboard.getText()).toBe('Hello');

    clipboard.setText('Pasted');
    await userEvent.keyboard('{Control>}v{/Control}');
    await waitFor(() => {
      expect(cell).toHaveTextContent('Pasted');
    });

    expect(clipboard.getText()).toBe('Pasted');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const ReadonlyBooleanCellFocus: Story = {
  tags: ['test'],
  args: {
    field: 'expensive',
    fieldType: FilterFieldType.Boolean,
    schema: createSchema({
      expensive: { type: 'boolean', readOnly: true },
    }),
    initialData: { expensive: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-expensive');

    expect(cell).toHaveTextContent('true');

    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });
    expect(cell).toHaveTextContent('readonly');

    await userEvent.dblClick(cell);
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="boolean-option-true"]'),
      ).toBeNull();
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};
