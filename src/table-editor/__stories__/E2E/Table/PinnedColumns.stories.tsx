import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent, fn } from 'storybook/test';
import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { col, createTableStoryState, FilterFieldType } from '../../helpers.js';
import { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';

ensureReactivityProvider();

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
  email: str(),
  score: num(),
});

const ALL_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
  col('email', FilterFieldType.String),
  col('score', FilterFieldType.Number),
];

const MOCK_ROWS = [
  { name: 'Alice', age: 30, active: true, email: 'alice@test.com', score: 95 },
  { name: 'Bob', age: 25, active: false, email: 'bob@test.com', score: 80 },
  {
    name: 'Charlie',
    age: 35,
    active: true,
    email: 'charlie@test.com',
    score: 70,
  },
];

const mockOpenRow = fn();
const mockDeleteRow = fn();

function createPinnedColumnsState() {
  const state = createTableStoryState({
    schema: TABLE_SCHEMA,
    columns: ALL_COLUMNS,
    rowsData: MOCK_ROWS,
  });

  runInAction(() => {
    for (const col of ALL_COLUMNS) {
      state.columnsModel.setColumnWidth(col.field, 200);
    }
  });

  return state;
}

const StoryWrapper = observer(() => {
  const [state] = useState(() => createPinnedColumnsState());

  useEffect(() => {
    (window as any).__testState = {
      ...state,
      mockOpenRow,
      mockDeleteRow,
    };
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
        onOpenRow={mockOpenRow}
        onDeleteRow={mockDeleteRow}
      />
    </Box>
  );
});

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/E2E/Table/PinnedColumns',
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

export const PinViaHeaderMenu: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    // Step 1: Pin 'name' to left via header menu
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
        const indicator = document.querySelector(
          '[data-testid="pin-indicator-name"]',
        );
        expect(indicator).toBeTruthy();
      });

      await dismissMenu();
    }

    // Step 2: Pin 'score' to right via header menu
    {
      const scoreHeader = canvas.getByTestId('header-score');
      await userEvent.click(scoreHeader);

      const pinRightItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="pin-right"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(pinRightItem);

      await waitFor(() => {
        expect(columnsModel.isPinned('score')).toBe(true);
        expect(columnsModel.getPinState('score')).toBe('right');
      });

      await waitFor(() => {
        const indicator = document.querySelector(
          '[data-testid="pin-indicator-score"]',
        );
        expect(indicator).toBeTruthy();
      });

      await dismissMenu();
    }

    // Step 3: Unpin 'name' via header menu -- verify "Unpin column" shown
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

      await waitFor(() => {
        expect(document.querySelector('[data-value="pin-left"]')).toBeNull();
        expect(document.querySelector('[data-value="pin-right"]')).toBeNull();
      });

      await userEvent.click(unpinItem);

      await waitFor(() => {
        expect(columnsModel.isPinned('name')).toBe(false);
      });

      await waitFor(() => {
        const indicator = document.querySelector(
          '[data-testid="pin-indicator-name"]',
        );
        expect(indicator).toBeNull();
      });

      await dismissMenu();
    }

    // Step 4: Open header menu on unpinned column -- verify both pin options visible
    {
      const ageHeader = canvas.getByTestId('header-age');
      await userEvent.click(ageHeader);

      await waitFor(() => {
        const pinLeft = document.querySelector(
          '[data-value="pin-left"]',
        ) as HTMLElement;
        const pinRight = document.querySelector(
          '[data-value="pin-right"]',
        ) as HTMLElement;
        expect(pinLeft).toBeTruthy();
        expect(pinRight).toBeTruthy();
      });

      await dismissMenu();
    }
  },
};

export const PinAndHideColumn: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    // Pin 'name' to left
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
      });

      await dismissMenu();
    }

    // Hide 'name' via header menu
    {
      const nameHeader = canvas.getByTestId('header-name');
      await userEvent.click(nameHeader);

      const hideItem = await waitFor(() => {
        const el = document.querySelector('[data-value="hide"]') as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(hideItem);

      await waitFor(() => {
        expect(columnsModel.isPinned('name')).toBe(false);
        expect(
          columnsModel.visibleColumns.some((c) => c.field === 'name'),
        ).toBe(false);
      });

      await dismissMenu();
    }
  },
};

