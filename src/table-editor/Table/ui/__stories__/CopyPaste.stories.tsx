import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import type { JsonSchema } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  col,
  createTableStoryState,
  FilterFieldType,
  mockClipboard,
  type TableStoryState,
} from '../../../__stories__/helpers.js';
import { CellFSM } from '../../model/CellFSM.js';
import { TableWidget } from '../TableWidget.js';

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

const TEST_COLUMNS = [
  col('name', FilterFieldType.String),
  col('age', FilterFieldType.Number),
  col('active', FilterFieldType.Boolean),
];

const MOCK_ROWS_DATA = [
  { name: 'Alice', age: 30, active: true },
  { name: 'Bob', age: 25, active: false },
  { name: 'Charlie', age: 35, active: true },
  { name: 'Diana', age: 28, active: true },
  { name: 'Eve', age: 22, active: false },
];

const StoryWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      schema: TABLE_SCHEMA,
      columns: TEST_COLUMNS,
      rowsData: MOCK_ROWS_DATA,
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
      />
    </Box>
  );
});

const FORMULA_TABLE_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', default: '' },
    age: { type: 'number', default: 0 },
    greeting: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': { version: 1, expression: '"Hello, " + name' },
    },
    ageGroup: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'if(age >= 30, "Senior", "Junior")',
      },
    },
    label: {
      type: 'string',
      default: '',
      readOnly: true,
      'x-formula': {
        version: 1,
        expression: 'greeting + " (" + ageGroup + ")"',
      },
    },
  },
  additionalProperties: false,
  required: ['name', 'age', 'greeting', 'ageGroup', 'label'],
} as JsonSchema;

const FORMULA_TEST_COLUMNS = [
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

const CopyFormulaWrapper = observer(() => {
  const [state] = useState(() =>
    createTableStoryState({
      schema: FORMULA_TABLE_SCHEMA,
      columns: FORMULA_TEST_COLUMNS,
      rowsData: [{ name: 'Alice', age: 30 }],
    }),
  );

  return (
    <Box width="900px" height="400px" borderWidth="1px" borderColor="gray.200">
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
  title: 'TableEditor/Table/E2E/CopyPaste',
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

export const CopyPasteWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const clipboard = mockClipboard();

    const nameCell1 = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(nameCell1);
    await waitFor(() => {
      expect(nameCell1).toHaveAttribute('tabindex', '0');
    });
    await userEvent.keyboard('{Control>}c{/Control}');
    expect(clipboard.getText()).toBe('Alice');

    const nameCell2 = canvas.getByTestId('cell-row-2-name');
    await userEvent.click(nameCell2);
    await waitFor(() => {
      expect(nameCell2).toHaveAttribute('tabindex', '0');
    });
    await userEvent.keyboard('{Control>}v{/Control}');
    await waitFor(() => {
      expect(nameCell2).toHaveTextContent('Alice');
    });

    const ageCell1 = canvas.getByTestId('cell-row-1-age');
    await userEvent.click(ageCell1);
    await waitFor(() => {
      expect(ageCell1).toHaveAttribute('tabindex', '0');
    });
    await userEvent.keyboard('{Control>}c{/Control}');
    expect(clipboard.getText()).toBe('30');

    const ageCell3 = canvas.getByTestId('cell-row-3-age');
    await userEvent.click(ageCell3);
    await waitFor(() => {
      expect(ageCell3).toHaveAttribute('tabindex', '0');
    });
    await userEvent.keyboard('{Control>}v{/Control}');
    await waitFor(() => {
      expect(ageCell3).toHaveTextContent('30');
    });

    clipboard.setText('abc');
    await userEvent.keyboard('{Control>}v{/Control}');
    await waitFor(() => {
      expect(ageCell3).toHaveTextContent('30');
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(ageCell3).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const CopyFromFormulaCell: Story = {
  tags: ['test'],
  render: () => <CopyFormulaWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const clipboard = mockClipboard();

    const greetingCell = canvas.getByTestId('cell-row-1-greeting');
    await waitFor(() => {
      expect(greetingCell).toHaveTextContent('Hello, Alice');
    });
    await userEvent.click(greetingCell);
    await waitFor(() => {
      expect(greetingCell).toHaveAttribute('tabindex', '0');
    });
    await userEvent.keyboard('{Control>}c{/Control}');
    expect(clipboard.getText()).toBe('Hello, Alice');

    await userEvent.keyboard('{Control>}v{/Control}');
    await waitFor(() => {
      expect(greetingCell).toHaveTextContent('Hello, Alice');
    });

    const nameCell = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(nameCell);
    await waitFor(() => {
      expect(nameCell).toHaveAttribute('tabindex', '0');
    });
    await userEvent.keyboard('{Control>}v{/Control}');
    await waitFor(() => {
      expect(nameCell).toHaveTextContent('Hello, Alice');
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(nameCell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const SingleCellMultiPaste: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    mockClipboard('X\t99\nY\t88\nZ\t77');

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    expect(cellFSM.hasSelection).toBe(false);

    await userEvent.keyboard('{Control>}v{/Control}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent('X');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveTextContent('99');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('Y');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-age')).toHaveTextContent('88');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-3-name')).toHaveTextContent('Z');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-3-age')).toHaveTextContent('77');
    });

    expect(canvas.getByTestId('cell-row-1-active')).toHaveTextContent('true');
    expect(canvas.getByTestId('cell-row-4-name')).toHaveTextContent('Diana');

    await userEvent.keyboard('{Escape}');
  },
};

export const SingleCellSingleValuePaste: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    mockClipboard('NewName');

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    expect(cellFSM.hasSelection).toBe(false);

    await userEvent.keyboard('{Control>}v{/Control}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent(
        'NewName',
      );
    });

    expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('Bob');

    await userEvent.keyboard('{Escape}');
  },
};

