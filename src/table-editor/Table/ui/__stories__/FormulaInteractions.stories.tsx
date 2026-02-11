import { useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import type { JsonSchema } from '@revisium/schema-toolkit';
import { createTableModel } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { col, FilterFieldType } from '../../../__stories__/helpers.js';
import { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';
import { CellFSM } from '../../model/CellFSM.js';
import { RowVM } from '../../model/RowVM.js';
import { SelectionModel } from '../../model/SelectionModel.js';
import { TableWidget } from '../TableWidget.js';

ensureReactivityProvider();

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

const FORMULA_ROWS_DATA = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 35 },
];

const FormulaStoryWrapper = observer(() => {
  const [state] = useState(() => {
    const columnsModel = new ColumnsModel();
    columnsModel.init(FORMULA_TEST_COLUMNS);
    columnsModel.reorderColumns(FORMULA_TEST_COLUMNS.map((c) => c.field));
    const selection = new SelectionModel();
    const cellFSM = new CellFSM();

    const tableModel = createTableModel({
      tableId: 'formula-table',
      schema: FORMULA_TABLE_SCHEMA as any,
      rows: FORMULA_ROWS_DATA.map((data, i) => ({
        rowId: `row-${i + 1}`,
        data,
      })),
    });

    const rows = tableModel.rows.map(
      (rowModel) => new RowVM(rowModel, rowModel.rowId, cellFSM, selection),
    );

    cellFSM.setNavigationContext(
      FORMULA_TEST_COLUMNS.map((c) => c.field),
      rows.map((r) => r.rowId),
    );

    return { columnsModel, selection, cellFSM, rows };
  });

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

const MIXED_FORMULA_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    item: { type: 'string', default: '' },
    price: { type: 'number', default: 0 },
    quantity: { type: 'number', default: 0 },
    total: {
      type: 'number',
      default: 0,
      readOnly: true,
      'x-formula': { version: 1, expression: 'price * quantity' },
    },
    expensive: {
      type: 'boolean',
      default: false,
      readOnly: true,
      'x-formula': { version: 1, expression: 'total > 100' },
    },
  },
  additionalProperties: false,
  required: ['item', 'price', 'quantity', 'total', 'expensive'],
} as JsonSchema;

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

const MIXED_FORMULA_ROWS = [
  { item: 'Laptop', price: 999, quantity: 2 },
  { item: 'Mouse', price: 25, quantity: 3 },
  { item: 'Monitor', price: 450, quantity: 1 },
];

