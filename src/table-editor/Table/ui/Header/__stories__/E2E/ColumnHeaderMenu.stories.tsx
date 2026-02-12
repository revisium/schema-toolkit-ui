import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../../../lib/initReactivity.js';
import {
  col,
  createTableStoryState,
  FilterFieldType,
  mockClipboard,
} from '../../../../../__stories__/helpers.js';
import { ColumnsModel } from '../../../../../Columns/model/ColumnsModel.js';
import { SortModel } from '../../../../../Sortings/model/SortModel.js';
import { TableWidget } from '../../../TableWidget.js';

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

const ALL_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
];

const MOCK_ROWS = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
];

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      schema: TABLE_SCHEMA,
      columns: ALL_COLUMNS,
      rowsData: MOCK_ROWS,
      withSort: true,
      withFilter: true,
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
        sortModel={state.sortModel}
        filterModel={state.filterModel}
      />
    </Box>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/Header/E2E/ColumnHeaderMenu',
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

export const OpenMenuAndSort: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { sortModel } = (window as any).__testState as {
      sortModel: SortModel;
    };

    const nameHeader = canvas.getByTestId('header-name');
    await userEvent.click(nameHeader);

    const sortSubmenuTrigger = await waitFor(() => {
      const items = document.querySelectorAll('[role="menuitem"]');
      const trigger = Array.from(items).find((el) =>
        el.textContent?.includes('Sort'),
      );
      expect(trigger).toBeTruthy();
      return trigger as HTMLElement;
    });

    await userEvent.click(sortSubmenuTrigger);

    const sortAscItem = await waitFor(() => {
      const el = document.querySelector(
        '[data-value="sort-asc"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(sortAscItem);

    await waitFor(() => {
      expect(sortModel.isSorted('name')).toBe(true);
      expect(sortModel.getSortDirection('name')).toBe('asc');
    });
  },
};

export const HideColumn: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    expect(columnsModel.visibleColumns).toHaveLength(3);

    const ageHeader = canvas.getByTestId('header-age');
    await userEvent.click(ageHeader);

    const hideItem = await waitFor(() => {
      const el = document.querySelector('[data-value="hide"]') as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(hideItem);

    await waitFor(() => {
      expect(columnsModel.visibleColumns).toHaveLength(2);
      expect(columnsModel.visibleColumns.some((c) => c.field === 'age')).toBe(
        false,
      );
    });
  },
};

export const MoveColumnRight: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    expect(columnsModel.visibleColumns.map((c) => c.field)).toEqual([
      'name',
      'age',
      'active',
    ]);

    const nameHeader = canvas.getByTestId('header-name');
    await userEvent.click(nameHeader);

    const moveSubmenuTrigger = await waitFor(() => {
      const items = document.querySelectorAll('[role="menuitem"]');
      const trigger = Array.from(items).find((el) =>
        el.textContent?.includes('Move column'),
      );
      expect(trigger).toBeTruthy();
      return trigger as HTMLElement;
    });

    await userEvent.click(moveSubmenuTrigger);

    const moveRightItem = await waitFor(() => {
      const el = document.querySelector(
        '[data-value="move-right"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(moveRightItem);

    await waitFor(() => {
      expect(columnsModel.visibleColumns[0]?.field).toBe('age');
      expect(columnsModel.visibleColumns[1]?.field).toBe('name');
    });
  },
};

export const CopyPath: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const clipboard = mockClipboard();

    const ageHeader = canvas.getByTestId('header-age');
    await userEvent.click(ageHeader);

    const copyItem = await waitFor(() => {
      const el = document.querySelector(
        '[data-value="copy-path"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(copyItem);

    await waitFor(() => {
      expect(clipboard.getText()).toBe('age');
    });
  },
};
