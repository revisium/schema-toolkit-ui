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
      <>
        {showSelection && (
          <Box
            as="td"
            width="40px"
            minWidth="40px"
            maxWidth="40px"
            borderRight="1px solid"
            borderColor="gray.100"
            p={0}
          >
            <Flex alignItems="center" justifyContent="center" height="100%">
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
          </Box>
        )}
        {columnsModel.visibleColumns.map((col) => {
          const cellVM = row.getCellVM(col);
          return (
            <Box
              as="td"
              key={col.field}
              maxWidth="0"
              overflow="hidden"
              borderRight="1px solid"
              borderColor="gray.100"
              position="relative"
              p={0}
            >
              <CellRenderer
                cell={cellVM}
                onSearchForeignKey={onSearchForeignKey}
              />
            </Box>
          );
        })}
        <Box as="td" width="100%" p={0} />
        {hasRowMenu && (
          <Box as="td" position="relative" width="40px" p={0}>
            <RowActionsMenu
              rowId={row.rowId}
              onSelect={onSelectRow}
              onDuplicate={onDuplicateRow}
              onDelete={onDeleteRow}
            />
          </Box>
        )}
      </>
    );
  },
);
