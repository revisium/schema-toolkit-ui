import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import type { Meta, StoryObj } from '@storybook/react';
import { obj, str, num, bool } from '@revisium/schema-toolkit';
import { expect, waitFor } from 'storybook/test';
import { TableVirtuoso } from 'react-virtuoso';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { createTableStoryState, type TableStoryState } from '../../helpers.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';
import { CellRenderer } from '../../../Table/ui/Cell/CellRenderer.js';
import type { RowVM } from '../../../Table/model/RowVM.js';
import type { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';

ensureReactivityProvider();

const TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
  email: str(),
});

const ROW_COUNT = 200;
const COLS = ['data.name', 'data.age', 'data.active', 'data.email'];

function generateRows(count: number): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  for (let i = 0; i < count; i++) {
    rows.push({
      name: `User ${i + 1}`,
      age: 20 + (i % 50),
      active: i % 3 !== 0,
      email: `user${i + 1}@test.com`,
    });
  }
  return rows;
}

const MOCK_ROWS = generateRows(ROW_COUNT);

function createState(): TableStoryState {
  const s = createTableStoryState({
    dataSchema: TABLE_SCHEMA,
    rowsData: MOCK_ROWS,
  });
  runInAction(() => {
    s.columnsModel.commitColumnWidth();
  });
  return s;
}

interface RenderLog {
  id: string;
  phase: string;
  actualDuration: number;
  baseDuration: number;
}

// ============ Variant A: Full TableWidget (current) ============

const FullWrapper = observer(() => {
  const [state] = useState(createState);
  const renderLogs = useRef<RenderLog[]>([]);

  useEffect(() => {
    (window as any).__testState = state;
    (window as any).__renderLogs = renderLogs.current;
    return () => {
      delete (window as any).__testState;
      delete (window as any).__renderLogs;
    };
  }, [state]);

  const onRender = useCallback(
    (
      _id: string,
      phase: string,
      actualDuration: number,
      baseDuration: number,
    ) => {
      renderLogs.current.push({ id: _id, phase, actualDuration, baseDuration });
    },
    [],
  );

  return (
    <Box width="800px" height="300px">
      <React.Profiler id="Full" onRender={onRender}>
        <TableWidget
          rows={state.rows}
          columnsModel={state.columnsModel}
          cellFSM={state.cellFSM}
          selection={state.selection}
        />
      </React.Profiler>
    </Box>
  );
});

// ============ Variant B: raw <td> + full CellRenderer (no Chakra td) ============

const TdCellRow = observer(
  ({ row, columnsModel }: { row: RowVM; columnsModel: ColumnsModel }) => (
    <>
      {columnsModel.visibleColumns.map((col) => {
        const cellVM = row.getCellVM(col);
        return (
          <td
            key={col.field}
            style={{
              padding: 0,
              overflow: 'hidden',
              borderRight: '1px solid #e2e8f0',
              position: 'relative',
              boxShadow: 'inset 0 -1px 0 0 #e2e8f0',
            }}
          >
            <CellRenderer cell={cellVM} />
          </td>
        );
      })}
      <td style={{ width: '100%', boxShadow: 'inset 0 -1px 0 0 #e2e8f0' }} />
    </>
  ),
);

const TdCellWrapper = observer(() => {
  const [state] = useState(createState);
  const renderLogs = useRef<RenderLog[]>([]);

  useEffect(() => {
    (window as any).__testStateTdCell = state;
    (window as any).__renderLogsTdCell = renderLogs.current;
    return () => {
      delete (window as any).__testStateTdCell;
      delete (window as any).__renderLogsTdCell;
    };
  }, [state]);

  const onRender = useCallback(
    (
      _id: string,
      phase: string,
      actualDuration: number,
      baseDuration: number,
    ) => {
      renderLogs.current.push({ id: _id, phase, actualDuration, baseDuration });
    },
    [],
  );

  const { columnsModel } = state;

  const itemContent = useCallback(
    (_index: number, row: RowVM) => (
      <TdCellRow row={row} columnsModel={columnsModel} />
    ),
    [columnsModel],
  );

  const fixedHeaderContent = useCallback(
    () => (
      <tr>
        {columnsModel.visibleColumns.map((col) => (
          <th
            key={col.field}
            style={{
              padding: '0 8px',
              height: '40px',
              textAlign: 'left',
              borderBottom: '2px solid #e2e8f0',
              background: 'white',
            }}
          >
            {col.field}
          </th>
        ))}
        <th style={{ width: '100%' }} />
      </tr>
    ),
    [columnsModel],
  );

  return (
    <Box width="800px" height="300px">
      <React.Profiler id="TdCell" onRender={onRender}>
        <div data-testid="table-widget" style={{ height: '100%' }}>
          <TableVirtuoso
            style={{ height: '100%' }}
            data={state.rows}
            defaultItemHeight={40}
            initialItemCount={Math.min(state.rows.length, 20)}
            increaseViewportBy={40 * 50}
            fixedHeaderContent={fixedHeaderContent}
            itemContent={itemContent}
          />
        </div>
      </React.Profiler>
    </Box>
  );
});

