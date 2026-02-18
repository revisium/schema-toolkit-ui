import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  IconButton,
  Popover,
  Portal,
  Text,
} from '@chakra-ui/react';
import { LuArrowUpDown, LuPlus } from 'react-icons/lu';
import type { SortModel } from '../model/SortModel.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { SortRow } from './SortRow.js';

interface SortingsWidgetProps {
  model: SortModel;
  availableFields: ColumnSpec[];
  onChange: (sorts: ReturnType<SortModel['serializeToViewSorts']>) => void;
}

export const SortingsWidget = observer(
  ({ model, availableFields, onChange }: SortingsWidgetProps) => {
    const handleApply = () => {
      model.apply();
      onChange(model.serializeToViewSorts());
      model.setOpen(false);
    };

    const handleClearAll = () => {
      model.clearAll();
      onChange(model.serializeToViewSorts());
      model.setOpen(false);
    };

    const handleAddSort = () => {
      const firstAvailable = model.availableFields[0];
      if (firstAvailable) {
        model.addSort(firstAvailable.field);
      }
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
              aria-label="Sort"
              variant="ghost"
              size="sm"
              data-testid="sort-trigger"
            >
              <LuArrowUpDown />
            </IconButton>
            {(model.hasSorts || model.hasPendingChanges) && (
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
                data-testid="sort-badge"
              >
                {model.sortCount}
              </Box>
            )}
          </Box>
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content p={4} minW="450px" borderRadius="xl">
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={model.hasSorts ? 3 : 0}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Box color="gray.500">
                    <LuArrowUpDown size={20} />
                  </Box>
                  <Text fontSize="xl" fontWeight="medium" color="gray.500">
                    Sort
                  </Text>
                  {model.sortCount > 0 && (
                    <Box bg="gray.100" px={2} py={1} borderRadius="sm">
                      <Text fontSize="sm" fontWeight="medium" color="black">
                        {model.sortCount}
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
                  {model.hasSorts && (
                    <Button
                      variant="ghost"
                      size="sm"
                      borderRadius="lg"
                      fontWeight="medium"
                      color="black"
                      onClick={handleClearAll}
                      data-testid="clear-all-sorts"
                    >
                      Clear all
                    </Button>
                  )}
                  <Button
                    size="sm"
                    bg="gray.100"
                    borderRadius="lg"
                    fontWeight="medium"
                    onClick={handleApply}
                    disabled={!model.hasPendingChanges}
                    color={
                      model.hasPendingChanges ? 'black' : 'rgba(0,0,0,0.2)'
                    }
                    _hover={
                      model.hasPendingChanges ? { bg: 'gray.200' } : undefined
                    }
                    _disabled={{
                      opacity: 1,
                      bg: 'gray.100',
                      cursor: 'default',
                    }}
                    data-testid="apply-sorts"
                  >
                    Apply
                  </Button>
                </Box>
              </Box>

              {model.hasSorts && (
                <>
                  <Box h="1px" bg="gray.200" mb={3} />
                  <Box display="flex" flexDirection="column" gap={2}>
                    {model.sorts.map((sort, index) => (
                      <SortRow
                        key={sort.field}
                        sort={sort}
                        index={index}
                        model={model}
                        availableFields={availableFields}
                      />
                    ))}
                  </Box>
                </>
              )}

              {model.availableFields.length > 0 && (
                <Box mt={model.hasSorts ? 2 : 0}>
                  <Button
                    variant="ghost"
                    size="sm"
                    borderRadius="lg"
                    fontWeight="medium"
                    color="gray.500"
                    onClick={handleAddSort}
                    data-testid="add-sort"
                  >
                    <LuPlus size={14} />
                    <Text ml={1}>Add sort</Text>
                  </Button>
                </Box>
              )}
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    );
  },
);
