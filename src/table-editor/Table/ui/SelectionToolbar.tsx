import { observer } from 'mobx-react-lite';
import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { LuX } from 'react-icons/lu';
import type { SelectionModel } from '../model/SelectionModel.js';

interface SelectionToolbarProps {
  selection: SelectionModel;
  allRowIds: string[];
  onDelete?: (ids: string[]) => void;
}

export const SelectionToolbar = observer(
  ({ selection, allRowIds, onDelete }: SelectionToolbarProps) => {
    if (!selection.isSelectionMode) {
      return null;
    }

    return (
      <Box
        position="sticky"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
        zIndex={100}
        data-testid="selection-toolbar"
      >
        <Flex alignItems="center" gap={3} px={3} py={2}>
          <Text fontSize="sm" fontWeight="500">
            {selection.selectedCount} selected
          </Text>
          <Button
            variant="ghost"
            size="xs"
            onClick={() => selection.selectAll(allRowIds)}
            data-testid="select-all"
          >
            Select all
          </Button>
          {onDelete && (
            <Button
              variant="ghost"
              size="xs"
              colorPalette="red"
              onClick={() => onDelete(selection.selectedIds)}
              data-testid="delete-selected"
            >
              Delete
            </Button>
          )}
          <Box ml="auto" />
          <Button
            variant="ghost"
            size="xs"
            onClick={() => selection.exitSelectionMode()}
            data-testid="exit-selection"
          >
            <LuX />
          </Button>
        </Flex>
      </Box>
    );
  },
);
