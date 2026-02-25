import { useState } from 'react';
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
    name: { type: 'string', default: '' },
    age: { type: 'number', default: 0 },
    active: { type: 'boolean', default: false },
  },
  additionalProperties: false,
  required: ['name', 'age', 'active'],
};

const MultiCellWrapper = observer(() => {
  const [state] = useState(() => {
    const cellFSM = new CellFSM();
    const tableModel = createTableModel({
      tableId: 'cell-test',
      schema: wrapDataSchema(schema) as any,
      rows: [
        {
          rowId: 'row-1',
          data: { data: { name: 'Hello', age: 42, active: true } },
        },
      ],
    });
    const rowModel = tableModel.rows[0] as RowModel;

    const nameColumn = createColumn('data.name', FilterFieldType.String);
    const ageColumn = createColumn('data.age', FilterFieldType.Number);
    const activeColumn = createColumn('data.active', FilterFieldType.Boolean);

    const nameCell = new CellVM(rowModel, nameColumn, 'row-1', cellFSM);
    const ageCell = new CellVM(rowModel, ageColumn, 'row-1', cellFSM);
    const activeCell = new CellVM(rowModel, activeColumn, 'row-1', cellFSM);

    cellFSM.setNavigationContext(
      ['data.name', 'data.age', 'data.active'],
      ['row-1'],
    );

    return { nameCell, ageCell, activeCell };
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isMod = e.ctrlKey || e.metaKey;
    const focusedCell = [state.nameCell, state.ageCell, state.activeCell].find(
      (c) => c.isFocused,
    );
    if (isMod && e.key === 'v' && focusedCell) {
      e.preventDefault();
      void focusedCell.pasteFromClipboard();
    }
  };

  return (
    <Flex direction="column" gap="8px" onKeyDown={handleKeyDown}>
      <Box width="200px" data-testid="string-cell-wrapper">
        <CellRenderer
          cell={state.nameCell}
          onSearchForeignKey={mockSearchForeignKey}
        />
      </Box>
      <Box width="200px" data-testid="number-cell-wrapper">
        <CellRenderer
          cell={state.ageCell}
          onSearchForeignKey={mockSearchForeignKey}
        />
      </Box>
      <Box width="200px" data-testid="boolean-cell-wrapper">
        <CellRenderer
          cell={state.activeCell}
          onSearchForeignKey={mockSearchForeignKey}
        />
      </Box>
    </Flex>
  );
});

const meta: Meta<typeof MultiCellWrapper> = {
  component: MultiCellWrapper as any,
  title: 'TableEditor/E2E/Cell/CellRenderer',
  decorators: [(Story) => <Story />],
};
export default meta;
type Story = StoryObj<typeof MultiCellWrapper>;

export const CellRendererWorkflow: Story = {
  tags: ['test'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // --- String cell interactions ---
    const stringCell = canvas.getByTestId('cell-row-1-data.name');

    await userEvent.click(stringCell);
    await waitFor(() => {
      expect(stringCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(stringCell).toHaveAttribute('tabindex', '-1');
    });

    await userEvent.dblClick(stringCell);
    const input = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.clear(input);
    await userEvent.type(input, 'New Value');
    input.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveTextContent(
        'New Value',
      );
    });

    await userEvent.click(stringCell);
    await waitFor(() => {
      expect(stringCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Enter}');
    const input2 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.type(input2, ' World');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="string-cell-input"]'),
      ).toBeNull();
    });
    expect(canvas.getByTestId('cell-row-1-data.name')).toHaveTextContent(
      'New Value',
    );

    await waitFor(() => {
      expect(stringCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('X');
    const input3 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    expect(input3.value).toBe('X');
    input3.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveTextContent('X');
    });

    await waitFor(() => {
      expect(stringCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('1');
    const input4 = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="string-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    expect(input4.value).toBe('1');
    input4.blur();
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveTextContent('1');
    });

    await waitFor(() => {
      expect(stringCell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Delete}');
    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.name')).toHaveTextContent('');
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(stringCell).toHaveAttribute('tabindex', '-1');
    });

    // --- Boolean cell interactions ---
    const booleanCell = canvas.getByTestId('cell-row-1-data.active');

    expect(booleanCell).toHaveTextContent('true');

    await userEvent.click(booleanCell);

    await userEvent.dblClick(booleanCell);

    const falseOption = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="boolean-option-false"]',
      ) as HTMLElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.click(falseOption);

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.active')).toHaveTextContent(
        'false',
      );
    });

    // --- Number cell interactions ---
    const numberCell = canvas.getByTestId('cell-row-1-data.age');

    expect(numberCell).toHaveTextContent('42');

    await userEvent.dblClick(numberCell);

    const numberInput = await waitFor(() => {
      const el = document.querySelector(
        '[data-testid="number-cell-input"]',
      ) as HTMLTextAreaElement;
      expect(el).toBeTruthy();
      return el;
    });

    await userEvent.clear(numberInput);
    await userEvent.type(numberInput, '99');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(canvas.getByTestId('cell-row-1-data.age')).toHaveTextContent('99');
    });
  },
};
