import { Flex } from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { LuFilter } from 'react-icons/lu';
import type { FilterModel } from '../../../Filters/model/FilterModel.js';

interface FilterIndicatorProps {
  field: string;
  filterModel: FilterModel;
}

export const FilterIndicator = observer(
  ({ field, filterModel }: FilterIndicatorProps) => {
    if (!filterModel.hasFilterForField(field)) {
      return null;
    }

    return (
      <Flex
        alignItems="center"
        color="gray.400"
        flexShrink={0}
        data-testid={`filter-indicator-${field}`}
      >
        <LuFilter size={12} />
      </Flex>
    );
  },
);
