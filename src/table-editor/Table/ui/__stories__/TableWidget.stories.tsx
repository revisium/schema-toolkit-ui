import { useCallback, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';
import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import {
  obj,
  str,
  num,
  bool,
  strFormula,
  numFormula,
  boolFormula,
} from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import type { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';
import {
  col,
  createTableStoryState,
  FilterFieldType,
} from '../../../__stories__/helpers.js';
import { TableWidget } from '../TableWidget.js';
import { TABLE_SCHEMA, TEST_COLUMNS, MOCK_ROWS_DATA } from './tableTestData.js';

ensureReactivityProvider();

const noop = () => {};

const EXTENDED_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
  col('email', FilterFieldType.String),
  col('score', FilterFieldType.Number),
];

const EXTENDED_SCHEMA = obj({
  name: str(),
  age: num(),
  active: bool(),
  email: str(),
  score: num(),
});

const FORMULA_TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  greeting: strFormula('"Hello, " + name'),
  ageGroup: strFormula('if(age >= 30, "Senior", "Junior")'),
  label: strFormula('greeting + " (" + ageGroup + ")"'),
});

const FORMULA_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('greeting', FilterFieldType.String, {
    label: 'Greeting',
    hasFormula: true,
  }),
  col('ageGroup', FilterFieldType.String, {
    label: 'Age Group',
    hasFormula: true,
  }),
  col('label', FilterFieldType.String, { label: 'Label', hasFormula: true }),
];

const MIXED_FORMULA_SCHEMA = obj({
  item: str(),
  price: num(),
  quantity: num(),
  total: numFormula('price * quantity'),
  expensive: boolFormula('total > 100'),
});

const MIXED_FORMULA_COLUMNS = [
  col('item', FilterFieldType.String, { label: 'Item' }),
  col('price', FilterFieldType.Number, { label: 'Price' }),
  col('quantity', FilterFieldType.Number, { label: 'Qty' }),
  col('total', FilterFieldType.Number, { label: 'Total', hasFormula: true }),
  col('expensive', FilterFieldType.Boolean, {
    label: 'Expensive?',
    hasFormula: true,
  }),
];

interface DefaultWrapperProps {
  rowCount?: number;
  showEmpty?: boolean;
  withRowActions?: boolean;
  withSort?: boolean;
  withFilter?: boolean;
}

const DefaultWrapper = observer(
  ({
    rowCount = 5,
    showEmpty = false,
    withRowActions = true,
    withSort = false,
    withFilter = false,
  }: DefaultWrapperProps) => {
    const [state] = useState(() =>
      createTableStoryState({
        schema: TABLE_SCHEMA,
        columns: TEST_COLUMNS,
        rowsData: showEmpty ? [] : MOCK_ROWS_DATA.slice(0, rowCount),
        withSort,
        withFilter,
      }),
    );

    return (
      <Box
        width="600px"
        height="400px"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <TableWidget
          rows={state.rows}
          columnsModel={state.columnsModel}
          cellFSM={state.cellFSM}
          selection={state.selection}
          sortModel={state.sortModel}
          filterModel={state.filterModel}
          onOpenRow={withRowActions ? noop : undefined}
          onDeleteRow={withRowActions ? noop : undefined}
          onDuplicateRow={withRowActions ? noop : undefined}
          onDeleteSelected={withRowActions ? noop : undefined}
        />
      </Box>
    );
  },
);

const meta: Meta<typeof DefaultWrapper> = {
  component: DefaultWrapper as any,
  title: 'TableEditor/Table',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof DefaultWrapper>;

export const Default: Story = {};

export const SingleRow: Story = {
  args: { rowCount: 1 },
};

export const EmptyTable: Story = {
  args: { showEmpty: true },
};

export const SingleColumn: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableStoryState({
          schema: TABLE_SCHEMA,
          columns: TEST_COLUMNS,
          rowsData: MOCK_ROWS_DATA,
          visibleFields: ['name'],
        }),
      );

      return (
        <Box
          width="600px"
          height="400px"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <TableWidget
            rows={state.rows}
            columnsModel={state.columnsModel}
            cellFSM={state.cellFSM}
            selection={state.selection}
          />
        </Box>
      );
    });

    return <Wrapper />;
  },
};

