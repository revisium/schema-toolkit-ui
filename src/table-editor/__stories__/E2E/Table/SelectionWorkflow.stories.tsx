import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { createTableStoryState } from '../../helpers.js';
import { SelectionModel } from '../../../Table/model/SelectionModel.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';
import {
  TABLE_SCHEMA,
  MOCK_ROWS_DATA,
} from '../../../Table/ui/__stories__/tableTestData.js';

ensureReactivityProvider();

const noop = () => {};

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      dataSchema: TABLE_SCHEMA,
      rowsData: MOCK_ROWS_DATA,
    }),
  );

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return (
    <Box width="600px" height="400px">
      <TableWidget
        rows={state.rows}
        columnsModel={state.columnsModel}
        cellFSM={state.cellFSM}
        selection={state.selection}
        onOpenRow={noop}
        onDeleteRow={noop}
        onDuplicateRow={noop}
        onDeleteSelected={noop}
      />
    </Box>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/E2E/Table/SelectionWorkflow',
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

export const SelectionWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { selection } = (window as any).__testState as {
      selection: SelectionModel;
    };

    // Smoke: headers
    await waitFor(() => {
      expect(canvas.getByTestId('header-data.name')).toBeVisible();
      expect(canvas.getByTestId('header-data.age')).toBeVisible();
      expect(canvas.getByTestId('header-data.active')).toBeVisible();
    });
    expect(canvas.getByTestId('header-data.name')).toHaveTextContent('name');
    expect(canvas.getByTestId('header-data.age')).toHaveTextContent('age');
    expect(canvas.getByTestId('header-data.active')).toHaveTextContent(
      'active',
    );

    // Smoke: rows
    await waitFor(() => {
      expect(canvas.getByTestId('row-row-1')).toBeVisible();
      expect(canvas.getByTestId('row-row-2')).toBeVisible();
      expect(canvas.getByTestId('row-row-3')).toBeVisible();
      expect(canvas.getByTestId('row-row-4')).toBeVisible();
      expect(canvas.getByTestId('row-row-5')).toBeVisible();
    });
    expect(canvas.getByTestId('cell-row-1-data.name')).toHaveTextContent(
      'Alice',
    );
    expect(canvas.getByTestId('cell-row-2-data.name')).toHaveTextContent('Bob');
    expect(canvas.getByTestId('cell-row-3-data.name')).toHaveTextContent(
      'Charlie',
    );

    // Selection workflow
    selection.toggle('row-1');

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="selection-toolbar"]'),
      ).toBeTruthy();
    });
    expect(selection.selectedCount).toBe(1);

    const selectAllBtn = document.querySelector(
      '[data-testid="select-all"]',
    ) as HTMLElement;
    await userEvent.click(selectAllBtn);

    await waitFor(() => {
      expect(selection.selectedCount).toBe(5);
    });

    const exitBtn = document.querySelector(
      '[data-testid="exit-selection"]',
    ) as HTMLElement;
    await userEvent.click(exitBtn);

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="selection-toolbar"]'),
      ).toBeNull();
    });
  },
};
