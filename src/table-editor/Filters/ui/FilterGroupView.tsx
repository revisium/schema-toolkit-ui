import { observer } from 'mobx-react-lite';
import { Box, Button, Menu, Text, VStack } from '@chakra-ui/react';
import { LuChevronDown, LuPlus } from 'react-icons/lu';
import type { FilterModel } from '../model/FilterModel.js';
import type { FilterGroupVM } from '../model/FilterGroupVM.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { FilterConditionView } from './FilterConditionView.js';

interface FilterGroupViewProps {
  model: FilterModel;
  group: FilterGroupVM;
  availableFields: ColumnSpec[];
  isRoot?: boolean;
}

const LogicDropdown = observer(
  ({
    logic,
    onChange,
  }: {
    logic: 'and' | 'or';
    onChange: (logic: 'and' | 'or') => void;
  }) => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Box
          as="button"
          display="flex"
          alignItems="center"
          gap={1}
          px={3}
          h="32px"
          bg="gray.100"
          borderRadius="lg"
          fontWeight="medium"
          fontSize="sm"
          cursor="pointer"
          color="black"
          _hover={{ bg: 'gray.200' }}
          data-testid="logic-select"
        >
          {logic === 'and' ? 'All' : 'Any'}
          <LuChevronDown size={14} />
        </Box>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item
            value="and"
            onClick={() => onChange('and')}
            data-testid="logic-and"
          >
            All
          </Menu.Item>
          <Menu.Item
            value="or"
            onClick={() => onChange('or')}
            data-testid="logic-or"
          >
            Any
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
);

export const FilterGroupView = observer(
  ({ model, group, availableFields, isRoot = false }: FilterGroupViewProps) => {
    if (isRoot) {
      return (
        <VStack gap={3} alignItems="stretch">
          <Box display="flex" alignItems="center" gap={1.5}>
            <Text fontSize="sm" color="gray.500">
              Where
            </Text>
            <LogicDropdown
              logic={group.logic}
              onChange={(logic) => model.setGroupLogic(group.id, logic)}
            />
            <Text fontSize="sm" color="gray.500">
              of the following are true
            </Text>
          </Box>

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
        </VStack>
      );
    }

    return (
      <Box
        border="1px solid"
        borderColor="gray.200"
        bg="rgba(204,204,204,0.1)"
        p={4}
        borderRadius="xl"
        data-testid="filter-group"
      >
        <VStack gap={3} alignItems="stretch">
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" alignItems="center" gap={1.5}>
              <Text fontSize="sm" color="gray.500">
                Match
              </Text>
              <LogicDropdown
                logic={group.logic}
                onChange={(logic) => model.setGroupLogic(group.id, logic)}
              />
              <Text fontSize="sm" color="gray.500">
                of the following
              </Text>
            </Box>
            <Button
              variant="ghost"
              size="sm"
              fontWeight="medium"
              color="red.500"
              onClick={() => model.removeGroup(group.id)}
              data-testid="remove-group"
            >
              Remove group
            </Button>
          </Box>

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

          <Box h="1px" bg="gray.200" />

          <Button
            variant="ghost"
            size="sm"
            borderRadius="lg"
            fontWeight="medium"
            color="gray.500"
            alignSelf="flex-start"
            onClick={() => model.addCondition(group.id)}
            data-testid="add-condition"
          >
            <LuPlus size={14} />
            <Text ml={1}>Add condition</Text>
          </Button>
        </VStack>
      </Box>
    );
  },
);
