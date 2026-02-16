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
import { FilterModel } from '../../../../../Filters/model/FilterModel.js';
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

export const SortDescending: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { sortModel } = (window as any).__testState as {
      sortModel: SortModel;
    };

    const ageHeader = canvas.getByTestId('header-age');
    await userEvent.click(ageHeader);

    const sortSubmenuTrigger = await waitFor(() => {
      const items = document.querySelectorAll('[role="menuitem"]');
      const trigger = Array.from(items).find((el) =>
        el.textContent?.includes('Sort'),
      );
      expect(trigger).toBeTruthy();
      return trigger as HTMLElement;
    });

    await userEvent.click(sortSubmenuTrigger);

    const sortDescItem = await waitFor(() => {
      const el = document.querySelector(
        '[data-value="sort-desc"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(sortDescItem);

    await waitFor(() => {
      expect(sortModel.isSorted('age')).toBe(true);
      expect(sortModel.getSortDirection('age')).toBe('desc');
    });
  },
};

export const AddFilter: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { filterModel } = (window as any).__testState as {
      filterModel: FilterModel;
    };

    expect(filterModel.isOpen).toBe(false);

    const nameHeader = canvas.getByTestId('header-name');
    await userEvent.click(nameHeader);

    const addFilterItem = await waitFor(() => {
      const el = document.querySelector(
        '[data-value="add-filter"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(addFilterItem);

    await waitFor(() => {
      expect(filterModel.isOpen).toBe(true);
      expect(filterModel.rootGroup.conditions).toHaveLength(1);
      expect(filterModel.rootGroup.conditions[0]?.field).toBe('name');
    });
  },
};

export const InsertColumnBefore: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    columnsModel.hideColumn('active');

    await waitFor(() => {
      expect(columnsModel.visibleColumns).toHaveLength(2);
    });

    const ageHeader = canvas.getByTestId('header-age');
    await userEvent.click(ageHeader);

    const insertBeforeTrigger = await waitFor(() => {
      const items = document.querySelectorAll('[role="menuitem"]');
      const trigger = Array.from(items).find((el) =>
        el.textContent?.includes('Insert before'),
      );
      expect(trigger).toBeTruthy();
      return trigger as HTMLElement;
    });

    await userEvent.click(insertBeforeTrigger);

    const activeItem = await waitFor(() => {
      const el = document.querySelector(
        '[data-value="before-active"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(activeItem);

    await waitFor(() => {
      expect(columnsModel.visibleColumns).toHaveLength(3);
      const fields = columnsModel.visibleColumns.map((c) => c.field);
      const ageIndex = fields.indexOf('age');
      const activeIndex = fields.indexOf('active');
      expect(activeIndex).toBeLessThan(ageIndex);
    });
  },
};

export const HideAllKeepsOneColumn: Story = {
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

    const nameHeader = canvas.getByTestId('header-name');
    await userEvent.click(nameHeader);

    const hideAllItem = await waitFor(() => {
      const el = document.querySelector(
        '[data-value="hide-all"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(hideAllItem);

    await waitFor(() => {
      expect(columnsModel.visibleColumns).toHaveLength(1);
      expect(columnsModel.visibleColumns[0]?.field).toBe('name');
      expect(columnsModel.hasHiddenColumns).toBe(true);
    });
  },
};

export const LastColumnHideDisabled: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    columnsModel.hideColumn('age');
    columnsModel.hideColumn('active');

    await waitFor(() => {
      expect(columnsModel.visibleColumns).toHaveLength(1);
    });

    const nameHeader = canvas.getByTestId('header-name');
    await userEvent.click(nameHeader);

    await waitFor(() => {
      const hideItem = document.querySelector(
        '[data-value="hide"]',
      ) as HTMLElement;
      expect(hideItem).toBeTruthy();
      expect(hideItem.hasAttribute('data-disabled')).toBe(true);
    });

    await waitFor(() => {
      const hideAllItem = document.querySelector(
        '[data-value="hide-all"]',
      ) as HTMLElement;
      expect(hideAllItem).toBeTruthy();
      expect(hideAllItem.hasAttribute('data-disabled')).toBe(true);
    });
  },
};

export const InsertColumnAfter: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    columnsModel.hideColumn('active');

    await waitFor(() => {
      expect(columnsModel.visibleColumns).toHaveLength(2);
    });

    const nameHeader = canvas.getByTestId('header-name');
    await userEvent.click(nameHeader);

    const insertAfterTrigger = await waitFor(() => {
      const items = document.querySelectorAll('[role="menuitem"]');
      const trigger = Array.from(items).find((el) =>
        el.textContent?.includes('Insert after'),
      );
      expect(trigger).toBeTruthy();
      return trigger as HTMLElement;
    });

    await userEvent.click(insertAfterTrigger);

    const activeItem = await waitFor(() => {
      const el = document.querySelector(
        '[data-value="after-active"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(activeItem);

    await waitFor(() => {
      expect(columnsModel.visibleColumns).toHaveLength(3);
      const fields = columnsModel.visibleColumns.map((c) => c.field);
      const nameIndex = fields.indexOf('name');
      const activeIndex = fields.indexOf('active');
      expect(activeIndex).toBe(nameIndex + 1);
    });
  },
};