export const PasteQuotedTSVFromExcel: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const { cellFSM } = (window as any).__testState as {
      cellFSM: CellFSM;
    };

    mockClipboard(
      '"Laptop4 wer we\nsdf sdf sdf sdf sd "\t991\t3\nMouse2\t25\t3',
    );

    await userEvent.click(canvas.getByTestId('cell-row-1-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    expect(cellFSM.hasSelection).toBe(false);

    await userEvent.keyboard('{Control>}v{/Control}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-name')).toHaveTextContent(
        'Laptop4 wer we sdf sdf sdf sdf sd',
      );
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-age')).toHaveTextContent('991');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('Mouse2');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-age')).toHaveTextContent('25');
    });

    expect(canvas.getByTestId('cell-row-3-name')).toHaveTextContent('Charlie');

    await userEvent.keyboard('{Escape}');
  },
};

export const CopyRangeAfterColumnReorder: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableStoryState;
    const { cellFSM } = state;

    const clipboard = mockClipboard();

    state.columnsModel.moveColumnToStart('active');

    await waitFor(() => {
      expect(canvas.getByTestId('header-active')).toBeVisible();
    });

    const activeCell = canvas.getByTestId('cell-row-1-active');
    await userEvent.click(activeCell);
    await waitFor(() => {
      expect(activeCell).toHaveAttribute('tabindex', '0');
    });

    cellFSM.selectTo({ rowId: 'row-2', field: 'name' });
    await waitFor(() => {
      expect(cellFSM.hasSelection).toBe(true);
    });

    await userEvent.keyboard('{Control>}c{/Control}');

    await waitFor(() => {
      const text = clipboard.getText();
      expect(text).toBe('true\tAlice\nfalse\tBob');
    });

    await userEvent.click(activeCell);
    await userEvent.keyboard('{Escape}');
  },
};

export const PasteOverflowBeyondTableBounds: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });

    mockClipboard('X\t99\nY\t88\nZ\t77\nW\t66\nV\t55\nU\t44\nT\t33');

    const cell = canvas.getByTestId('cell-row-4-name');
    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Control>}v{/Control}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-4-name')).toHaveTextContent('X');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-4-age')).toHaveTextContent('99');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-5-name')).toHaveTextContent('Y');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-5-age')).toHaveTextContent('88');
    });

    expect(canvas.getByTestId('cell-row-3-name')).toHaveTextContent('Charlie');
    expect(canvas.getByTestId('cell-row-3-age')).toHaveTextContent('35');

    await userEvent.keyboard('{Escape}');
  },
};
