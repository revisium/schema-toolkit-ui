import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  HStack,
  IconButton,
  Popover,
  Portal,
  Text,
} from '@chakra-ui/react';
import { PiFunnelBold } from 'react-icons/pi';
import type { FilterModel } from '../model/FilterModel.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { FilterGroupView } from './FilterGroupView.js';

interface FilterWidgetProps {
  model: FilterModel;
  availableFields: ColumnSpec[];
  onApply: () => void;
}

export const FilterWidget = observer(
  ({ model, availableFields, onApply }: FilterWidgetProps) => {
    const showBadge = model.totalConditionCount > 0 || model.hasActiveFilters;
    const badgeBg = model.hasPendingChanges ? 'orange.500' : 'gray.500';

    const handleApply = () => {
      model.apply();
      onApply();
      model.setOpen(false);
    };

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
              <PiFunnelBold />
            </IconButton>
            {showBadge && (
              <Box
                position="absolute"
                top="-1"
                right="-1"
                borderRadius="full"
                width="16px"
                height="16px"
                fontSize="xs"
                bg={badgeBg}
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
            <Popover.Content p={0} minW="400px" maxW="600px">
              <HStack p={3} borderBottom="1px solid" borderColor="gray.100">
                <Text fontWeight="semibold">Filters</Text>
                {model.totalConditionCount > 0 && (
                  <Text fontSize="sm" color="gray.500">
                    ({model.totalConditionCount})
                  </Text>
                )}
                <Box ml="auto" />
                {!model.isEmpty && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => model.clearAll()}
                    data-testid="clear-all"
                  >
                    Clear all
                  </Button>
                )}
              </HStack>

              <Box p={3}>
                {model.isEmpty ? (
                  <Text fontSize="sm" color="gray.500">
                    No filters. Add a condition to get started.
                  </Text>
                ) : (
                  <FilterGroupView
                    model={model}
                    group={model.rootGroup}
                    availableFields={availableFields}
                    isRoot={true}
                  />
                )}
              </Box>

              <HStack p={3} borderTop="1px solid" borderColor="gray.100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => model.addCondition()}
                  data-testid="footer-add-condition"
                >
                  Add condition
                </Button>
                <Box ml="auto" />
                <Button
                  colorPalette="blue"
                  size="sm"
                  disabled={!model.allFiltersValid || !model.hasPendingChanges}
                  onClick={handleApply}
                  data-testid="apply-filters"
                >
                  Apply
                </Button>
              </HStack>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    );
  },
);
