import { observer } from 'mobx-react-lite';
import { Box, HStack, IconButton, Text } from '@chakra-ui/react';
import { LuArrowDown, LuArrowUp, LuX } from 'react-icons/lu';
import type { SortEntry } from '../model/types.js';
import type { SortModel } from '../model/SortModel.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { SortFieldSelect } from './SortFieldSelect.js';

interface SortRowProps {
  sort: SortEntry;
  index: number;
  model: SortModel;
  availableFields: ColumnSpec[];
}

export const SortRow = observer(
  ({ sort, index, model, availableFields }: SortRowProps) => {
    const handleFieldChange = (newField: string) => {
      model.removeSort(sort.field);
      model.addSort(newField, sort.direction);
    };

    return (
      <HStack gap={2} data-testid="sort-row">
        <Text fontSize="sm" color="gray.400" minW="20px">
          {index + 1}.
        </Text>
        <SortFieldSelect
          currentField={sort.field}
          availableFields={availableFields}
          usedFields={model.sorts.map((s) => s.field)}
          onChange={handleFieldChange}
        />
        <IconButton
          aria-label={
            sort.direction === 'asc' ? 'Sort ascending' : 'Sort descending'
          }
          variant="ghost"
          size="xs"
          onClick={() => model.toggleDirection(sort.field)}
          data-testid="toggle-direction"
        >
          {sort.direction === 'asc' ? <LuArrowUp /> : <LuArrowDown />}
        </IconButton>
        <Box flex={1}>
          <Text fontSize="xs" color="gray.500">
            {sort.direction === 'asc' ? 'A → Z' : 'Z → A'}
          </Text>
        </Box>
        <IconButton
          aria-label="Remove sort"
          variant="ghost"
          size="xs"
          onClick={() => model.removeSort(sort.field)}
          data-testid="remove-sort"
        >
          <LuX />
        </IconButton>
      </HStack>
    );
  },
);
