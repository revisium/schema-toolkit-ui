import { observer } from 'mobx-react-lite';
import { Flex } from '@chakra-ui/react';
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
}

const ROW_HEIGHT = '40px';

export const HeaderRow = observer(
  ({ columnsModel, sortModel, filterModel, onCopyPath }: HeaderRowProps) => {
    return (
      <Flex
        height={ROW_HEIGHT}
        borderBottom="1px solid"
        borderColor="gray.200"
        bg="gray.50"
        flexShrink={0}
      >
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
        <AddColumnButton columnsModel={columnsModel} />
      </Flex>
    );
  },
);