export const WithHiddenColumns: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableStoryState({
          schema: EXTENDED_SCHEMA,
          columns: EXTENDED_COLUMNS,
          rowsData: [
            { name: 'Alice', age: 30, active: true, email: 'a@b.c', score: 95 },
            { name: 'Bob', age: 25, active: false, email: 'b@c.d', score: 80 },
          ],
          visibleFields: ['name', 'age', 'active'],
          withSort: true,
          withFilter: true,
        }),
      );

      return (
        <Box
          width="600px"
          height="400px"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <TableWidget
            rows={state.rows}
            columnsModel={state.columnsModel}
            cellFSM={state.cellFSM}
            selection={state.selection}
            sortModel={state.sortModel}
            filterModel={state.filterModel}
            onOpenRow={noop}
            onDeleteRow={noop}
            onDuplicateRow={noop}
            onDeleteSelected={noop}
          />
        </Box>
      );
    });

    return <Wrapper />;
  },
};

const MANY_ROWS_TOTAL = 3000;
const MANY_ROWS_PAGE_SIZE = 100;

const ManyRowsWrapper = observer(
  ({ onEndReached: onEndReachedAction }: { onEndReached?: () => void }) => {
    const allRowsData = Array.from({ length: MANY_ROWS_TOTAL }, (_, i) => ({
      name: `User ${i + 1}`,
      age: 20 + (i % 50),
      active: i % 3 !== 0,
    }));

    const [state] = useState(() =>
      createTableStoryState({
        schema: TABLE_SCHEMA,
        columns: TEST_COLUMNS,
        rowsData: allRowsData,
      }),
    );

    const [visibleCount, setVisibleCount] = useState(MANY_ROWS_PAGE_SIZE);
    const [loading, setLoading] = useState(false);
    const visibleRows = state.rows.slice(0, visibleCount);

    const handleEndReached = useCallback(() => {
      if (loading || visibleCount >= MANY_ROWS_TOTAL) {
        return;
      }
      onEndReachedAction?.();
      setLoading(true);
      setTimeout(() => {
        setVisibleCount((prev) =>
          Math.min(prev + MANY_ROWS_PAGE_SIZE, MANY_ROWS_TOTAL),
        );
        setLoading(false);
      }, 200);
    }, [loading, visibleCount, onEndReachedAction]);

    return (
      <Box
        width="600px"
        height="400px"
        borderWidth="1px"
        borderColor="gray.200"
      >
        <TableWidget
          rows={visibleRows}
          columnsModel={state.columnsModel}
          cellFSM={state.cellFSM}
          selection={state.selection}
          onOpenRow={noop}
          onDeleteRow={noop}
          onDuplicateRow={noop}
          onDeleteSelected={noop}
          onEndReached={handleEndReached}
          isLoadingMore={loading}
        />
      </Box>
    );
  },
);

export const ManyRows: StoryObj<typeof ManyRowsWrapper> = {
  render: (args) => <ManyRowsWrapper onEndReached={args.onEndReached} />,
  args: {
    onEndReached: fn().mockName('onEndReached'),
  },
};

export const InSelectionMode: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() => {
        const s = createTableStoryState({
          schema: TABLE_SCHEMA,
          columns: TEST_COLUMNS,
          rowsData: MOCK_ROWS_DATA,
        });
        s.selection.toggle('row-1');
        s.selection.toggle('row-3');
        return s;
      });

      return (
        <Box
          width="600px"
          height="400px"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <TableWidget
            rows={state.rows}
            columnsModel={state.columnsModel}
            cellFSM={state.cellFSM}
            selection={state.selection}
            onOpenRow={noop}
            onDeleteRow={noop}
            onDuplicateRow={noop}
            onDeleteSelected={noop}
          />
        </Box>
      );
    });

    return <Wrapper />;
  },
};