export const PinAndMoveRestrictions: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    // Pin 'name' to left
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

      await dismissMenu();
    }

    // Pin 'score' to right
    {
      const scoreHeader = canvas.getByTestId('header-score');
      await userEvent.click(scoreHeader);

      const pinRightItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="pin-right"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(pinRightItem);

      await waitFor(() => {
        expect(columnsModel.isPinned('score')).toBe(true);
        expect(columnsModel.getPinState('score')).toBe('right');
      });

      await dismissMenu();
    }

    // After pinning: visible order is [name(pinned-L), age, active, email, score(pinned-R)]
    // 'age' is the first unpinned column -- canMoveLeft should be false
    {
      await waitFor(() => {
        expect(columnsModel.canMoveLeft('age')).toBe(false);
      });

      const ageHeader = canvas.getByTestId('header-age');
      await userEvent.click(ageHeader);

      const moveSubmenuTrigger = await waitFor(() => {
        const items = document.querySelectorAll('[role="menuitem"]');
        const trigger = Array.from(items).find((el) =>
          el.textContent?.includes('Move column'),
        );
        expect(trigger).toBeTruthy();
        return trigger as HTMLElement;
      });

      await userEvent.click(moveSubmenuTrigger);

      await waitFor(() => {
        const moveLeft = document.querySelector('[data-value="move-left"]');
        expect(moveLeft).toBeNull();
      });

      await dismissMenu();
    }

    // 'email' is the last unpinned column -- canMoveRight should be false
    {
      await waitFor(() => {
        expect(columnsModel.canMoveRight('email')).toBe(false);
      });

      const emailHeader = canvas.getByTestId('header-email');
      await userEvent.click(emailHeader);

      const moveSubmenuTrigger = await waitFor(() => {
        const items = document.querySelectorAll('[role="menuitem"]');
        const trigger = Array.from(items).find((el) =>
          el.textContent?.includes('Move column'),
        );
        expect(trigger).toBeTruthy();
        return trigger as HTMLElement;
      });

      await userEvent.click(moveSubmenuTrigger);

      await waitFor(() => {
        const moveRight = document.querySelector('[data-value="move-right"]');
        expect(moveRight).toBeNull();
      });

      await dismissMenu();
    }
  },
};

export const PinAndCellEditing: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    // Pin 'name' to left
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
      });

      await dismissMenu();
    }

    // Double-click on cell-row-1-name to enter editing mode
    {
      const nameCell = canvas.getByTestId('cell-row-1-name');
      await userEvent.dblClick(nameCell);

      const input = await waitFor(() => {
        const el = document.querySelector(
          '[data-testid="string-cell-input"]',
        ) as HTMLTextAreaElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.clear(input);
      await userEvent.type(input, 'Updated Alice');
      input.blur();

      await waitFor(() => {
        expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent(
          'Updated Alice',
        );
      });
    }
  },
};

