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
  TEST_COLUMNS,
  MOCK_ROWS_DATA,
} from '../../../Table/ui/__stories__/tableTestData.js';

ensureReactivityProvider();

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
  title: 'TableEditor/E2E/Table/CellNavigation',
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

export const CellInteractions: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const cellName = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(cellName);
    await waitFor(() => {
      expect(cellName).toHaveAttribute('tabindex', '0');
    });

    const cellRow2 = canvas.getByTestId('cell-row-2-name');
    await userEvent.click(cellRow2);
    await waitFor(() => {
      expect(cellRow2).toHaveAttribute('tabindex', '0');
      expect(cellName).toHaveAttribute('tabindex', '-1');
    });

    await userEvent.keyboard('{ArrowDown}');
    const cellRow3 = canvas.getByTestId('cell-row-3-name');
    await waitFor(() => {
      expect(cellRow3).toHaveAttribute('tabindex', '0');
      expect(cellRow2).toHaveAttribute('tabindex', '-1');
    });

    await userEvent.keyboard('{ArrowRight}');
    const cellRow3Age = canvas.getByTestId('cell-row-3-age');
    await waitFor(() => {
      expect(cellRow3Age).toHaveAttribute('tabindex', '0');
      expect(cellRow3).toHaveAttribute('tabindex', '-1');
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-active')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await userEvent.dblClick(canvas.getByTestId('cell-row-1-name'));
    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(input);
    await userEvent.type(input, 'Updated');
    input.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent(
        'Updated',
      );
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.dblClick(canvas.getByTestId('cell-row-1-age'));
    const numInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(numInput);
    await userEvent.type(numInput, '77');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveTextContent('77');
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('X');
    const charInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(charInput.value).toBe('X');
    charInput.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('X');
    });

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('1');
    const digitInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    expect(digitInput.value).toBe('1');
    digitInput.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('1');
    });

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{Delete}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('');
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '-1',
      );
    });
  },
};
