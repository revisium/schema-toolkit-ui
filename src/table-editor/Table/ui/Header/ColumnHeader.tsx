import { useState } from 'react';
import { Box, Flex, Menu, Portal, Text } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import type { ColumnsModel } from '../../../Columns/model/ColumnsModel.js';
import type { FilterModel } from '../../../Filters/model/FilterModel.js';
import type { SortModel } from '../../../Sortings/model/SortModel.js';
import { ResizeHandle } from '../ResizeHandle.js';
import { SortIndicator } from './SortIndicator.js';
import { ColumnHeaderMenu } from './ColumnHeaderMenu.js';

interface ColumnHeaderProps {
  column: ColumnSpec;
  columnsModel: ColumnsModel;
  sortModel?: SortModel;
  filterModel?: FilterModel;
  onCopyPath?: (path: string) => void;
}

export const ColumnHeader = observer(
  ({
    column,
    columnsModel,
    sortModel,
    filterModel,
    onCopyPath,
  }: ColumnHeaderProps) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const width = columnsModel.getColumnWidth(column.field);

    return (
      <Box
        position="relative"
        flexShrink={0}
        width={width ? `${width}px` : '150px'}
        minWidth="40px"
        borderRight="1px solid"
        borderColor="gray.100"
      >
        <Menu.Root
          positioning={{ placement: 'bottom-end' }}
          lazyMount
          unmountOnExit
          open={isMenuOpen}
          onOpenChange={(details) => setIsMenuOpen(details.open)}
        >
          <Menu.Trigger asChild>
            <Flex
              alignItems="center"
              height="100%"
              px="8px"
              gap="4px"
              cursor="pointer"
              transition="background 0.15s"
              overflow="hidden"
              _hover={{ bg: 'gray.100' }}
              data-testid={`header-${column.field}`}
            >
              <Text
                fontSize="sm"
                fontWeight="500"
                color="gray.600"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
                flex={1}
                minWidth={0}
                textDecoration={
                  column.isDeprecated ? 'line-through' : undefined
                }
              >
                {column.label}
              </Text>
              {sortModel && !column.hasFormula && (
                <SortIndicator field={column.field} sortModel={sortModel} />
              )}
            </Flex>
          </Menu.Trigger>
          <Portal>
            <Menu.Positioner>
              <ColumnHeaderMenu
                column={column}
                columnsModel={columnsModel}
                sortModel={sortModel}
                filterModel={filterModel}
                onCopyPath={onCopyPath}
              />
            </Menu.Positioner>
          </Portal>
        </Menu.Root>
        <ResizeHandle field={column.field} columnsModel={columnsModel} />
      </Box>
    );
  },
);