export const WithSortAndFilter: Story = {
  args: { withSort: true, withFilter: true },
};

export const FormulaColumns: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableStoryState({
          schema: FORMULA_TABLE_SCHEMA,
          columns: FORMULA_COLUMNS,
          rowsData: [
            { name: 'Alice', age: 30 },
            { name: 'Bob', age: 25 },
            { name: 'Charlie', age: 35 },
          ],
        }),
      );

      return (
        <Box
          width="900px"
          height="400px"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <TableWidget
            rows={state.rows}
            columnsModel={state.columnsModel}
            cellFSM={state.cellFSM}
            selection={state.selection}
          />
        </Box>
      );
    });

    return <Wrapper />;
  },
};

export const MixedFormulaColumns: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() =>
        createTableStoryState({
          schema: MIXED_FORMULA_SCHEMA,
          columns: MIXED_FORMULA_COLUMNS,
          rowsData: [
            { item: 'Laptop', price: 999, quantity: 2 },
            { item: 'Mouse', price: 25, quantity: 3 },
            { item: 'Monitor', price: 450, quantity: 1 },
          ],
        }),
      );

      return (
        <Box
          width="900px"
          height="400px"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <TableWidget
            rows={state.rows}
            columnsModel={state.columnsModel}
            cellFSM={state.cellFSM}
            selection={state.selection}
          />
        </Box>
      );
    });

    return <Wrapper />;
  },
};

const PINNED_COLUMN_WIDTH = 250;
const PINNED_CONTAINER_WIDTH = '1000px';

function setAllColumnWidths(
  columnsModel: ColumnsModel,
  fields: string[],
  width: number,
): void {
  for (const field of fields) {
    columnsModel.setColumnWidth(field, width);
  }
}

export const PinnedLeftColumn: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() => {
        const s = createTableStoryState({
          schema: EXTENDED_SCHEMA,
          columns: EXTENDED_COLUMNS,
          rowsData: [
            { name: 'Alice', age: 30, active: true, email: 'a@b.c', score: 95 },
            { name: 'Bob', age: 25, active: false, email: 'b@c.d', score: 80 },
            {
              name: 'Charlie',
              age: 35,
              active: true,
              email: 'c@d.e',
              score: 70,
            },
          ],
        });
        runInAction(() => {
          setAllColumnWidths(
            s.columnsModel,
            ['name', 'age', 'active', 'email', 'score'],
            PINNED_COLUMN_WIDTH,
          );
          s.columnsModel.pinLeft('name');
        });
        return s;
      });

      return (
        <Box
          width={PINNED_CONTAINER_WIDTH}
          height="300px"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <TableWidget
            rows={state.rows}
            columnsModel={state.columnsModel}
            cellFSM={state.cellFSM}
            selection={state.selection}
            onOpenRow={noop}
            onDeleteRow={noop}
          />
        </Box>
      );
    });

    return <Wrapper />;
  },
};

export const MultiplePinnedLeft: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() => {
        const s = createTableStoryState({
          schema: EXTENDED_SCHEMA,
          columns: EXTENDED_COLUMNS,
          rowsData: [
            { name: 'Alice', age: 30, active: true, email: 'a@b.c', score: 95 },
            { name: 'Bob', age: 25, active: false, email: 'b@c.d', score: 80 },
          ],
        });
        runInAction(() => {
          setAllColumnWidths(
            s.columnsModel,
            ['name', 'age', 'active', 'email', 'score'],
            PINNED_COLUMN_WIDTH,
          );
          s.columnsModel.pinLeft('name');
          s.columnsModel.pinLeft('age');
        });
        return s;
      });

      return (
        <Box
          width={PINNED_CONTAINER_WIDTH}
          height="300px"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <TableWidget
            rows={state.rows}
            columnsModel={state.columnsModel}
            cellFSM={state.cellFSM}
            selection={state.selection}
            onOpenRow={noop}
            onDeleteRow={noop}
          />
        </Box>
      );
    });

    return <Wrapper />;
  },
};

