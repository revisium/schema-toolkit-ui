import { useEffect, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { obj, str, num, strFormula } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import {
  col,
  createTableStoryState,
  FilterFieldType,
  mockClipboard,
  type TableStoryState,
} from '../../helpers.js';
import { TableWidget } from '../../../Table/ui/TableWidget.js';
import {
  TABLE_SCHEMA,
  TEST_COLUMNS,
  MOCK_ROWS_DATA,
} from '../../../Table/ui/__stories__/tableTestData.js';

ensureReactivityProvider();

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

const FORMULA_TABLE_SCHEMA = obj({
  name: str(),
  age: num(),
  greeting: strFormula('"Hello, " + name'),
  ageGroup: strFormula('if(age >= 30, "Senior", "Junior")'),
  label: strFormula('greeting + " (" + ageGroup + ")"'),
});

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
  title: 'TableEditor/E2E/Table/CopyPaste',
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

    clipboard.setText('NewName');
    const nameCell1Again = canvas.getByTestId('cell-row-1-name');
    await userEvent.click(nameCell1Again);
    await waitFor(() => {
      expect(nameCell1Again).toHaveAttribute('tabindex', '0');
    });
    await userEvent.keyboard('{Control>}v{/Control}');
    await waitFor(() => {
      expect(nameCell1Again).toHaveTextContent('NewName');
    });
    expect(canvas.getByTestId('cell-row-2-name')).toHaveTextContent('Alice');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(nameCell1Again).toHaveAttribute('tabindex', '-1');
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

export const MultiCellPaste: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => {
      expect((window as any).__testState).toBeDefined();
    });
    const state = (window as any).__testState as TableStoryState;
    const { cellFSM } = state;

    // --- multi-line TSV paste from single cell ---
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

    // --- quoted TSV paste (Excel format with newlines inside quotes) ---
    mockClipboard(
      '"Laptop4 wer we\nsdf sdf sdf sdf sd "\t991\t3\nMouse2\t25\t3',
    );

    await userEvent.click(canvas.getByTestId('cell-row-4-name'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-4-name')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    await userEvent.keyboard('{Control>}v{/Control}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-4-name')).toHaveTextContent(
        'Laptop4 wer we sdf sdf sdf sdf sd',
      );
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-4-age')).toHaveTextContent('991');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-5-name')).toHaveTextContent('Mouse2');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-5-age')).toHaveTextContent('25');
    });

    // --- copy range after column reorder ---
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
      expect(text).toBe('true\tX\nfalse\tY');
    });

    // --- paste overflow beyond table bounds ---
    mockClipboard('A\t11\nB\t22\nC\t33\nD\t44\nE\t55\nF\t66\nG\t77');

    const cell4 = canvas.getByTestId('cell-row-4-name');
    await userEvent.click(cell4);
    await waitFor(() => {
      expect(cell4).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Control>}v{/Control}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-4-name')).toHaveTextContent('A');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-4-age')).toHaveTextContent('11');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-5-name')).toHaveTextContent('B');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-5-age')).toHaveTextContent('22');
    });

    expect(canvas.getByTestId('cell-row-3-name')).toHaveTextContent('Z');
    expect(canvas.getByTestId('cell-row-3-age')).toHaveTextContent('77');

    await userEvent.keyboard('{Escape}');
  },
};
