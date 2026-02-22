import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { createTableStoryState, mockClipboard } from '../../helpers.js';
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

const MOCK_ROWS = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
];

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      dataSchema: TABLE_SCHEMA,
      rowsData: MOCK_ROWS,
      visibleFields: ['id', 'name', 'age', 'active'],
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
    <Box width="600px" height="400px">
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

async function dismissMenu() {
  await userEvent.keyboard('{Escape}');
  await waitFor(() => {
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });
}

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

    // Initial state: [id, name, age, active]
    expect(columnsModel.visibleColumns).toHaveLength(4);
    expect(columnsModel.visibleColumns.map((c) => c.field)).toEqual([
      'id',
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

      await dismissMenu();
    }

    // Step 2: Sort age descending
    // Columns still: [name, age, active]
    {
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

      await dismissMenu();
    }

    // Step 3: Copy path "name"
    // Columns still: [name, age, active]
    {
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

      await dismissMenu();
    }

    // Step 4: Add filter on "name"
    // Columns still: [name, age, active]
    {
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

      await dismissMenu();
    }

    // Step 5: Move name right
    // Columns before: [id, name, age, active] -> after: [id, age, name, active]
    {
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
          'id',
          'age',
          'name',
          'active',
        ]);
      });

      await dismissMenu();
    }

    // Step 6: Hide active
    // Columns before: [id, age, name, active] -> after: [id, age, name]
    {
      const activeHeader = canvas.getByTestId('header-active');
      await userEvent.click(activeHeader);

      const hideItem = await waitFor(() => {
        const el = document.querySelector('[data-value="hide"]') as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(hideItem);

      await waitFor(() => {
        expect(columnsModel.visibleColumns).toHaveLength(3);
        expect(
          columnsModel.visibleColumns.some((c) => c.field === 'active'),
        ).toBe(false);
      });

      await dismissMenu();
    }

    // Step 7: Insert active before age
    // Columns before: [id, age, name] -> after: [id, active, age, name]
    {
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
        expect(columnsModel.visibleColumns).toHaveLength(4);
        const fields = columnsModel.visibleColumns.map((c) => c.field);
        const ageIndex = fields.indexOf('age');
        const activeIndex = fields.indexOf('active');
        expect(activeIndex).toBeLessThan(ageIndex);
      });

      await dismissMenu();
    }

    // Step 8: Hide-all from active header
    // Columns before: [id, active, age, name] -> after: [id] (hideAll keeps first column)
    {
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
        expect(columnsModel.visibleColumns[0]?.field).toBe('id');
        expect(columnsModel.hasHiddenColumns).toBe(true);
      });

      await dismissMenu();
    }

    // Step 9: Verify last column hide/hide-all disabled
    // Columns: [id] (only one)
    {
      const idHeader = canvas.getByTestId('header-id');
      await userEvent.click(idHeader);

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

export const PinColumnWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    // Initial state: [id, name, age, active], none pinned
    expect(columnsModel.visibleColumns).toHaveLength(4);
    expect(columnsModel.isPinned('id')).toBe(false);
    expect(columnsModel.isPinned('name')).toBe(false);
    expect(columnsModel.isPinned('age')).toBe(false);
    expect(columnsModel.isPinned('active')).toBe(false);

    // Step 1: Pin 'name' to left
    {
      const nameHeader = canvas.getByTestId('header-name');
      await userEvent.click(nameHeader);

      const pinLeftItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="pin-left"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(pinLeftItem);

      await waitFor(() => {
        expect(columnsModel.isPinned('name')).toBe(true);
        expect(columnsModel.getPinState('name')).toBe('left');
      });

      await waitFor(() => {
        expect(canvas.getByTestId('pin-indicator-name')).toBeTruthy();
      });

      await dismissMenu();
    }

    // Step 2: Verify pinned column menu shows "Unpin" instead of pin options
    {
      const nameHeader = canvas.getByTestId('header-name');
      await userEvent.click(nameHeader);

      await waitFor(() => {
        const unpinItem = document.querySelector(
          '[data-value="unpin"]',
        ) as HTMLElement;
        expect(unpinItem).toBeTruthy();
      });

      await waitFor(() => {
        const pinLeftItem = document.querySelector('[data-value="pin-left"]');
        expect(pinLeftItem).toBeNull();
      });

      await waitFor(() => {
        const pinRightItem = document.querySelector('[data-value="pin-right"]');
        expect(pinRightItem).toBeNull();
      });

      await dismissMenu();
    }

    // Step 3: Pin 'active' to right
    {
      const activeHeader = canvas.getByTestId('header-active');
      await userEvent.click(activeHeader);

      const pinRightItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="pin-right"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(pinRightItem);

      await waitFor(() => {
        expect(columnsModel.getPinState('active')).toBe('right');
      });

      await dismissMenu();
    }

    // Step 4: Verify column order after pins (name pinned-left, active pinned-right)
    {
      await waitFor(() => {
        expect(columnsModel.visibleColumns.map((c) => c.field)).toEqual([
          'name',
          'id',
          'age',
          'active',
        ]);
      });
    }

    // Step 5: Unpin 'name'
    {
      const nameHeader = canvas.getByTestId('header-name');
      await userEvent.click(nameHeader);

      const unpinItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="unpin"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(unpinItem);

      await waitFor(() => {
        expect(columnsModel.isPinned('name')).toBe(false);
      });

      await waitFor(() => {
        expect(
          canvasElement.querySelector('[data-testid="pin-indicator-name"]'),
        ).toBeNull();
      });

      await dismissMenu();
    }

    // Step 6: Verify unpinned column menu shows pin options again
    {
      const nameHeader = canvas.getByTestId('header-name');
      await userEvent.click(nameHeader);

      await waitFor(() => {
        const pinLeftItem = document.querySelector('[data-value="pin-left"]');
        expect(pinLeftItem).toBeTruthy();
      });

      await waitFor(() => {
        const pinRightItem = document.querySelector('[data-value="pin-right"]');
        expect(pinRightItem).toBeTruthy();
      });

      await waitFor(() => {
        const unpinItem = document.querySelector('[data-value="unpin"]');
        expect(unpinItem).toBeNull();
      });

      await dismissMenu();
    }
  },
};
