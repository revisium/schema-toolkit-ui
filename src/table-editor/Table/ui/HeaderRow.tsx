import { observer } from 'mobx-react-lite';
import { Box, Flex, Text } from '@chakra-ui/react';
import type { ColumnsModel } from '../../Columns/model/ColumnsModel.js';
import { ResizeHandle } from './ResizeHandle.js';

interface HeaderRowProps {
  columnsModel: ColumnsModel;
}

const ROW_HEIGHT = '40px';

export const HeaderRow = observer(({ columnsModel }: HeaderRowProps) => {
  return (
    <Flex
      height={ROW_HEIGHT}
      borderBottom="1px solid"
      borderColor="gray.200"
      bg="gray.50"
      flexShrink={0}
    >
      {columnsModel.visibleColumns.map((col) => {
        const width = columnsModel.getColumnWidth(col.field);
        return (
          <Box
            key={col.field}
            position="relative"
            flexShrink={0}
            width={width ? `${width}px` : '150px'}
            minWidth="40px"
            borderRight="1px solid"
            borderColor="gray.100"
            data-testid={`header-${col.field}`}
          >
            <Flex alignItems="center" height="100%" px="8px" overflow="hidden">
              <Text
                fontSize="sm"
                fontWeight="500"
                color="gray.600"
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                overflow="hidden"
              >
                {col.label}
              </Text>
            </Flex>
            <ResizeHandle field={col.field} columnsModel={columnsModel} />
          </Box>
        );
      })}
      <Box flex={1} />
    </Flex>
  );
});
