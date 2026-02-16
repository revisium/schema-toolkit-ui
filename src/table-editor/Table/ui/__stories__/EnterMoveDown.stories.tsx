import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  col,
  createTableStoryState,
  FilterFieldType,
} from '../../../__stories__/helpers.js';
import { TableWidget } from '../TableWidget.js';

ensureReactivityProvider();

const TABLE_SCHEMA = {
  type: 'object' as const,
  properties: {
    name: { type: 'string', default: '' },
    age: { type: 'number', default: 0 },
    active: { type: 'boolean', default: false },
  },
  additionalProperties: false,
  required: ['name', 'age', 'active'],
};

const TEST_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
];

const MOCK_ROWS_DATA = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
  { name: 'Charlie', age: 35, active: true },
  { name: 'Diana', age: 28, active: true },
  { name: 'Eve', age: 22, active: false },
];

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      schema: TABLE_SCHEMA,
      columns: TEST_COLUMNS,
      rowsData: MOCK_ROWS_DATA,
    }),
  );

  return (
    <Box width="600px" height="400px" borderWidth="1px" borderColor="gray.200">
      <TableWidget
        rows={state.rows}
        columnsModel={state.columnsModel}
        cellFSM={state.cellFSM}
        selection={state.selection}
      />
    </Box>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Table/E2E/EnterMoveDown',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const EnterMoveDown: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nameCell1 = canvas.getByTestId('cell-row-1-name');
    await userEvent.dblClick(nameCell1);
    const nameInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(nameCell1).toHaveTextContent('Updated');
    });

    const nameInput2 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(nameInput2.value).toBe('Bob');
    expect(nameCell1).toHaveAttribute('tabindex', '-1');

    await userEvent.clear(nameInput2);
    await userEvent.type(nameInput2, 'Bob2');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('Bob2');
    });
    const nameInput3 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(nameInput3.value).toBe('Charlie');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="string-cell-input"]'),
      ).toBeNull();
    });

    const ageCell1 = canvas.getByTestId('cell-row-1-age');
    await userEvent.click(ageCell1);
    await userEvent.dblClick(ageCell1);
    const ageInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(ageInput);
    await userEvent.type(ageInput, '99');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(ageCell1).toHaveTextContent('99');
    });

    const ageInput2 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(ageInput2.value).toBe('25');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="number-cell-input"]'),
      ).toBeNull();
    });

    const nameCell5 = canvas.getByTestId('cell-row-5-name');
    await userEvent.click(nameCell5);
    await userEvent.dblClick(nameCell5);
    const lastInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(lastInput);
    await userEvent.type(lastInput, 'Last');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(nameCell5).toHaveTextContent('Last');
    });
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="string-cell-input"]'),
      ).toBeNull();
    });
    await waitFor(() => {
      expect(nameCell5).toHaveAttribute('tabindex', '0');
    });

    await userEvent.dblClick(nameCell5);
    const blurInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(blurInput);
    await userEvent.type(blurInput, 'BlurTest');
    blurInput.blur();

    await waitFor(() => {
      expect(nameCell5).toHaveTextContent('BlurTest');
    });
    await waitFor(() => {
      expect(nameCell5).toHaveAttribute('tabindex', '0');
    });
    expect(
      document.querySelector('[data-testid="string-cell-input"]'),
    ).toBeNull();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(nameCell5).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const EnterMoveDownUnchanged: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const nameCell1 = canvas.getByTestId('cell-row-1-name');
    await userEvent.dblClick(nameCell1);
    const nameInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(nameInput.value).toBe('Alice');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(nameCell1).toHaveTextContent('Alice');
    });

    const nameInput2 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(nameInput2.value).toBe('Bob');

    await userEvent.keyboard('{Enter}');
    const nameInput3 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(nameInput3.value).toBe('Charlie');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="string-cell-input"]'),
      ).toBeNull();
    });

    const ageCell1 = canvas.getByTestId('cell-row-1-age');
    await userEvent.click(ageCell1);
    await userEvent.dblClick(ageCell1);
    const ageInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(ageInput.value).toBe('30');
    await userEvent.keyboard('{Enter}');

    const ageInput2 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(ageInput2.value).toBe('25');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="number-cell-input"]'),
      ).toBeNull();
    });
  },
};
