import { observer } from 'mobx-react-lite';
import { Box, Checkbox, Flex } from '@chakra-ui/react';
import type { RowVM } from '../model/RowVM.js';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { SearchForeignKeySearchFn } from '../../../search-foreign-key/index.js';
import { CellRenderer } from './Cell/CellRenderer.js';
import { RowActionsMenu } from './RowActionsMenu/RowActionsMenu.js';

interface DataRowProps {
  row: RowVM;
  columnsModel: ColumnsModel;
  showSelection: boolean;
  onSearchForeignKey?: SearchForeignKeySearchFn;
  onSelectRow?: (rowId: string) => void;
  onDuplicateRow?: (rowId: string) => void;
  onDeleteRow?: (rowId: string) => void;
}

const ROW_HEIGHT = '40px';

export const DataRow = observer(
  ({
    row,
    columnsModel,
    showSelection,
    onSearchForeignKey,
    onSelectRow,
    onDuplicateRow,
    onDeleteRow,
  }: DataRowProps) => {
    const hasRowMenu = Boolean(onSelectRow || onDuplicateRow || onDeleteRow);

    return (
      <Flex
        className="group"
        height={ROW_HEIGHT}
        borderBottom="1px solid"
        borderColor="gray.100"
        position="relative"
        data-testid={`row-${row.rowId}`}
      >
        {showSelection && (
          <Flex
            width="40px"
            minWidth="40px"
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
            borderRight="1px solid"
            borderColor="gray.100"
          >
            <Checkbox.Root
              checked={row.isSelected}
              onCheckedChange={() => row.toggleSelection()}
              size="sm"
              data-testid={`select-${row.rowId}`}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control />
            </Checkbox.Root>
          </Flex>
        )}
        {columnsModel.visibleColumns.map((col) => {
          const width = columnsModel.getColumnWidth(col.field);
          const cellVM = row.getCellVM(col);
          return (
            <Box
              key={col.field}
              flexShrink={0}
              width={width ? `${width}px` : '150px'}
              minWidth="40px"
              borderRight="1px solid"
              borderColor="gray.100"
              position="relative"
            >
              <CellRenderer
                cell={cellVM}
                onSearchForeignKey={onSearchForeignKey}
              />
            </Box>
          );
        })}
        <Box flex={1} />
        {hasRowMenu && (
          <RowActionsMenu
            rowId={row.rowId}
            onSelect={onSelectRow}
            onDuplicate={onDuplicateRow}
            onDelete={onDeleteRow}
          />
        )}
      </Flex>
    );
  },
);
