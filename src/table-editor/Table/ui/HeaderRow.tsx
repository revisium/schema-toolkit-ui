import { observer } from 'mobx-react-lite';
import { Box } from '@chakra-ui/react';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { FilterModel } from '../../Filters/model/FilterModel.js';
import type { SortModel } from '../../Sortings/model/SortModel.js';
import { ColumnHeader } from './Header/ColumnHeader.js';
import { AddColumnButton } from './Header/AddColumnButton.js';

interface HeaderRowProps {
  columnsModel: ColumnsModel;
  sortModel?: SortModel;
  filterModel?: FilterModel;
  onCopyPath?: (path: string) => void;
  showSelection?: boolean;
}

export const HeaderRow = observer(
  ({
    columnsModel,
    sortModel,
    filterModel,
    onCopyPath,
    showSelection,
  }: HeaderRowProps) => {
    return (
      <Box as="tr" height="40px">
        {showSelection && (
          <Box
            as="th"
            width="40px"
            minWidth="40px"
            maxWidth="40px"
            bg="gray.50"
            borderRight="1px solid"
            borderColor="gray.100"
            borderBottom="1px solid"
            borderBottomColor="gray.200"
            p={0}
          />
        )}
        {columnsModel.visibleColumns.map((col) => (
          <ColumnHeader
            key={col.field}
            column={col}
            columnsModel={columnsModel}
            sortModel={sortModel}
            filterModel={filterModel}
            onCopyPath={onCopyPath}
          />
        ))}
        <Box
          as="th"
          width="100%"
          bg="gray.50"
          borderBottom="1px solid"
          borderBottomColor="gray.200"
          p={0}
        />
        <Box
          as="th"
          bg="gray.50"
          borderBottom="1px solid"
          borderBottomColor="gray.200"
          p={0}
        >
          <AddColumnButton columnsModel={columnsModel} />
        </Box>
      </Box>
    );
  },
);
