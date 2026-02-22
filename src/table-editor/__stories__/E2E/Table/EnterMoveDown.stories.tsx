import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { createTableStoryState } from '../../helpers.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';
import {
  TABLE_SCHEMA,
  MOCK_ROWS_DATA,
} from '../../../Table/ui/__stories__/tableTestData.js';

ensureReactivityProvider();

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      dataSchema: TABLE_SCHEMA,
      rowsData: MOCK_ROWS_DATA,
    }),
  );

  return (
    <Box width="600px" height="400px">
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
  title: 'TableEditor/E2E/Table/EnterMoveDown',
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

    // --- Changed values (string column) ---

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

    // --- Changed values (number column) ---

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

    // --- Last row (no row below) ---

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

    // --- Unchanged values (string column) ---

    await userEvent.dblClick(nameCell1);
    const unchangedNameInput1 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(unchangedNameInput1.value).toBe('Updated');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(nameCell1).toHaveTextContent('Updated');
    });

    const unchangedNameInput2 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(unchangedNameInput2.value).toBe('Bob2');

    await userEvent.keyboard('{Enter}');
    const unchangedNameInput3 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(unchangedNameInput3.value).toBe('Charlie');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="string-cell-input"]'),
      ).toBeNull();
    });

    // --- Unchanged values (number column) ---

    const ageCell3 = canvas.getByTestId('cell-row-3-age');
    await userEvent.click(ageCell3);
    await userEvent.dblClick(ageCell3);
    const unchangedAgeInput3 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(unchangedAgeInput3.value).toBe('35');
    await userEvent.keyboard('{Enter}');

    const unchangedAgeInput4 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(unchangedAgeInput4.value).toBe('28');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="number-cell-input"]'),
      ).toBeNull();
    });

    // --- Final Escape to unfocus ---

    await userEvent.keyboard('{Escape}');
  },
};
