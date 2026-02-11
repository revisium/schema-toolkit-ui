import { useCallback, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within, waitFor, userEvent } from 'storybook/test';
import type { JsonSchema } from '@revisium/schema-toolkit';
import { createTableModel } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../../lib/initReactivity.js';
import { FilterFieldType } from '../../../../shared/field-types.js';
import type { SearchForeignKeySearchFn } from '../../../../../search-foreign-key/index.js';
import type { ColumnSpec } from '../../../../Columns/model/types.js';
import { CellFSM } from '../../../model/CellFSM.js';
import { CellVM } from '../../../model/CellVM.js';
import { CellRenderer } from '../CellRenderer';

ensureReactivityProvider();

type FieldDef =
  | 'string'
  | 'number'
  | 'boolean'
  | {
      type: 'string' | 'number' | 'boolean';
      readOnly?: boolean;
      formula?: string;
    };

function createSchema(fields: Record<string, FieldDef>): JsonSchema {
  const properties: Record<string, JsonSchema> = {};
  for (const [name, def] of Object.entries(fields)) {
    const type = typeof def === 'string' ? def : def.type;
    const readOnly = typeof def === 'object' ? def.readOnly : undefined;
    const formula = typeof def === 'object' ? def.formula : undefined;

    const prop: Record<string, unknown> = { type };
    if (type === 'string') {
      prop.default = '';
    } else if (type === 'number') {
      prop.default = 0;
    } else if (type === 'boolean') {
      prop.default = false;
    }
    if (readOnly) {
      prop.readOnly = true;
    }
    if (formula) {
      prop['x-formula'] = { version: 1, expression: formula };
    }
    properties[name] = prop as JsonSchema;
  }
  return {
    type: 'object',
    properties,
    additionalProperties: false,
    required: Object.keys(fields),
  };
}

function createColumn(
  field: string,
  fieldType: FilterFieldType,
  options: Partial<ColumnSpec> = {},
): ColumnSpec {
  return {
    field,
    label: field,
    fieldType,
    isSystem: false,
    isDeprecated: false,
    hasFormula: false,
    ...options,
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

interface StoryWrapperProps {
  field: string;
  fieldType: FilterFieldType;
  schema: JsonSchema;
  initialData: Record<string, unknown>;
  foreignKeyTableId?: string;
}

const StoryWrapper = observer(
  ({
    field,
    fieldType,
    schema,
    initialData,
    foreignKeyTableId,
  }: StoryWrapperProps) => {
    const [state] = useState(() => {
      const cellFSM = new CellFSM();
      const tableModel = createTableModel({
        tableId: 'cell-test',
        schema: schema as any,
        rows: [{ rowId: 'row-1', data: initialData }],
      });
      const rowModel = tableModel.rows[0];
      const column = createColumn(field, fieldType, { foreignKeyTableId });
      const cell = new CellVM(rowModel, column, 'row-1', cellFSM);
      cellFSM.setNavigationContext([field], ['row-1']);
      return { cell };
    });

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        const isMod = e.ctrlKey || e.metaKey;
        if (isMod && e.key === 'v' && state.cell.isFocused) {
          e.preventDefault();
          void state.cell.pasteFromClipboard();
        }
      },
      [state.cell],
    );

    return (
      <Box
        width="200px"
        borderWidth="1px"
        borderColor="gray.200"
        onKeyDown={handleKeyDown}
      >
        <CellRenderer
          cell={state.cell}
          onSearchForeignKey={mockSearchForeignKey}
        />
      </Box>
    );
  },
);

const meta: Meta<typeof StoryWrapper> = {
  component: StoryWrapper as any,
  title: 'TableEditor/CellRenderer/Readonly',
  decorators: [(Story) => <Story />],
};
export default meta;
type Story = StoryObj<typeof StoryWrapper>;

export const ReadonlyCellFocus: Story = {
  tags: ['test'],
  args: {
    field: 'greeting',
    fieldType: FilterFieldType.String,
    schema: createSchema({
      greeting: { type: 'string', readOnly: true },
    }),
    initialData: { greeting: 'Hello, World' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-greeting');

    expect(cell).toHaveTextContent('Hello, World');
    expect(cell).toHaveAttribute('tabindex', '-1');

    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });
    expect(cell).toHaveTextContent('readonly');

    await userEvent.keyboard('{Enter}');
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="string-cell-input"]'),
      ).toBeNull();
    });
    expect(cell).toHaveAttribute('tabindex', '0');

    await userEvent.keyboard('X');
    expect(
      document.querySelector('[data-testid="string-cell-input"]'),
    ).toBeNull();
    expect(cell).toHaveAttribute('tabindex', '0');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const FormulaCell: Story = {
  args: {
    field: 'greeting',
    fieldType: FilterFieldType.String,
    schema: createSchema({
      name: 'string',
      greeting: { type: 'string', readOnly: true, formula: '"Hello, " + name' },
    }),
    initialData: { name: 'Alice' },
  },
};

export const ReadonlyNumberCell: Story = {
  args: {
    field: 'total',
    fieldType: FilterFieldType.Number,
    schema: createSchema({
      total: { type: 'number', readOnly: true },
    }),
    initialData: { total: 1998 },
  },
};

export const ReadonlyBooleanCell: Story = {
  args: {
    field: 'expensive',
    fieldType: FilterFieldType.Boolean,
    schema: createSchema({
      expensive: { type: 'boolean', readOnly: true },
    }),
    initialData: { expensive: true },
  },
};

export const ReadonlyNumberCellFocus: Story = {
  tags: ['test'],
  args: {
    field: 'total',
    fieldType: FilterFieldType.Number,
    schema: createSchema({
      total: { type: 'number', readOnly: true },
    }),
    initialData: { total: 1998 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-total');

    expect(cell).toHaveTextContent('1998');

    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });
    expect(cell).toHaveTextContent('readonly');

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
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const CopyPasteInteractions: Story = {
  tags: ['test'],
  args: {
    field: 'name',
    fieldType: FilterFieldType.String,
    schema: createSchema({ name: 'string' }),
    initialData: { name: 'Hello' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-name');

    let clipboardText = '';
    const mockClipboard = {
      writeText: (text: string) => {
        clipboardText = text;
        return Promise.resolve();
      },
      readText: () => Promise.resolve(clipboardText),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    });

    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });

    await userEvent.keyboard('{Control>}c{/Control}');
    expect(clipboardText).toBe('Hello');

    clipboardText = 'Pasted';
    await userEvent.keyboard('{Control>}v{/Control}');
    await waitFor(() => {
      expect(cell).toHaveTextContent('Pasted');
    });

    expect(clipboardText).toBe('Pasted');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};

export const ReadonlyBooleanCellFocus: Story = {
  tags: ['test'],
  args: {
    field: 'expensive',
    fieldType: FilterFieldType.Boolean,
    schema: createSchema({
      expensive: { type: 'boolean', readOnly: true },
    }),
    initialData: { expensive: true },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const cell = canvas.getByTestId('cell-row-1-expensive');

    expect(cell).toHaveTextContent('true');

    await userEvent.click(cell);
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '0');
    });
    expect(cell).toHaveTextContent('readonly');

    await userEvent.dblClick(cell);
    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="boolean-option-true"]'),
      ).toBeNull();
    });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(cell).toHaveAttribute('tabindex', '-1');
    });
  },
};
