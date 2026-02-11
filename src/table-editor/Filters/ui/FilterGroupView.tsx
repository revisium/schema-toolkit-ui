import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  HStack,
  IconButton,
  Text,
  VStack,
} from '@chakra-ui/react';
import { PiPlusBold, PiXBold } from 'react-icons/pi';
import type { FilterModel } from '../model/FilterModel.js';
import type { FilterGroup } from '../model/types.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { FilterConditionView } from './FilterConditionView.js';

interface FilterGroupViewProps {
  model: FilterModel;
  group: FilterGroup;
  availableFields: ColumnSpec[];
  isRoot?: boolean;
}

export const FilterGroupView = observer(
  ({ model, group, availableFields, isRoot = false }: FilterGroupViewProps) => {
    const content = (
      <>
        <HStack gap={2} alignItems="center">
          <Text fontSize="sm">Match</Text>
          <Button
            variant={group.logic === 'and' ? 'solid' : 'outline'}
            size="2xs"
            onClick={() => model.setGroupLogic(group.id, 'and')}
            data-testid="logic-and"
          >
            AND
          </Button>
          <Button
            variant={group.logic === 'or' ? 'solid' : 'outline'}
            size="2xs"
            onClick={() => model.setGroupLogic(group.id, 'or')}
            data-testid="logic-or"
          >
            OR
          </Button>
          <Text fontSize="sm">of the following</Text>
          {!isRoot && (
            <IconButton
              aria-label="Remove group"
              variant="ghost"
              size="2xs"
              ml="auto"
              onClick={() => model.removeGroup(group.id)}
              data-testid="remove-group"
            >
              <PiXBold />
            </IconButton>
          )}
        </HStack>

        {group.conditions.length > 0 && (
          <VStack gap={2} alignItems="stretch">
            {group.conditions.map((c) => (
              <FilterConditionView
                key={c.id}
                model={model}
                condition={c}
                availableFields={availableFields}
              />
            ))}
          </VStack>
        )}

        {group.groups.map((g) => (
          <FilterGroupView
            key={g.id}
            model={model}
            group={g}
            availableFields={availableFields}
            isRoot={false}
          />
        ))}

        <HStack gap={2}>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => model.addCondition(group.id)}
            data-testid="add-condition"
          >
            <PiPlusBold />
            Add condition
          </Button>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => model.addGroup(group.id)}
            data-testid="add-group"
          >
            <PiPlusBold />
            Add group
          </Button>
        </HStack>
      </>
    );

    if (isRoot) {
      return (
        <VStack gap={3} alignItems="stretch">
          {content}
        </VStack>
      );
    }

    return (
      <Box
        border="1px solid"
        borderColor="gray.200"
        bg="gray.50"
        p={3}
        borderRadius="md"
        data-testid="filter-group"
      >
        <VStack gap={3} alignItems="stretch">
          {content}
        </VStack>
      </Box>
    );
  },
);
