import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import type { Meta, StoryObj } from '@storybook/react';
import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { expect, waitFor } from 'storybook/test';
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
  notes: str(),
});

const MOCK_ROWS = [
  {
    name: 'Alice',
    age: 30,
    active: true,
    email: 'alice@test.com',
    score: 95,
    notes: 'first',
  },
  {
    name: 'Bob',
    age: 25,
    active: false,
    email: 'bob@test.com',
    score: 80,
    notes: 'second',
  },
  {
    name: 'Carol',
    age: 35,
    active: true,
    email: 'carol@test.com',
    score: 88,
    notes: 'third',
  },
  {
    name: 'Diana',
    age: 28,
    active: true,
    email: 'diana@test.com',
    score: 72,
    notes: 'fourth',
  },
  {
    name: 'Eve',
    age: 22,
    active: false,
    email: 'eve@test.com',
    score: 91,
    notes: 'fifth',
  },
];

const COLUMN_WIDTH = 200;
const CONTAINER_WIDTH = 600;

function createState(): TableStoryState {
  const s = createTableStoryState({
    dataSchema: TABLE_SCHEMA,
    rowsData: MOCK_ROWS,
  });
  runInAction(() => {
    for (const c of s.columnsModel.visibleColumns) {
      s.columnsModel.setColumnWidth(c.field, COLUMN_WIDTH);
    }
    s.columnsModel.commitColumnWidth();
    s.columnsModel.pinLeft('data.name');
  });
  return s;
}

const PerfWrapper = observer(() => {
  const [state] = useState(createState);
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

const meta: Meta<typeof PerfWrapper> = {
  component: PerfWrapper as any,
  title: 'TableEditor/E2E/Table/ResizePerf',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof PerfWrapper>;

interface MutationLog {
  wrapperStyleMutations: number;
  subtreeAttributeMutations: number;
  subtreeChildListMutations: number;
}

function observeMutations(target: HTMLElement): {
  log: MutationLog;
  reset: () => void;
  disconnect: () => void;
} {
  const log: MutationLog = {
    wrapperStyleMutations: 0,
    subtreeAttributeMutations: 0,
    subtreeChildListMutations: 0,
  };

  const wrapperObs = new MutationObserver((mutations) => {
    log.wrapperStyleMutations += mutations.length;
  });
  wrapperObs.observe(target, {
    attributes: true,
    attributeFilter: ['style'],
    subtree: false,
  });

  const subtreeObs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'attributes') {
        log.subtreeAttributeMutations++;
      }
      if (m.type === 'childList') {
        log.subtreeChildListMutations++;
      }
    }
  });
  subtreeObs.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
  });

  const reset = () => {
    log.wrapperStyleMutations = 0;
    log.subtreeAttributeMutations = 0;
    log.subtreeChildListMutations = 0;
  };

  return {
    log,
    reset,
    disconnect: () => {
      wrapperObs.disconnect();
      subtreeObs.disconnect();
    },
  };
}

async function waitForState(): Promise<TableStoryState> {
  await waitFor(() => {
    if (!(window as any).__testState) {
      throw new Error('waiting');
    }
  });
  return (window as any).__testState as TableStoryState;
}

function getTableWidget(canvasElement: HTMLElement): HTMLElement {
  return canvasElement.querySelector(
    '[data-testid="table-widget"]',
  ) as HTMLElement;
}

async function waitForOverflow(
  canvasElement: HTMLElement,
): Promise<HTMLElement> {
  const tableWidget = getTableWidget(canvasElement);
  const scroller = tableWidget.querySelector(
    '[data-virtuoso-scroller]',
  ) as HTMLElement;
  await waitFor(() => {
    expect(scroller.scrollWidth).toBeGreaterThan(scroller.clientWidth);
  });
  return scroller;
}

// --- Test 1: Column resize produces only imperative style mutations ---