// ============ Variant C: raw <td> + plain text (no CellRenderer) ============

const LiteRow = observer(({ row }: { row: RowVM }) => (
  <>
    {COLS.map((field) => {
      const col = row.getCellVM({
        field,
        fieldType: 'string' as any,
        isSystem: false,
      });
      return (
        <td
          key={field}
          style={{
            padding: '0 8px',
            height: '40px',
            overflow: 'hidden',
            borderRight: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              height: '100%',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                fontWeight: 300,
              }}
            >
              {col.displayValue}
            </span>
          </div>
        </td>
      );
    })}
    <td style={{ width: '100%' }} />
  </>
));

const LiteWrapper = observer(() => {
  const [state] = useState(createState);
  const renderLogs = useRef<RenderLog[]>([]);

  useEffect(() => {
    (window as any).__testStateLite = state;
    (window as any).__renderLogsLite = renderLogs.current;
    return () => {
      delete (window as any).__testStateLite;
      delete (window as any).__renderLogsLite;
    };
  }, [state]);

  const onRender = useCallback(
    (
      _id: string,
      phase: string,
      actualDuration: number,
      baseDuration: number,
    ) => {
      renderLogs.current.push({ id: _id, phase, actualDuration, baseDuration });
    },
    [],
  );

  const itemContent = useCallback(
    (_index: number, row: RowVM) => <LiteRow row={row} />,
    [],
  );

  const fixedHeaderContent = useCallback(
    () => (
      <tr>
        {COLS.map((field) => (
          <th
            key={field}
            style={{
              padding: '0 8px',
              height: '40px',
              textAlign: 'left',
              borderBottom: '2px solid #e2e8f0',
              background: 'white',
            }}
          >
            {field}
          </th>
        ))}
        <th style={{ width: '100%' }} />
      </tr>
    ),
    [],
  );

  return (
    <Box width="800px" height="300px">
      <React.Profiler id="Lite" onRender={onRender}>
        <div data-testid="table-widget" style={{ height: '100%' }}>
          <TableVirtuoso
            style={{ height: '100%' }}
            data={state.rows}
            defaultItemHeight={40}
            initialItemCount={Math.min(state.rows.length, 20)}
            increaseViewportBy={40 * 50}
            fixedHeaderContent={fixedHeaderContent}
            itemContent={itemContent}
          />
        </div>
      </React.Profiler>
    </Box>
  );
});

// ============ Meta ============

