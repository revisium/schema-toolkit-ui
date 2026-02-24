import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import type { Meta, StoryObj } from '@storybook/react';
import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { expect, within, waitFor } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { createTableStoryState, type TableStoryState } from '../../helpers.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';

ensureReactivityProvider();

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
  email: str(),
  score: num(),
});

const MOCK_ROWS = [
  { name: 'Alice', age: 30, active: true, email: 'a@b.c', score: 95 },
  { name: 'Bob', age: 25, active: false, email: 'b@c.d', score: 80 },
];

const CONTAINER_WIDTH = 800;
const NARROW_COLUMN_WIDTH = 100;
const WIDE_COLUMN_WIDTH = 250;

function createNarrowColumnsState(): TableStoryState {
  const s = createTableStoryState({
    dataSchema: TABLE_SCHEMA,
    rowsData: MOCK_ROWS,
    visibleFields: ['data.name', 'data.age', 'data.active'],
  });
  runInAction(() => {
    for (const col of s.columnsModel.visibleColumns) {
      s.columnsModel.setColumnWidth(col.field, NARROW_COLUMN_WIDTH);
    }
  });
  return s;
}

function createWideColumnsState(): TableStoryState {
  const s = createTableStoryState({
    dataSchema: TABLE_SCHEMA,
    rowsData: MOCK_ROWS,
    visibleFields: ['data.name', 'data.age', 'data.active'],
  });
  runInAction(() => {
    for (const col of s.columnsModel.visibleColumns) {
      s.columnsModel.setColumnWidth(col.field, WIDE_COLUMN_WIDTH);
    }
  });
  return s;
}

const NarrowColumnsWrapper = observer(() => {
  const [state] = useState(createNarrowColumnsState);

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return (
    <Box width={`${CONTAINER_WIDTH}px`} height="300px">
      <TableWidget
        rows={state.rows}
        columnsModel={state.columnsModel}
        cellFSM={state.cellFSM}
        selection={state.selection}
      />
    </Box>
  );
});

const WideColumnsWrapper = observer(() => {
  const [state] = useState(createWideColumnsState);

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return (
    <Box width={`${CONTAINER_WIDTH}px`} height="300px">
      <TableWidget
        rows={state.rows}
        columnsModel={state.columnsModel}
        cellFSM={state.cellFSM}
        selection={state.selection}
      />
    </Box>
  );
});

const meta: Meta<typeof NarrowColumnsWrapper> = {
  component: NarrowColumnsWrapper as any,
  title: 'TableEditor/E2E/Table/AddColumnLayout',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof NarrowColumnsWrapper>;

export const NoGapWhenColumnsNarrowerThanTable: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableStoryState;

    expect(state.columnsModel.hasHiddenColumns).toBe(true);

    const addBtn = canvas.getByTestId('add-column-button');
    expect(addBtn).toBeVisible();

    const tableWidget = canvas.getByTestId('table-widget');
    const headerRow = tableWidget.querySelector('thead tr');
    expect(headerRow).toBeTruthy();

    const headerCells = headerRow!.querySelectorAll('th');
    const lastDataCell = headerCells[headerCells.length - 2];
    const addColumnCell = headerCells[headerCells.length - 1];
    expect(lastDataCell).toBeTruthy();
    expect(addColumnCell).toBeTruthy();

    const lastDataRect = lastDataCell!.getBoundingClientRect();
    const addColumnRect = addColumnCell!.getBoundingClientRect();

    const gap = addColumnRect.left - lastDataRect.right;
    expect(gap).toBeLessThanOrEqual(1);
  },
};

export const StickyWhenColumnsWiderThanTable: Story = {
  tags: ['test'],
  render: () => <WideColumnsWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableStoryState;

    expect(state.columnsModel.hasHiddenColumns).toBe(true);

    const addBtn = canvas.getByTestId('add-column-button');
    expect(addBtn).toBeVisible();

    const tableWidget = canvas.getByTestId('table-widget');
    const headerRow = tableWidget.querySelector('thead tr');
    expect(headerRow).toBeTruthy();

    const headerCells = headerRow!.querySelectorAll('th');
    const addColumnCell = headerCells[headerCells.length - 1];
    expect(addColumnCell).toBeTruthy();

    const addColumnStyle = window.getComputedStyle(addColumnCell!);
    expect(addColumnStyle.position).toBe('sticky');

    const containerRect = tableWidget.getBoundingClientRect();
    const addColumnRect = addColumnCell!.getBoundingClientRect();

    expect(addColumnRect.right).toBeLessThanOrEqual(containerRect.right + 1);
    expect(addColumnRect.right).toBeGreaterThanOrEqual(containerRect.right - 1);
  },
};
