import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { obj, str, num, bool } from '@revisium/schema-toolkit';
import {
  col,
  createTableStoryState,
  FilterFieldType,
  mockClipboard,
} from '../../helpers.js';
import { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';
import { SortModel } from '../../../Sortings/model/SortModel.js';
import { FilterModel } from '../../../Filters/model/FilterModel.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';

ensureReactivityProvider();

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
});

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
  title: 'TableEditor/E2E/Header/ColumnHeaderMenu',
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

export const FullHeaderMenuWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const clipboard = mockClipboard();

    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { sortModel, columnsModel, filterModel } = (window as any)
      .__testState as {
      sortModel: SortModel;
      columnsModel: ColumnsModel;
      filterModel: FilterModel;
    };

    // Initial state: [name, age, active]
    expect(columnsModel.visibleColumns).toHaveLength(3);
    expect(columnsModel.visibleColumns.map((c) => c.field)).toEqual([
      'name',
      'age',
      'active',
    ]);

    // Step 1: Sort name ascending
    {
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
    }

    // Step 2: Sort age descending
    // Columns still: [name, age, active]
    {
      await waitFor(() => {
        expect(document.querySelector('[data-value="sort-asc"]')).toBeNull();
      });

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
    }

    // Step 3: Copy path "name"
    // Columns still: [name, age, active]
    {
      await waitFor(() => {
        expect(document.querySelector('[data-value="sort-desc"]')).toBeNull();
      });

      const nameHeader = canvas.getByTestId('header-name');
      await userEvent.click(nameHeader);

      const copyItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="copy-path"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(copyItem);

      await waitFor(() => {
        expect(clipboard.getText()).toBe('name');
      });
    }

    // Step 4: Add filter on "name"
    // Columns still: [name, age, active]
    {
      await waitFor(() => {
        expect(document.querySelector('[data-value="copy-path"]')).toBeNull();
      });

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
    }

    // Step 5: Move name right
    // Columns before: [name, age, active] -> after: [age, name, active]
    {
      await waitFor(() => {
        expect(document.querySelector('[data-value="add-filter"]')).toBeNull();
      });

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
        expect(columnsModel.visibleColumns.map((c) => c.field)).toEqual([
          'age',
          'name',
          'active',
        ]);
      });
    }

    // Step 6: Hide active
    // Columns before: [age, name, active] -> after: [age, name]
    {
      await waitFor(() => {
        expect(document.querySelector('[data-value="move-right"]')).toBeNull();
      });

      const activeHeader = canvas.getByTestId('header-active');
      await userEvent.click(activeHeader);

      const hideItem = await waitFor(() => {
        const el = document.querySelector('[data-value="hide"]') as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(hideItem);

      await waitFor(() => {
        expect(columnsModel.visibleColumns).toHaveLength(2);
        expect(
          columnsModel.visibleColumns.some((c) => c.field === 'active'),
        ).toBe(false);
      });
    }

    // Step 7: Insert active before age
    // Columns before: [age, name] -> after: [active, age, name]
    {
      await waitFor(() => {
        expect(document.querySelector('[data-value="hide"]')).toBeNull();
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
    }

    // Step 8: Hide-all from active header
    // Columns before: [active, age, name] -> after: [active]
    {
      await waitFor(() => {
        expect(
          document.querySelector('[data-value="before-active"]'),
        ).toBeNull();
      });

      const activeHeader = canvas.getByTestId('header-active');
      await userEvent.click(activeHeader);

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
        expect(columnsModel.visibleColumns[0]?.field).toBe('active');
        expect(columnsModel.hasHiddenColumns).toBe(true);
      });
    }

    // Step 9: Verify last column hide/hide-all disabled
    // Columns: [active] (only one)
    {
      await waitFor(() => {
        expect(document.querySelector('[data-value="hide"]')).toBeNull();
      });

      const activeHeader = canvas.getByTestId('header-active');
      await userEvent.click(activeHeader);

      await waitFor(() => {
        const hideItem = document.querySelector(
          '[data-value="hide"]',
        ) as HTMLElement;
        expect(hideItem).toBeTruthy();
        expect(hideItem).toHaveAttribute('data-disabled');
      });

      await waitFor(() => {
        const hideAllItem = document.querySelector(
          '[data-value="hide-all"]',
        ) as HTMLElement;
        expect(hideAllItem).toBeTruthy();
        expect(hideAllItem).toHaveAttribute('data-disabled');
      });
    }
  },
};
