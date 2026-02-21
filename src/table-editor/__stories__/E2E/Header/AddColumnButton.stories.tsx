import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { col, createTableStoryState, FilterFieldType } from '../../helpers.js';
import { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';

ensureReactivityProvider();

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
  email: str(),
});

const ALL_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
  col('email', FilterFieldType.String),
];

const MOCK_ROWS = [
  { name: 'Alice', age: 30, active: true, email: 'alice@test.com' },
];

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      schema: TABLE_SCHEMA,
      columns: ALL_COLUMNS,
      rowsData: MOCK_ROWS,
      visibleFields: ['name', 'age'],
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
      />
    </Box>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/E2E/Header/AddColumnButton',
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

export const AddColumnWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    // Initial state: 2 visible columns [name, age]
    expect(columnsModel.visibleColumns).toHaveLength(2);

    // Step 1: Add single column "active"
    {
      const addButton = canvas.getByTestId('add-column-button');
      await userEvent.click(addButton);

      const activeItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="active"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(activeItem);

      await waitFor(() => {
        expect(columnsModel.visibleColumns).toHaveLength(3);
        expect(
          columnsModel.visibleColumns.some((c) => c.field === 'active'),
        ).toBe(true);
      });
    }

    // Step 2: Add all remaining columns
    // Columns before: [name, age, active] (email still hidden)
    {
      const addButton = canvas.getByTestId('add-column-button');
      await userEvent.click(addButton);

      const addAllItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="add-all"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(addAllItem);

      await waitFor(() => {
        expect(columnsModel.visibleColumns).toHaveLength(4);
      });
    }
  },
};
