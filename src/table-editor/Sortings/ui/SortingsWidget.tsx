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
import { LuArrowUpDown } from 'react-icons/lu';
import type { SortModel } from '../model/SortModel.js';
import type { ColumnSpec } from '../../Columns/model/types.js';
import { SortRow } from './SortRow.js';

interface SortingsWidgetProps {
  model: SortModel;
  availableFields: ColumnSpec[];
  onApply: () => void;
}

export const SortingsWidget = observer(
  ({ model, availableFields, onApply }: SortingsWidgetProps) => {
    const handleApply = () => {
      onApply();
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
            {model.hasSorts && (
              <Box
                position="absolute"
                top="-1"
                right="-1"
                borderRadius="full"
                width="16px"
                height="16px"
                fontSize="xs"
                bg="gray.500"
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
            <Popover.Content p={0} minW="350px" maxW="500px">
              <HStack p={3} borderBottom="1px solid" borderColor="gray.100">
                <Text fontWeight="semibold">Sort</Text>
                {model.sortCount > 0 && (
                  <Text fontSize="sm" color="gray.500">
                    ({model.sortCount})
                  </Text>
                )}
                <Box ml="auto" />
                {model.hasSorts && (
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={model.clearAll}
                    data-testid="clear-all-sorts"
                  >
                    Clear all
                  </Button>
                )}
              </HStack>

              <Box p={3}>
                {model.hasSorts ? (
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
                ) : (
                  <Text fontSize="sm" color="gray.500">
                    No sorts. Add a sort to order rows.
                  </Text>
                )}
              </Box>

              <HStack p={3} borderTop="1px solid" borderColor="gray.100">
                {model.availableFields.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleAddSort}
                    data-testid="add-sort"
                  >
                    Add sort
                  </Button>
                )}
                <Box ml="auto" />
                <Button
                  colorPalette="blue"
                  size="sm"
                  onClick={handleApply}
                  data-testid="apply-sorts"
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
