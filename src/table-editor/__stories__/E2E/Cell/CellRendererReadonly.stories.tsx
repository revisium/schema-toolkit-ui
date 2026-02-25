import { useCallback, useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import type { Meta, StoryObj } from '@storybook/react';
import { observer } from 'mobx-react-lite';
import type { JsonSchema, RowModel } from '@revisium/schema-toolkit';
import { createTableModel } from '@revisium/schema-toolkit';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import { ensureReactivityProvider } from '../../../../lib/initReactivity.js';
import { wrapDataSchema } from '../../../TableEditor/model/SchemaContext.js';
import type { SearchForeignKeySearchFn } from '../../../../search-foreign-key/index.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { FilterFieldType } from '../../../shared/field-types.js';
import { CellFSM } from '../../../Table/model/CellFSM.js';
import { CellVM } from '../../../Table/model/CellVM.js';
import { CellRenderer } from '../../../Table/ui/Cell/CellRenderer.js';
import { mockClipboard } from '../../helpers.js';

ensureReactivityProvider();

function createColumn(field: string, fieldType: FilterFieldType): ColumnSpec {
  return {
    field,
    label: field.replace(/^data\./, ''),
    fieldType,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    isSortable: true,
  };
}

const mockSearchForeignKey: SearchForeignKeySearchFn = (
  _tableId: string,
  search: string,
) => {
  const allIds = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'];
  const filtered = search ? allIds.filter((id) => id.includes(search)) : allIds;
  return Promise.resolve({ ids: filtered, hasMore: false });
};

const schema: JsonSchema = {
  type: 'object',
  properties: {
    greeting: { type: 'string', default: '', readOnly: true },
    total: { type: 'number', default: 0, readOnly: true },
    expensive: { type: 'boolean', default: false, readOnly: true },
    name: { type: 'string', default: '' },
  },
  additionalProperties: false,
  required: ['greeting', 'total', 'expensive', 'name'],
};

const MultiReadonlyWrapper = observer(() => {
  const [state] = useState(() => {
    const cellFSM = new CellFSM();
    const tableModel = createTableModel({
      tableId: 'cell-test',
      schema: wrapDataSchema(schema) as any,
      rows: [
        {
          rowId: 'row-1',
          data: {
            data: {
              greeting: 'Hello, World',
              total: 1998,
              expensive: true,
              name: 'Hello',
            },
          },
        },
      ],
    });
    const rowModel = tableModel.rows[0] as RowModel;

    const greetingColumn = createColumn(
      'data.greeting',
      FilterFieldType.String,
    );
    const totalColumn = createColumn('data.total', FilterFieldType.Number);
    const expensiveColumn = createColumn(
      'data.expensive',
      FilterFieldType.Boolean,
    );
    const nameColumn = createColumn('data.name', FilterFieldType.String);

    const greetingCell = new CellVM(rowModel, greetingColumn, 'row-1', cellFSM);
    const totalCell = new CellVM(rowModel, totalColumn, 'row-1', cellFSM);
    const expensiveCell = new CellVM(
      rowModel,
      expensiveColumn,
      'row-1',
      cellFSM,
    );
    const nameCell = new CellVM(rowModel, nameColumn, 'row-1', cellFSM);

    cellFSM.setNavigationContext(
      ['data.greeting', 'data.total', 'data.expensive', 'data.name'],
      ['row-1'],
    );

    return { greetingCell, totalCell, expensiveCell, nameCell };
  });

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const focusedCell = [
        state.greetingCell,
        state.totalCell,
        state.expensiveCell,
        state.nameCell,
      ].find((c) => c.isFocused);
      if (isMod && e.key === 'v' && focusedCell) {
        e.preventDefault();
        void focusedCell.pasteFromClipboard();
      }
    },
    [state],
  );

  return (
    <Flex direction="column" gap="8px" onKeyDown={handleKeyDown}>
      <Box width="200px" data-testid="readonly-string-wrapper">
        <CellRenderer
          cell={state.greetingCell}
          onSearchForeignKey={mockSearchForeignKey}
        />
      </Box>
      <Box width="200px" data-testid="readonly-number-wrapper">
        <CellRenderer
          cell={state.totalCell}
          onSearchForeignKey={mockSearchForeignKey}
        />
      </Box>
      <Box width="200px" data-testid="regular-string-wrapper">
        <CellRenderer
          cell={state.nameCell}
          onSearchForeignKey={mockSearchForeignKey}
        />
      </Box>
      <Box width="200px" data-testid="readonly-boolean-wrapper">
        <CellRenderer
          cell={state.expensiveCell}
          onSearchForeignKey={mockSearchForeignKey}
        />
      </Box>
    </Flex>
  );
});

const meta: Meta<typeof MultiReadonlyWrapper> = {
  component: MultiReadonlyWrapper as any,
  title: 'TableEditor/E2E/Cell/Readonly',
  decorators: [(Story) => <Story />],
};
export default meta;
type Story = StoryObj<typeof MultiReadonlyWrapper>;

export const ReadonlyCellWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- Readonly string cell interactions ---
    const greetingCell = canvas.getByTestId('cell-row-1-data.greeting');

    expect(greetingCell).toHaveTextContent('Hello, World');
    expect(greetingCell).toHaveAttribute('tabindex', '-1');

    await userEvent.click(greetingCell);
    await waitFor(() => {
      expect(greetingCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="string-cell-input"]'),
      ).toBeNull();
    });
    expect(greetingCell).toHaveAttribute('tabindex', '0');

    await userEvent.keyboard('X');
    expect(
      document.querySelector('[data-testid="string-cell-input"]'),
    ).toBeNull();
    expect(greetingCell).toHaveAttribute('tabindex', '0');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(greetingCell).toHaveAttribute('tabindex', '-1');
    });

    // --- Readonly number cell interactions ---
    const totalCell = canvas.getByTestId('cell-row-1-data.total');

    expect(totalCell).toHaveTextContent('1998');

    await userEvent.click(totalCell);
    await waitFor(() => {
      expect(totalCell).toHaveAttribute('tabindex', '0');
    });
    await userEvent.keyboard('{Enter}');
    expect(
      document.querySelector('[data-testid="number-cell-input"]'),
    ).toBeNull();

    await userEvent.keyboard('5');
    expect(
      document.querySelector('[data-testid="number-cell-input"]'),
    ).toBeNull();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(totalCell).toHaveAttribute('tabindex', '-1');
    });

    // --- Copy/paste interactions (regular string cell) ---
    const nameCell = canvas.getByTestId('cell-row-1-data.name');

    const clipboard = mockClipboard();

    await userEvent.click(nameCell);
    await waitFor(() => {
      expect(nameCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Control>}c{/Control}');
    expect(clipboard.getText()).toBe('Hello');

    clipboard.setText('Pasted');
    await userEvent.keyboard('{Control>}v{/Control}');
    await waitFor(() => {
      expect(nameCell).toHaveTextContent('Pasted');
    });

    expect(clipboard.getText()).toBe('Pasted');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(nameCell).toHaveAttribute('tabindex', '-1');
    });

    // --- Readonly boolean cell interactions ---
    const expensiveCell = canvas.getByTestId('cell-row-1-data.expensive');

    expect(expensiveCell).toHaveTextContent('true');

    await userEvent.click(expensiveCell);
    await waitFor(() => {
      expect(expensiveCell).toHaveAttribute('tabindex', '0');
    });
    await userEvent.dblClick(expensiveCell);
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="boolean-option-true"]'),
      ).toBeNull();
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(expensiveCell).toHaveAttribute('tabindex', '-1');
    });
  },
};
