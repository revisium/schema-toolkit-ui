import { observer } from 'mobx-react-lite';
import { Box, IconButton, Text } from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';
import type { SortEntry } from '../../model/types.js';
import type { SortModel } from '../../model/SortModel.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { SortFieldSelect } from '../SortFieldSelect/SortFieldSelect.js';
import { SortDirectionSelect } from '../SortDirectionSelect/SortDirectionSelect.js';

interface SortRowProps {
  sort: SortEntry;
  index: number;
  model: SortModel;
  availableFields: ColumnSpec[];
}

export const SortRow = observer(
  ({ sort, index, model, availableFields }: SortRowProps) => {
    const handleFieldChange = (newField: string) => {
      model.replaceField(sort.field, newField);
    };

    const handleDirectionChange = (direction: 'asc' | 'desc') => {
      model.setDirection(sort.field, direction);
    };

    return (
      <Box
        display="flex"
        alignItems="center"
        gap={2}
        h="40px"
        data-testid="sort-row"
      >
        <Text fontSize="md" color="gray.400" minW="20px">
          {index + 1}.
        </Text>
        <SortFieldSelect
          currentField={sort.field}
          availableFields={availableFields}
          onChange={handleFieldChange}
        />
        <SortDirectionSelect
          selectedDirection={sort.direction}
          onSelect={handleDirectionChange}
        />
        <IconButton
          aria-label="Remove sort"
          variant="ghost"
          size="sm"
          borderRadius="lg"
          color="gray.400"
          _hover={{ bg: 'gray.100', color: 'gray.600' }}
          onClick={() => model.removeSort(sort.field)}
          data-testid="remove-sort"
        >
          <LuX size={20} />
        </IconButton>
      </Box>
    );
  },
);
