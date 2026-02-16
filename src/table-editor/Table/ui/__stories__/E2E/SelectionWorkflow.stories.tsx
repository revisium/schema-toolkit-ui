import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../../lib/initReactivity.js';
import {
  col,
  createTableStoryState,
  FilterFieldType,
} from '../../../../__stories__/helpers.js';
import { SelectionModel } from '../../../model/SelectionModel.js';
import { TableWidget } from '../../TableWidget.js';

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

const MOCK_ROWS = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
  { name: 'Charlie', age: 35, active: true },
  { name: 'Diana', age: 28, active: true },
  { name: 'Eve', age: 22, active: false },
];

const noop = () => {};

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      schema: TABLE_SCHEMA,
      columns: TEST_COLUMNS,
      rowsData: MOCK_ROWS,
    }),
  );

  useEffect(() => {
    (window as any).__testState = state;
    return () => {
      delete (window as any).__testState;
    };
  }, [state]);

  return (
    <Box width="600px" height="400px" borderWidth="1px" borderColor="gray.200">
      <TableWidget
        rows={state.rows}
        columnsModel={state.columnsModel}
        cellFSM={state.cellFSM}
        selection={state.selection}
        onDeleteRow={noop}
        onDuplicateRow={noop}
        onDeleteSelected={noop}
      />
    </Box>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Table/E2E/SelectionWorkflow',
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

    selection.toggle('row-1');

    await waitFor(() => {
      expect(canvas.getByTestId('selection-toolbar')).toBeVisible();
    });

    expect(selection.selectedCount).toBe(1);

    await userEvent.click(canvas.getByTestId('select-all'));

    await waitFor(() => {
      expect(selection.selectedCount).toBe(5);
    });

    await userEvent.click(canvas.getByTestId('exit-selection'));

    await waitFor(() => {
      expect(canvas.queryByTestId('selection-toolbar')).toBeNull();
    });
  },
};

export const HeadersRendered: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByTestId('header-name')).toBeVisible();
      expect(canvas.getByTestId('header-age')).toBeVisible();
      expect(canvas.getByTestId('header-active')).toBeVisible();
    });

    expect(canvas.getByTestId('header-name')).toHaveTextContent('Name');
    expect(canvas.getByTestId('header-age')).toHaveTextContent('Age');
    expect(canvas.getByTestId('header-active')).toHaveTextContent('Active');
  },
};

export const MultipleRowsRendered: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByTestId('row-row-1')).toBeVisible();
      expect(canvas.getByTestId('row-row-5')).toBeVisible();
    });

    expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('Alice');
    expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('Bob');
    expect(canvas.getByTestId('cell-row-3-name')).toHaveTextContent('Charlie');
  },
};
