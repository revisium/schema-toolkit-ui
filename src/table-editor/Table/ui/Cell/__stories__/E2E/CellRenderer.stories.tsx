import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { FilterFieldType } from '../../../../../shared/field-types.js';
import { StoryWrapper, createSchema } from '../helpers.js';

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Cell/E2E/CellRenderer',
  decorators: [(Story) => <Story />],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const CellInteractions: Story = {
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

    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });

    await userEvent.dblClick(cell);
    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.clear(input);
    await userEvent.type(input, 'New Value');
    input.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent(
        'New Value',
      );
    });

    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Enter}');
    const input2 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.type(input2, ' World');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="string-cell-input"]'),
      ).toBeNull();
    });
    expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent(
      'New Value',
    );

    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('X');
    const input3 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    expect(input3.value).toBe('X');
    input3.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('X');
    });

    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('1');
    const input4 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    expect(input4.value).toBe('1');
    input4.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('1');
    });

    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Delete}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('');
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const BooleanCellToggle: Story = {
  tags: ['test'],
  args: {
    field: 'active',
    fieldType: FilterFieldType.Boolean,
    schema: createSchema({ active: 'boolean' }),
    initialData: { active: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-active');

    expect(cell).toHaveTextContent('true');

    await userEvent.click(cell);

    await userEvent.dblClick(cell);

    const falseOption = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="boolean-option-false"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(falseOption);

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-active')).toHaveTextContent(
        'false',
      );
    });
  },
};

export const NumberCellEdit: Story = {
  tags: ['test'],
  args: {
    field: 'age',
    fieldType: FilterFieldType.Number,
    schema: createSchema({ age: 'number' }),
    initialData: { age: 42 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-age');

    expect(cell).toHaveTextContent('42');

    await userEvent.dblClick(cell);

    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.clear(input);
    await userEvent.type(input, '99');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveTextContent('99');
    });
  },
};