export const PinnedLeftAndRight: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() => {
        const s = createTableStoryState({
          schema: EXTENDED_SCHEMA,
          columns: EXTENDED_COLUMNS,
          rowsData: [
            { name: 'Alice', age: 30, active: true, email: 'a@b.c', score: 95 },
            { name: 'Bob', age: 25, active: false, email: 'b@c.d', score: 80 },
          ],
        });
        runInAction(() => {
          setAllColumnWidths(
            s.columnsModel,
            ['name', 'age', 'active', 'email', 'score'],
            PINNED_COLUMN_WIDTH,
          );
          s.columnsModel.pinLeft('name');
          s.columnsModel.pinRight('score');
        });
        return s;
      });

      return (
        <Box
          width={PINNED_CONTAINER_WIDTH}
          height="300px"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <TableWidget
            rows={state.rows}
            columnsModel={state.columnsModel}
            cellFSM={state.cellFSM}
            selection={state.selection}
            onOpenRow={noop}
            onDeleteRow={noop}
          />
        </Box>
      );
    });

    return <Wrapper />;
  },
};

export const PinnedWithSelection: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const [state] = useState(() => {
        const s = createTableStoryState({
          schema: EXTENDED_SCHEMA,
          columns: EXTENDED_COLUMNS,
          rowsData: [
            { name: 'Alice', age: 30, active: true, email: 'a@b.c', score: 95 },
            { name: 'Bob', age: 25, active: false, email: 'b@c.d', score: 80 },
            {
              name: 'Charlie',
              age: 35,
              active: true,
              email: 'c@d.e',
              score: 70,
            },
          ],
        });
        runInAction(() => {
          setAllColumnWidths(
            s.columnsModel,
            ['name', 'age', 'active', 'email', 'score'],
            PINNED_COLUMN_WIDTH,
          );
          s.columnsModel.pinLeft('name');
          s.columnsModel.pinRight('score');
        });
        s.selection.toggle('row-1');
        return s;
      });

      return (
        <Box
          width={PINNED_CONTAINER_WIDTH}
          height="300px"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <TableWidget
            rows={state.rows}
            columnsModel={state.columnsModel}
            cellFSM={state.cellFSM}
            selection={state.selection}
            onOpenRow={noop}
            onDeleteRow={noop}
            onDeleteSelected={noop}
          />
        </Box>
      );
    });

    return <Wrapper />;
  },
};

const TOTAL_ROWS = 200;
const PAGE_SIZE = 50;

export const InfiniteScroll: Story = {
  render: () => {
    const Wrapper = observer(() => {
      const allRowsData = Array.from({ length: TOTAL_ROWS }, (_, i) => ({
        name: `User ${i + 1}`,
        age: 20 + (i % 50),
        active: i % 3 !== 0,
      }));

      const [state] = useState(() =>
        createTableStoryState({
          schema: TABLE_SCHEMA,
          columns: TEST_COLUMNS,
          rowsData: allRowsData,
        }),
      );

      const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
      const [loading, setLoading] = useState(false);
      const visibleRows = state.rows.slice(0, visibleCount);

      const handleEndReached = useCallback(() => {
        if (loading || visibleCount >= TOTAL_ROWS) {
          return;
        }
        setLoading(true);
        const nextCount = Math.min(visibleCount + PAGE_SIZE, TOTAL_ROWS);
        setTimeout(() => {
          setVisibleCount(nextCount);
          setLoading(false);
        }, 500);
      }, [loading, visibleCount]);

      return (
        <Box width="600px" borderWidth="1px" borderColor="gray.200">
          <TableWidget
            rows={visibleRows}
            columnsModel={state.columnsModel}
            cellFSM={state.cellFSM}
            selection={state.selection}
            onOpenRow={noop}
            onDeleteRow={noop}
            onDuplicateRow={noop}
            onDeleteSelected={noop}
            onEndReached={handleEndReached}
            isLoadingMore={loading}
            useWindowScroll
          />
        </Box>
      );
    });

    return <Wrapper />;
  },
};
