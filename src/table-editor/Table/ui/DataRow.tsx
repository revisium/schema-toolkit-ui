import { observer } from 'mobx-react-lite';
import { Box, Checkbox, Flex } from '@chakra-ui/react';
import type { RowVM } from '../model/RowVM.js';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { SearchForeignKeySearchFn } from '../../../search-foreign-key/index.js';
import { CellRenderer } from './Cell/CellRenderer.js';

interface DataRowProps {
  row: RowVM;
  columnsModel: ColumnsModel;
  showSelection: boolean;
  onSearchForeignKey?: SearchForeignKeySearchFn;
}

const ROW_HEIGHT = '40px';

export const DataRow = observer(
  ({ row, columnsModel, showSelection, onSearchForeignKey }: DataRowProps) => {
    return (
      <Flex
        height={ROW_HEIGHT}
        borderBottom="1px solid"
        borderColor="gray.100"
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
      </Flex>
    );
  },
);