export const SplitButtonOnPinnedColumn: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    mockOpenRow.mockClear();

    // Pin 'name' to left
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
      });

      await dismissMenu();
    }

    // Hover first data row to show split button
    {
      const row = canvas.getByTestId('row-row-1');
      await userEvent.hover(row);

      const openBtn = await waitFor(() => {
        const el = canvas.getByTestId('row-action-open-row-1');
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(openBtn);

      await waitFor(() => {
        expect(mockOpenRow).toHaveBeenCalledWith('row-1');
      });
    }

    // Open the menu trigger
    {
      const row = canvas.getByTestId('row-row-1');
      await userEvent.hover(row);

      const trigger = await waitFor(() => {
        const el = canvas.getByTestId('row-action-trigger-row-1');
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(trigger);

      await waitFor(() => {
        const menu = document.querySelector(
          '[data-testid="row-action-menu-row-1"]',
        );
        expect(menu).toBeTruthy();
      });

      await dismissMenu();
    }
  },
};

function findScroller(canvasElement: HTMLElement): HTMLElement | null {
  const widget = canvasElement.querySelector('[data-testid="table-widget"]');
  if (!widget) {
    return null;
  }
  return widget.querySelector('[data-virtuoso-scroller]');
}

export const StickyPositionAfterScroll: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { columnsModel } = (window as any).__testState as {
      columnsModel: ColumnsModel;
    };

    // Hide 'email' so + button appears
    {
      const emailHeader = canvas.getByTestId('header-email');
      await userEvent.click(emailHeader);

      const hideItem = await waitFor(() => {
        const el = document.querySelector('[data-value="hide"]') as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(hideItem);
      await waitFor(() => {
        expect(columnsModel.hasHiddenColumns).toBe(true);
      });
      await dismissMenu();
    }

    // Pin 'score' to right
    {
      const scoreHeader = canvas.getByTestId('header-score');
      await userEvent.click(scoreHeader);

      const pinRightItem = await waitFor(() => {
        const el = document.querySelector(
          '[data-value="pin-right"]',
        ) as HTMLElement;
        expect(el).toBeTruthy();
        return el;
      });

      await userEvent.click(pinRightItem);
      await waitFor(() => {
        expect(columnsModel.isPinned('score')).toBe(true);
      });
      await dismissMenu();
    }

    // Pin 'name' to left
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
      });
      await dismissMenu();
    }

    // Find scroller and verify it can scroll
    const scroller = findScroller(canvasElement);
    expect(scroller).toBeTruthy();

    await waitFor(() => {
      expect(scroller!.scrollWidth).toBeGreaterThan(scroller!.clientWidth);
    });

    // Capture positions BEFORE scroll
    const scoreHeaderTh = canvas.getByTestId('header-score').closest('th');
    const nameHeaderTh = canvas.getByTestId('header-name').closest('th');
    const addBtn = canvas.getByTestId('add-column-button');
    const addBtnTh = addBtn.closest('th');
    const scoreCells = canvasElement.querySelectorAll(
      '[data-testid^="cell-"][data-testid$="-score"]',
    );
    const nameCells = canvasElement.querySelectorAll(
      '[data-testid^="cell-"][data-testid$="-name"]',
    );

    // Find addColumn <td> cells in data rows — the last <td> in each <tr> within tbody
    const dataRows = canvasElement.querySelectorAll('tbody tr');
    const addColDataCells: HTMLTableCellElement[] = [];
    dataRows.forEach((tr) => {
      const tds = tr.querySelectorAll('td');
      if (tds.length > 0) {
        addColDataCells.push(tds[tds.length - 1]);
      }
    });

    expect(scoreHeaderTh).toBeTruthy();
    expect(nameHeaderTh).toBeTruthy();
    expect(addBtnTh).toBeTruthy();
    expect(scoreCells.length).toBeGreaterThan(0);
    expect(nameCells.length).toBeGreaterThan(0);
    expect(addColDataCells.length).toBeGreaterThan(0);

    const beforeScoreHeaderRight = scoreHeaderTh!.getBoundingClientRect().right;
    const beforeNameHeaderLeft = nameHeaderTh!.getBoundingClientRect().left;
    const beforeAddBtnThRight = addBtnTh!.getBoundingClientRect().right;
    const beforeScoreCellRight = scoreCells[0]!.getBoundingClientRect().right;
    const beforeNameCellLeft = nameCells[0]!.getBoundingClientRect().left;
    const beforeAddColDataCellRight =
      addColDataCells[0]!.getBoundingClientRect().right;

    // Scroll right by 150px
    scroller!.scrollLeft = 150;
    await new Promise((r) => setTimeout(r, 200));

    // Verify scroll actually happened
    await waitFor(() => {
      expect(scroller!.scrollLeft).toBeGreaterThan(0);
    });

    // Capture positions AFTER scroll
    const afterScoreHeaderRight = scoreHeaderTh!.getBoundingClientRect().right;
    const afterNameHeaderLeft = nameHeaderTh!.getBoundingClientRect().left;
    const afterAddBtnThRight = addBtnTh!.getBoundingClientRect().right;
    const afterScoreCellRight = scoreCells[0]!.getBoundingClientRect().right;
    const afterNameCellLeft = nameCells[0]!.getBoundingClientRect().left;
    const afterAddColDataCellRight =
      addColDataCells[0]!.getBoundingClientRect().right;

    // Sticky elements should stay at the SAME screen position (within 2px tolerance)
    // Left-pinned header
    expect(Math.abs(afterNameHeaderLeft - beforeNameHeaderLeft)).toBeLessThan(
      2,
    );
    // Left-pinned data cell
    expect(Math.abs(afterNameCellLeft - beforeNameCellLeft)).toBeLessThan(2);
    // Right-pinned header
    expect(
      Math.abs(afterScoreHeaderRight - beforeScoreHeaderRight),
    ).toBeLessThan(2);
    // Right-pinned data cell
    expect(Math.abs(afterScoreCellRight - beforeScoreCellRight)).toBeLessThan(
      2,
    );
    // + button header <th>
    expect(Math.abs(afterAddBtnThRight - beforeAddBtnThRight)).toBeLessThan(2);
    // Data row <td> under + button header — must stay aligned
    expect(
      Math.abs(afterAddColDataCellRight - beforeAddColDataCellRight),
    ).toBeLessThan(2);
  },
};