export const ColumnResizeMutations: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const state = await waitForState();
    const tableWidget = getTableWidget(canvasElement);
    await waitForOverflow(canvasElement);

    const { log, reset, disconnect } = observeMutations(tableWidget);

    // Simulate drag: 11 steps, 200 → 300
    for (let i = 0; i < 11; i++) {
      runInAction(() => {
        state.columnsModel.setColumnWidth('data.name', 200 + i * 10);
      });
    }
    await new Promise((r) => setTimeout(r, 100));

    // During drag: only imperative style.setProperty mutations on wrapper
    // Each setColumnWidth → 1 wrapper style mutation via element.style.setProperty
    // No DOM node additions/removals
    expect(log.wrapperStyleMutations).toBeLessThanOrEqual(11);
    expect(log.subtreeChildListMutations).toBe(0);

    reset();

    // Commit: React sees values already match → 0 mutations
    runInAction(() => {
      state.columnsModel.commitColumnWidth();
    });
    await new Promise((r) => setTimeout(r, 300));

    expect(log.wrapperStyleMutations).toBe(0);
    expect(log.subtreeChildListMutations).toBe(0);

    disconnect();
  },
};

// --- Test 2: Shadow toggle produces minimal wrapper style mutations ---

export const ShadowToggleMutations: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    await waitForState();
    const tableWidget = getTableWidget(canvasElement);
    const scroller = await waitForOverflow(canvasElement);

    // Let initial shadow settle
    await new Promise((r) => setTimeout(r, 300));

    const { log, reset, disconnect } = observeMutations(tableWidget);

    // Scroll right → left shadow appears (--shadow-left-opacity: 0 → 1)
    scroller.scrollLeft = 150;
    await new Promise((r) => setTimeout(r, 300));

    expect(log.wrapperStyleMutations).toBe(1);
    expect(log.subtreeChildListMutations).toBe(0);

    reset();

    // Scroll back → left shadow disappears
    scroller.scrollLeft = 0;
    await new Promise((r) => setTimeout(r, 300));

    expect(log.wrapperStyleMutations).toBe(1);
    expect(log.subtreeChildListMutations).toBe(0);

    reset();

    // Scroll to end → both vars change (left 0→1, right 1→0)
    scroller.scrollLeft = scroller.scrollWidth - scroller.clientWidth;
    await new Promise((r) => setTimeout(r, 300));

    expect(log.wrapperStyleMutations).toBe(2);
    expect(log.subtreeChildListMutations).toBe(0);

    disconnect();
  },
};

// --- Test 3: Range selection only mutates affected cells ---

export const RangeSelectionMutations: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const state = await waitForState();
    const tableWidget = getTableWidget(canvasElement);
    await waitForOverflow(canvasElement);
    await new Promise((r) => setTimeout(r, 300));

    const { log, reset, disconnect } = observeMutations(tableWidget);

    // Focus cell → only the focused cell gets attribute changes
    runInAction(() => {
      state.cellFSM.focusCell({ rowId: 'row-1', field: 'data.name' });
    });
    await new Promise((r) => setTimeout(r, 100));

    expect(log.wrapperStyleMutations).toBe(0);
    expect(log.subtreeAttributeMutations).toBeLessThanOrEqual(3);
    expect(log.subtreeChildListMutations).toBe(0);

    reset();

    // Select range: 3 rows × 2 cols = 6 cells
    runInAction(() => {
      state.cellFSM.selectTo({ rowId: 'row-3', field: 'data.age' });
    });
    await new Promise((r) => setTimeout(r, 100));

    expect(log.wrapperStyleMutations).toBe(0);
    expect(log.subtreeAttributeMutations).toBeLessThanOrEqual(14);
    expect(log.subtreeChildListMutations).toBe(0);

    reset();

    // Extend to 5 rows × 4 cols = 20 cells
    runInAction(() => {
      state.cellFSM.selectTo({ rowId: 'row-5', field: 'data.email' });
    });
    await new Promise((r) => setTimeout(r, 100));

    expect(log.wrapperStyleMutations).toBe(0);
    expect(log.subtreeAttributeMutations).toBeLessThanOrEqual(42);
    expect(log.subtreeChildListMutations).toBe(0);

    reset();

    // Blur → clear all selection
    runInAction(() => {
      state.cellFSM.blur();
    });
    await new Promise((r) => setTimeout(r, 100));

    expect(log.wrapperStyleMutations).toBe(0);
    expect(log.subtreeAttributeMutations).toBeLessThanOrEqual(44);
    expect(log.subtreeChildListMutations).toBe(0);

    disconnect();
  },
};