const MixedFormulaWrapper = observer(() => {
  const [state] = useState(() => {
    const columnsModel = new ColumnsModel();
    columnsModel.init(MIXED_FORMULA_COLUMNS);
    columnsModel.reorderColumns(MIXED_FORMULA_COLUMNS.map((c) => c.field));
    const selection = new SelectionModel();
    const cellFSM = new CellFSM();

    const tableModel = createTableModel({
      tableId: 'mixed-formula-table',
      schema: MIXED_FORMULA_SCHEMA as any,
      rows: MIXED_FORMULA_ROWS.map((data, i) => ({
        rowId: `row-${i + 1}`,
        data,
      })),
    });

    const rows = tableModel.rows.map(
      (rowModel) => new RowVM(rowModel, rowModel.rowId, cellFSM, selection),
    );

    cellFSM.setNavigationContext(
      MIXED_FORMULA_COLUMNS.map((c) => c.field),
      rows.map((r) => r.rowId),
    );

    return { columnsModel, selection, cellFSM, rows };
  });

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

const meta: Meta<typeof FormulaStoryWrapper> = {
  component: FormulaStoryWrapper as any,
  title: 'TableEditor/TableWidget/FormulaInteractions',
  decorators: [
    (Story) => (
      <Box p={4}>
        <Story />
      </Box>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof FormulaStoryWrapper>;

export const FormulaColumns: Story = {
  render: () => <FormulaStoryWrapper />,
};

export const FormulaColumnsInteractions: Story = {
  tags: ['test'],
  render: () => <FormulaStoryWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const greetingCell = canvas.getByTestId('cell-row-1-greeting');
    await waitFor(() => {
      expect(greetingCell).toHaveTextContent('Hello, Alice');
    });
    await userEvent.click(greetingCell);
    await waitFor(() => {
      expect(greetingCell).toHaveAttribute('tabindex', '0');
    });
    expect(greetingCell).toHaveTextContent('readonly');

    await userEvent.keyboard('{Enter}');
    expect(
      document.querySelector('[data-testid="string-cell-input"]'),
    ).toBeNull();

    await userEvent.keyboard('X');
    expect(
      document.querySelector('[data-testid="string-cell-input"]'),
    ).toBeNull();
    expect(greetingCell).toHaveAttribute('tabindex', '0');

    await userEvent.keyboard('{ArrowRight}');
    const ageGroupCell = canvas.getByTestId('cell-row-1-ageGroup');
    await waitFor(() => {
      expect(ageGroupCell).toHaveAttribute('tabindex', '0');
      expect(greetingCell).toHaveAttribute('tabindex', '-1');
    });
    expect(ageGroupCell).toHaveTextContent('readonly');

    await userEvent.keyboard('{ArrowRight}');
    const labelCell = canvas.getByTestId('cell-row-1-label');
    await waitFor(() => {
      expect(labelCell).toHaveAttribute('tabindex', '0');
    });
    expect(labelCell).toHaveTextContent('readonly');

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(ageGroupCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(greetingCell).toHaveAttribute('tabindex', '0');
    });
    await userEvent.keyboard('{ArrowLeft}');
    const ageCell = canvas.getByTestId('cell-row-1-age');
    await waitFor(() => {
      expect(ageCell).toHaveAttribute('tabindex', '0');
    });
    expect(ageCell).not.toHaveTextContent('readonly');

    const nameCell = canvas.getByTestId('cell-row-1-name');
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => {
      expect(nameCell).toHaveAttribute('tabindex', '0');
    });
    await userEvent.dblClick(nameCell);
    const nameInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Zoe');
    nameInput.blur();

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-greeting')).toHaveTextContent(
        'Hello, Zoe',
      );
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-label')).toHaveTextContent(
        'Hello, Zoe (Senior)',
      );
    });

    await userEvent.click(ageCell);
    await waitFor(() => {
      expect(ageCell).toHaveAttribute('tabindex', '0');
    });
    await userEvent.dblClick(ageCell);
    const ageInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(ageInput);
    await userEvent.type(ageInput, '20');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-ageGroup')).toHaveTextContent(
        'Junior',
      );
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-label')).toHaveTextContent(
        'Hello, Zoe (Junior)',
      );
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(ageCell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const MixedFormulaColumns: Story = {
  render: () => <MixedFormulaWrapper />,
};

export const MixedFormulaInteractions: Story = {
  tags: ['test'],
  render: () => <MixedFormulaWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const priceCell = canvas.getByTestId('cell-row-1-price');
    const qtyCell = canvas.getByTestId('cell-row-1-quantity');
    expect(priceCell).toHaveTextContent('999');
    expect(qtyCell).toHaveTextContent('2');

    const totalCell = canvas.getByTestId('cell-row-1-total');
    expect(totalCell).toHaveTextContent('1998');
    await userEvent.click(totalCell);
    await waitFor(() => {
      expect(totalCell).toHaveAttribute('tabindex', '0');
    });
    expect(totalCell).toHaveTextContent('readonly');

    await userEvent.keyboard('{Enter}');
    expect(
      document.querySelector('[data-testid="number-cell-input"]'),
    ).toBeNull();
    await userEvent.keyboard('5');
    expect(
      document.querySelector('[data-testid="number-cell-input"]'),
    ).toBeNull();

    await userEvent.keyboard('{ArrowRight}');
    const expensiveCell = canvas.getByTestId('cell-row-1-expensive');
    await waitFor(() => {
      expect(expensiveCell).toHaveAttribute('tabindex', '0');
    });
    expect(expensiveCell).toHaveTextContent('true');
    expect(expensiveCell).toHaveTextContent('readonly');

    await userEvent.keyboard('{Enter}');
    expect(
      document.querySelector('[data-testid="boolean-option-true"]'),
    ).toBeNull();

    await userEvent.keyboard('{ArrowDown}');
    const expensiveCell2 = canvas.getByTestId('cell-row-2-expensive');
    await waitFor(() => {
      expect(expensiveCell2).toHaveAttribute('tabindex', '0');
    });
    expect(expensiveCell2).toHaveTextContent('false');
    expect(expensiveCell2).toHaveTextContent('readonly');

    await userEvent.keyboard('{ArrowLeft}');
    const totalCell2 = canvas.getByTestId('cell-row-2-total');
    await waitFor(() => {
      expect(totalCell2).toHaveAttribute('tabindex', '0');
    });
    expect(totalCell2).toHaveTextContent('75');
    expect(totalCell2).toHaveTextContent('readonly');

    await userEvent.keyboard('{ArrowLeft}');
    const qtyCell2 = canvas.getByTestId('cell-row-2-quantity');
    await waitFor(() => {
      expect(qtyCell2).toHaveAttribute('tabindex', '0');
    });
    expect(qtyCell2).not.toHaveTextContent('readonly');

    await userEvent.dblClick(qtyCell2);
    const qtyInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(qtyInput);
    await userEvent.type(qtyInput, '10');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(qtyCell2).toHaveTextContent('10');
    });

    const priceCell2 = canvas.getByTestId('cell-row-2-price');
    await userEvent.click(priceCell2);
    await waitFor(() => {
      expect(priceCell2).toHaveAttribute('tabindex', '0');
    });

    await userEvent.dblClick(priceCell2);
    const priceInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '50');
    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(priceCell2).toHaveTextContent('50');
    });

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-total')).toHaveTextContent('500');
    });
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-expensive')).toHaveTextContent(
        'true',
      );
    });

    await userEvent.click(canvas.getByTestId('cell-row-1-quantity'));
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-quantity')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-total')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-expensive')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });
    await userEvent.keyboard('{Tab}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-item')).toHaveAttribute(
        'tabindex',
        '0',
      );
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-2-item')).toHaveAttribute(
        'tabindex',
        '-1',
      );
    });
  },
};