const meta: Meta<typeof FullWrapper> = {
  component: FullWrapper as any,
  title: 'TableEditor/E2E/Table/ScrollPerf',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof FullWrapper>;

// ============ Shared test runner ============

interface PhaseResult {
  name: string;
  renderCount: number;
  totalMs: number;
  avgMs: number;
  trAdded: number;
}

async function runScrollPhases(
  tableWidget: HTMLElement,
  renderLogs: RenderLog[],
): Promise<PhaseResult[]> {
  const scroller = tableWidget.querySelector(
    '[data-virtuoso-scroller]',
  ) as HTMLElement;

  await waitFor(() => {
    expect(scroller.scrollHeight).toBeGreaterThan(scroller.clientHeight);
  });
  await new Promise((r) => setTimeout(r, 300));

  const results: PhaseResult[] = [];

  const phases: Array<{
    name: string;
    action: () => void;
    wait: number;
  }> = [
    {
      name: 'Small scroll (250px)',
      action: () => {
        scroller.scrollTop = 250;
      },
      wait: 500,
    },
    {
      name: 'Large scroll (2000px)',
      action: () => {
        scroller.scrollTop = 2000;
      },
      wait: 500,
    },
    {
      name: 'Scroll to end',
      action: () => {
        scroller.scrollTop = scroller.scrollHeight;
      },
      wait: 500,
    },
    {
      name: 'Back to top',
      action: () => {
        scroller.scrollTop = 0;
      },
      wait: 500,
    },
    {
      name: 'Rapid (10x500)',
      action: () => {
        for (let i = 1; i <= 10; i++) {
          scroller.scrollTop = i * 500;
        }
      },
      wait: 800,
    },
  ];

  for (const phase of phases) {
    renderLogs.length = 0;
    let trAdded = 0;
    const obs = new MutationObserver((records) => {
      for (const m of records) {
        if (m.type === 'childList') {
          for (const n of Array.from(m.addedNodes)) {
            if ((n as HTMLElement).tagName === 'TR') {
              trAdded++;
            }
          }
        }
      }
    });
    obs.observe(tableWidget, { childList: true, subtree: true });

    phase.action();
    await new Promise((r) => setTimeout(r, phase.wait));
    obs.disconnect();

    const totalMs = renderLogs.reduce((sum, l) => sum + l.actualDuration, 0);
    const avgMs = renderLogs.length > 0 ? totalMs / renderLogs.length : 0;

    results.push({
      name: phase.name,
      renderCount: renderLogs.length,
      totalMs,
      avgMs,
      trAdded,
    });
  }

  return results;
}

function logResults(label: string, results: PhaseResult[]): void {
  console.log(`\n=== ${label} ===`);
  for (const r of results) {
    const msPerRow = r.trAdded > 0 ? r.totalMs / r.trAdded : 0;
    console.log(
      `${r.name}: ${r.renderCount} renders, ` +
        `${r.totalMs.toFixed(1)}ms, ` +
        `${msPerRow.toFixed(2)}ms/row, ` +
        `TR+${r.trAdded}`,
    );
  }
  const total = results.reduce((s, r) => s + r.totalMs, 0);
  const totalTr = results.reduce((s, r) => s + r.trAdded, 0);
  console.log(
    `TOTAL: ${total.toFixed(1)}ms, ${totalTr} TR, ` +
      `${totalTr > 0 ? (total / totalTr).toFixed(2) : '?'}ms/row`,
  );
}

// ============ Stories ============

export const FullTableWidget: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const renderLogs = (window as any).__renderLogs as RenderLog[];
    const tw = canvasElement.querySelector(
      '[data-testid="table-widget"]',
    ) as HTMLElement;
    const results = await runScrollPhases(tw, renderLogs);
    logResults('A: FULL (Chakra Box<td> + CellWrapper + Menu.Root)', results);
    expect(results.length).toBe(5);
  },
};

export const RawTdWithCellRenderer: Story = {
  tags: ['test'],
  render: () => <TdCellWrapper />,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect((window as any).__testStateTdCell).toBeDefined();
    });
    const renderLogs = (window as any).__renderLogsTdCell as RenderLog[];
    const tw = canvasElement.querySelector(
      '[data-testid="table-widget"]',
    ) as HTMLElement;
    const results = await runScrollPhases(tw, renderLogs);
    logResults('B: raw <td> + CellRenderer (CellWrapper+Menu)', results);
    expect(results.length).toBe(5);
  },
};

export const RawTdPlainText: Story = {
  tags: ['test'],
  render: () => <LiteWrapper />,
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect((window as any).__testStateLite).toBeDefined();
    });
    const renderLogs = (window as any).__renderLogsLite as RenderLog[];
    const tw = canvasElement.querySelector(
      '[data-testid="table-widget"]',
    ) as HTMLElement;
    const results = await runScrollPhases(tw, renderLogs);
    logResults('C: raw <td> + plain text (baseline)', results);
    expect(results.length).toBe(5);
  },
};
