import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import type { Meta, StoryObj } from '@storybook/react';
import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { expect, within, waitFor } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  createTableStoryState,
  createTableEditorStoryState,
  type TableStoryState,
  type TableEditorStoryState,
} from '../../helpers.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';
import { TableEditor } from '../../../TableEditor/ui/TableEditor.js';

ensureReactivityProvider();

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
  email: str(),
  score: num(),
});

const MOCK_ROWS = [
  { name: 'Alice', age: 30, active: true, email: 'alice@test.com', score: 95 },
  { name: 'Bob', age: 25, active: false, email: 'bob@test.com', score: 80 },
];

const COLUMN_WIDTH = 200;
const CONTAINER_WIDTH = 600;

function createPinnedLeftState(): TableStoryState {
  const s = createTableStoryState({
    dataSchema: TABLE_SCHEMA,
    rowsData: MOCK_ROWS,
  });
  runInAction(() => {
    for (const c of s.columnsModel.visibleColumns) {
      s.columnsModel.setColumnWidth(c.field, COLUMN_WIDTH);
    }
    s.columnsModel.pinLeft('name');
  });
  return s;
}

function createPinnedRightState(): TableStoryState {
  const s = createTableStoryState({
    dataSchema: TABLE_SCHEMA,
    rowsData: MOCK_ROWS,
  });
  runInAction(() => {
    for (const c of s.columnsModel.visibleColumns) {
      s.columnsModel.setColumnWidth(c.field, COLUMN_WIDTH);
    }
    s.columnsModel.pinRight('score');
  });
  return s;
}

function createAddColumnOnlyState(): TableStoryState {
  const s = createTableStoryState({
    dataSchema: TABLE_SCHEMA,
    rowsData: MOCK_ROWS,
    visibleFields: ['name', 'age', 'active', 'score'],
  });
  runInAction(() => {
    for (const c of s.columnsModel.visibleColumns) {
      s.columnsModel.setColumnWidth(c.field, COLUMN_WIDTH);
    }
  });
  return s;
}

