import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  IconButton,
  Popover,
  Portal,
  Text,
} from '@chakra-ui/react';
import { LuFilter, LuPlus } from 'react-icons/lu';
import type { FilterModel } from '../../model/FilterModel.js';
import type { ColumnSpec } from '../../../Columns/model/types.js';
import { FilterGroupView } from '../FilterGroupView/FilterGroupView.js';
import { CopyJsonPopover } from '../../../shared/CopyJsonPopover/index.js';

interface FilterWidgetProps {
  model: FilterModel;
  availableFields: ColumnSpec[];
}

export const FilterWidget = observer(
  ({ model, availableFields }: FilterWidgetProps) => {
    return (
      <Popover.Root
        open={model.isOpen}
        onOpenChange={(e) => model.setOpen(e.open)}
        lazyMount
        unmountOnExit
      >
        <Popover.Trigger asChild>
          <Box position="relative" display="inline-flex">
            <IconButton
              aria-label="Filters"
              variant="ghost"
              size="sm"
              data-testid="filter-trigger"
            >
              <LuFilter />
            </IconButton>
            {model.showBadge && (
              <Box
                position="absolute"
                top="-1"
                right="-1"
                borderRadius="full"
                width="16px"
                height="16px"
                fontSize="xs"
                bg={model.hasPendingChanges ? 'red.500' : 'gray.500'}
                color="white"
                display="flex"
                alignItems="center"
                justifyContent="center"
                lineHeight="1"
                data-testid="filter-badge"
              >
                {model.totalConditionCount}
              </Box>
            )}
          </Box>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content p={4} w="732px" borderRadius="xl">
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Box color="gray.500">
                    <LuFilter size={20} />
                  </Box>
                  <Text fontSize="xl" fontWeight="medium" color="gray.500">
                    Filters
                  </Text>
                  {model.totalConditionCount > 0 && (
                    <Box bg="gray.100" px={2} py={1} borderRadius="sm">
                      <Text fontSize="sm" fontWeight="medium" color="black">
                        {model.totalConditionCount}
                      </Text>
                    </Box>
                  )}
                  {model.hasPendingChanges && (
                    <Box bg="#fdedea" px={2} py={1} borderRadius="sm">
                      <Text fontSize="sm" fontWeight="medium" color="#be3e24">
                        Unsaved
                      </Text>
                    </Box>
                  )}
                </Box>
                <Box display="flex" gap={2} alignItems="center">
                  {!model.isEmpty && (
                    <Button
                      variant="ghost"
                      size="sm"
                      borderRadius="lg"
                      fontWeight="medium"
                      color="black"
                      onClick={model.clearAllAndClose}
                      data-testid="clear-all"
                    >
                      Clear all
                    </Button>
                  )}
                  {!model.isEmpty && model.allFiltersValid && (
                    <CopyJsonPopover
                      data={model.buildCurrentWhereClause() ?? {}}
                      tooltipContent="Copy filter JSON"
                      testId="filter-copy-json"
                    />
                  )}
                  <Button
                    size="sm"
                    bg="gray.100"
                    borderRadius="lg"
                    fontWeight="medium"
                    onClick={model.applyAndClose}
                    disabled={
                      !model.allFiltersValid || !model.hasPendingChanges
                    }
                    color={
                      model.hasPendingChanges && model.allFiltersValid
                        ? 'black'
                        : 'rgba(0,0,0,0.2)'
                    }
                    _hover={
                      model.hasPendingChanges && model.allFiltersValid
                        ? { bg: 'gray.200' }
                        : undefined
                    }
                    _disabled={{
                      opacity: 1,
                      bg: 'gray.100',
                      cursor: 'default',
                    }}
                    data-testid="apply-filters"
                  >
                    Apply
                  </Button>
                </Box>
              </Box>

              <Box h="1px" bg="gray.200" mb={3} />

              {!model.isEmpty && (
                <FilterGroupView
                  model={model}
                  group={model.rootGroup}
                  availableFields={availableFields}
                  isRoot={true}
                />
              )}

              <Box mt={model.isEmpty ? 0 : 2}>
                <Button
                  variant="ghost"
                  size="sm"
                  borderRadius="lg"
                  fontWeight="medium"
                  color="gray.500"
                  onClick={() => model.addCondition()}
                  data-testid="footer-add-condition"
                >
                  <LuPlus size={14} />
                  <Text ml={1}>Add condition</Text>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  borderRadius="lg"
                  fontWeight="medium"
                  color="gray.500"
                  onClick={() => model.addGroup()}
                  data-testid="footer-add-group"
                >
                  <LuPlus size={14} />
                  <Text ml={1}>Add group</Text>
                </Button>
              </Box>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    );
  },
);
