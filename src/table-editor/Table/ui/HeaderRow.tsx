import { observer } from 'mobx-react-lite';
import { Box } from '@chakra-ui/react';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import type { FilterModel } from '../../Filters/model/FilterModel.js';
import type { SortModel } from '../../Sortings/model/SortModel.js';
import { ColumnHeader } from './Header/ColumnHeader.js';
import type { StickyPosition } from './Header/ColumnHeader.js';
import { AddColumnButton } from './Header/AddColumnButton.js';

const SELECTION_COLUMN_WIDTH = 40;
const ADD_COLUMN_BUTTON_WIDTH = 40;
const BOTTOM_BORDER_SHADOW = 'inset 0 -1px 0 0 var(--chakra-colors-gray-100)';

interface HeaderRowProps {
  columnsModel: ColumnsModel;
  sortModel?: SortModel;
  filterModel?: FilterModel;
  onCopyPath?: (path: string) => void;
  showSelection?: boolean;
  showLeftShadow?: boolean;
  showRightShadow?: boolean;
}

export const HeaderRow = observer(
  ({
    columnsModel,
    sortModel,
    filterModel,
    onCopyPath,
    showSelection,
    showLeftShadow,
    showRightShadow,
  }: HeaderRowProps) => {
    const selectionWidth = showSelection ? SELECTION_COLUMN_WIDTH : 0;
    const addColumnStickyRight = columnsModel.hasHiddenColumns;

    return (
      <Box as="tr" height="40px">
        {showSelection && (
          <Box
            as="th"
            width="40px"
            minWidth="40px"
            maxWidth="40px"
            bg="white"
            p={0}
            position="sticky"
            left={0}
            zIndex={2}
            boxShadow={BOTTOM_BORDER_SHADOW}
          />
        )}
        {columnsModel.visibleColumns.map((col) => {
          const stickyPosition = getStickyPosition(
            col.field,
            columnsModel,
            selectionWidth,
            addColumnStickyRight,
          );
          return (
            <ColumnHeader
              key={col.field}
              column={col}
              columnsModel={columnsModel}
              sortModel={sortModel}
              filterModel={filterModel}
              onCopyPath={onCopyPath}
              stickyPosition={stickyPosition}
              showLeftShadow={showLeftShadow}
              showRightShadow={showRightShadow}
            />
          );
        })}
        <Box
          as="th"
          width="100%"
          bg="white"
          p={0}
          boxShadow={BOTTOM_BORDER_SHADOW}
        />
        <Box
          as="th"
          bg="white"
          p={0}
          position={addColumnStickyRight ? 'sticky' : undefined}
          right={addColumnStickyRight ? 0 : undefined}
          zIndex={addColumnStickyRight ? 2 : undefined}
          boxShadow={BOTTOM_BORDER_SHADOW}
        >
          <AddColumnButton columnsModel={columnsModel} />
        </Box>
      </Box>
    );
  },
);

function getStickyPosition(
  field: string,
  columnsModel: ColumnsModel,
  selectionWidth: number,
  addColumnStickyRight: boolean,
): StickyPosition | undefined {
  const leftOffset = columnsModel.getColumnStickyLeft(field, selectionWidth);
  if (leftOffset !== undefined) {
    return {
      side: 'left',
      offset: leftOffset,
      isBoundary: columnsModel.isStickyLeftBoundary(field),
    };
  }

  const rightBase = columnsModel.getColumnStickyRight(field);
  if (rightBase !== undefined) {
    const addColOffset = addColumnStickyRight ? ADD_COLUMN_BUTTON_WIDTH : 0;
    return {
      side: 'right',
      offset: rightBase + addColOffset,
      isBoundary: columnsModel.isStickyRightBoundary(field),
    };
  }

  return undefined;
}
