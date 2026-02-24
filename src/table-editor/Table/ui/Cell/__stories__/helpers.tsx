import { useCallback, useState } from 'react';
import { Box } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { JsonSchema, RowModel } from '@revisium/schema-toolkit';
import { createTableModel } from '@revisium/schema-toolkit';
import { ensureReactivityProvider } from '../../../../../lib/initReactivity.js';
import { wrapDataSchema } from '../../../../TableEditor/model/SchemaContext.js';
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

export function createSchema(fields: Record<string, FieldDef>): JsonSchema {
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
    label: field.replace(/^data\./, ''),
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

export interface StoryWrapperProps {
  field: string;
  fieldType: FilterFieldType;
  schema: JsonSchema;
  initialData: Record<string, unknown>;
  foreignKeyTableId?: string;
}

export const StoryWrapper = observer(
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
        schema: wrapDataSchema(schema) as any,
        rows: [{ rowId: 'row-1', data: { data: initialData } }],
      });
      const rowModel = tableModel.rows[0] as RowModel;
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
      <Box width="200px" onKeyDown={handleKeyDown}>
        <CellRenderer
          cell={state.cell}
          onSearchForeignKey={mockSearchForeignKey}
        />
      </Box>
    );
  },
);