const PinnedLeftWrapper = observer(() => {
  const [state] = useState(createPinnedLeftState);
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

const PinnedRightWrapper = observer(() => {
  const [state] = useState(createPinnedRightState);
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

const AddColumnOnlyWrapper = observer(() => {
  const [state] = useState(createAddColumnOnlyState);
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

const meta: Meta<typeof PinnedLeftWrapper> = {
  component: PinnedLeftWrapper as any,
  title: 'TableEditor/E2E/Table/ScrollShadow',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof PinnedLeftWrapper>;

function findScroller(canvasElement: HTMLElement): HTMLElement | null {
  const widget = canvasElement.querySelector('[data-testid="table-widget"]');
  if (!widget) {
    return null;
  }
  return widget.querySelector('[data-virtuoso-scroller]');
}

function getAfterOpacity(el: Element): number {
  return parseFloat(window.getComputedStyle(el, '::after').opacity);
}

export const PinnedLeftShadowOnScroll: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableStoryState;

    expect(state.columnsModel.isPinned('name')).toBe(true);

    const scroller = findScroller(canvasElement);
    expect(scroller).toBeTruthy();

    await waitFor(() => {
      expect(scroller!.scrollWidth).toBeGreaterThan(scroller!.clientWidth);
    });

    const nameHeaderTh = canvas
      .getByTestId('header-name')
      .closest('th') as HTMLElement;
    const nameDataTd = canvas
      .getByTestId('cell-row-1-name')
      .closest('td') as HTMLElement;

    expect(getAfterOpacity(nameHeaderTh)).toBe(0);
    expect(getAfterOpacity(nameDataTd)).toBe(0);

    scroller!.scrollLeft = 150;
    await new Promise((r) => setTimeout(r, 200));

    await waitFor(() => {
      expect(scroller!.scrollLeft).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(getAfterOpacity(nameHeaderTh)).toBe(1);
    });
    expect(getAfterOpacity(nameDataTd)).toBe(1);
  },
};

export const PinnedRightShadowOnScroll: Story = {
  tags: ['test'],
  render: () => <PinnedRightWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableStoryState;

    expect(state.columnsModel.isPinned('score')).toBe(true);

    const scroller = findScroller(canvasElement);
    expect(scroller).toBeTruthy();

    await waitFor(() => {
      expect(scroller!.scrollWidth).toBeGreaterThan(scroller!.clientWidth);
    });

    const scoreHeaderTh = canvas
      .getByTestId('header-score')
      .closest('th') as HTMLElement;
    const scoreDataTd = canvas
      .getByTestId('cell-row-1-score')
      .closest('td') as HTMLElement;

    expect(scroller!.scrollLeft).toBe(0);

    await waitFor(() => {
      expect(getAfterOpacity(scoreHeaderTh)).toBe(1);
    });
    expect(getAfterOpacity(scoreDataTd)).toBe(1);

    const maxScroll = scroller!.scrollWidth - scroller!.clientWidth;
    scroller!.scrollLeft = maxScroll;
    await new Promise((r) => setTimeout(r, 200));

    await waitFor(() => {
      expect(scroller!.scrollLeft).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(getAfterOpacity(scoreHeaderTh)).toBe(0);
    });
    expect(getAfterOpacity(scoreDataTd)).toBe(0);
  },
};

export const AddColumnShadowOnScroll: Story = {
  tags: ['test'],
  render: () => <AddColumnOnlyWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableStoryState;

    expect(state.columnsModel.hasHiddenColumns).toBe(true);
    expect(state.columnsModel.pinnedRightCount).toBe(0);

    const addBtn = canvas.getByTestId('add-column-button');
    expect(addBtn).toBeVisible();

    const scroller = findScroller(canvasElement);
    expect(scroller).toBeTruthy();

    await waitFor(() => {
      expect(scroller!.scrollWidth).toBeGreaterThan(scroller!.clientWidth);
    });

    const addColumnHeaderTh = addBtn.closest('th') as HTMLElement;
    const tableWidget = canvas.getByTestId('table-widget');
    const dataRows = tableWidget.querySelectorAll('tbody tr');
    const firstRowTds = dataRows[0]?.querySelectorAll('td');
    const addColumnDataTd = firstRowTds
      ? firstRowTds[firstRowTds.length - 1]
      : null;
    expect(addColumnDataTd).toBeTruthy();

    expect(scroller!.scrollLeft).toBe(0);

    await waitFor(() => {
      expect(getAfterOpacity(addColumnHeaderTh)).toBe(1);
    });
    expect(getAfterOpacity(addColumnDataTd!)).toBe(1);

    const maxScroll = scroller!.scrollWidth - scroller!.clientWidth;
    scroller!.scrollLeft = maxScroll;
    await new Promise((r) => setTimeout(r, 200));

    await waitFor(() => {
      expect(scroller!.scrollLeft).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(getAfterOpacity(addColumnHeaderTh)).toBe(0);
    });
    expect(getAfterOpacity(addColumnDataTd!)).toBe(0);
  },
};

const WindowScrollPinnedWrapper = observer(() => {
  const [state] = useState(() => {
    const s = createTableEditorStoryState({
      dataSchema: TABLE_SCHEMA,
      rowsData: MOCK_ROWS,
      callbacks: {},
    });
    return s;
  });
  useEffect(() => {
    (window as any).__testEditorState = state;
    return () => {
      delete (window as any).__testEditorState;
    };
  }, [state]);

  return (
    <Box width={`${CONTAINER_WIDTH}px`}>
      <TableEditor viewModel={state.core} useWindowScroll />
    </Box>
  );
});

export const WindowScrollShadowOnScroll: Story = {
  tags: ['test'],
  render: () => <WindowScrollPinnedWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testEditorState).toBeDefined();
    });
    const state = (window as any).__testEditorState as TableEditorStoryState;

    await waitFor(() => {
      expect(state.core.columns.visibleColumns.length).toBeGreaterThan(0);
    });

    runInAction(() => {
      for (const c of state.core.columns.visibleColumns) {
        state.core.columns.setColumnWidth(c.field, COLUMN_WIDTH);
      }
      state.core.columns.pinLeft('name');
    });

    const tableWidget = canvas.getByTestId('table-widget');

    await waitFor(() => {
      expect(tableWidget.scrollWidth).toBeGreaterThan(tableWidget.clientWidth);
    });

    const nameHeaderTh = canvas
      .getByTestId('header-name')
      .closest('th') as HTMLElement;
    const nameDataTd = canvas
      .getByTestId('cell-row-1-name')
      .closest('td') as HTMLElement;

    await waitFor(() => {
      expect(getAfterOpacity(nameHeaderTh)).toBe(0);
    });
    expect(getAfterOpacity(nameDataTd)).toBe(0);

    tableWidget.scrollLeft = 150;
    await new Promise((r) => setTimeout(r, 200));

    await waitFor(() => {
      expect(tableWidget.scrollLeft).toBeGreaterThan(0);
    });

    await waitFor(() => {
      expect(getAfterOpacity(nameHeaderTh)).toBe(1);
    });
    expect(getAfterOpacity(nameDataTd)).toBe(1);
  },
};

const NARROW_COLUMN_WIDTH = 100;

function createResizableAddColumnState(): TableStoryState {
  const s = createTableStoryState({
    dataSchema: TABLE_SCHEMA,
    rowsData: MOCK_ROWS,
    visibleFields: ['name', 'age', 'active', 'score'],
  });
  runInAction(() => {
    for (const c of s.columnsModel.visibleColumns) {
      s.columnsModel.setColumnWidth(c.field, NARROW_COLUMN_WIDTH);
    }
  });
  return s;
}

const ResizableAddColumnWrapper = observer(() => {
  const [state] = useState(createResizableAddColumnState);
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

export const AddColumnShadowAfterResize: Story = {
  tags: ['test'],
  render: () => <ResizableAddColumnWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableStoryState;

    expect(state.columnsModel.hasHiddenColumns).toBe(true);
    expect(state.columnsModel.pinnedRightCount).toBe(0);

    const addBtn = canvas.getByTestId('add-column-button');
    const addColumnHeaderTh = addBtn.closest('th') as HTMLElement;

    const scroller = findScroller(canvasElement);
    expect(scroller).toBeTruthy();

    await waitFor(() => {
      expect(scroller!.scrollWidth).toBeLessThanOrEqual(scroller!.clientWidth);
    });

    await waitFor(() => {
      expect(getAfterOpacity(addColumnHeaderTh)).toBe(0);
    });

    runInAction(() => {
      for (const c of state.columnsModel.visibleColumns) {
        state.columnsModel.setColumnWidth(c.field, COLUMN_WIDTH);
      }
    });

    await waitFor(() => {
      expect(scroller!.scrollWidth).toBeGreaterThan(scroller!.clientWidth);
    });

    await waitFor(() => {
      expect(getAfterOpacity(addColumnHeaderTh)).toBe(1);
    });
  },
};
