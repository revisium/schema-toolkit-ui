import { Box, Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { LuArrowDown, LuArrowUp } from 'react-icons/lu';
import type { SortModel } from '../../../Sortings/model/SortModel.js';

interface SortIndicatorProps {
  field: string;
  sortModel: SortModel;
}

export const SortIndicator = observer(
  ({ field, sortModel }: SortIndicatorProps) => {
    const direction = sortModel.getSortDirection(field);
    const sortIndex = sortModel.getSortIndex(field);
    const showIndex = sortModel.sortCount > 1;

    if (!direction) {
      return null;
    }

    return (
      <Flex
        alignItems="center"
        gap="1px"
        color="blue.500"
        fontSize="xs"
        flexShrink={0}
        data-testid={`sort-indicator-${field}`}
      >
        {direction === 'asc' ? (
          <LuArrowUp size={12} />
        ) : (
          <LuArrowDown size={12} />
        )}
        {showIndex && sortIndex !== null && (
          <Box as="span" fontSize="10px" fontWeight="medium" lineHeight={1}>
            {sortIndex}
          </Box>
        )}
      </Flex>
    );
  },
);
