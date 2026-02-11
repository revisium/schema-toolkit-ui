import { observer } from 'mobx-react-lite';
import { Box, Popover, Portal, Text } from '@chakra-ui/react';
import { useCallback } from 'react';
import type { CellVM } from '../../model/CellVM.js';
import { CellWrapper } from './CellWrapper.js';
import { usePopoverAnchor } from './usePopoverAnchor.js';

interface BooleanCellProps {
  cell: CellVM;
}

export const BooleanCell = observer(({ cell }: BooleanCellProps) => {
  const { triggerRef, getAnchorRect } = usePopoverAnchor();

  const isOpen = cell.isEditing;

  const handleDoubleClick = useCallback(() => {
    if (!cell.isEditable) {
      return;
    }
    cell.startEditWithDoubleClick();
  }, [cell]);

  const handleSelect = useCallback(
    (value: boolean) => {
      cell.commitEdit(value);
    },
    [cell],
  );

  const handleClose = useCallback(() => {
    cell.cancelEdit();
  }, [cell]);

  return (
    <Box ref={triggerRef}>
      <CellWrapper cell={cell} onDoubleClick={handleDoubleClick}>
        <Text
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          overflow="hidden"
          fontWeight="300"
          flex={1}
          minWidth={0}
        >
          {cell.displayValue}
        </Text>
      </CellWrapper>
      <Popover.Root
        lazyMount
        unmountOnExit
        open={isOpen}
        onOpenChange={({ open }) => {
          if (!open) {
            handleClose();
          }
        }}
        autoFocus={true}
        closeOnInteractOutside={true}
        modal={false}
        positioning={{
          placement: 'bottom-start',
          getAnchorRect,
        }}
      >
        <Portal>
          <Popover.Positioner>
            <Popover.Content width="80px" p={1}>
              <Box
                px={2}
                py={1.5}
                cursor="pointer"
                borderRadius="md"
                fontSize="sm"
                _hover={{ bg: 'gray.100' }}
                onClick={() => handleSelect(true)}
                data-testid="boolean-option-true"
              >
                true
              </Box>
              <Box
                px={2}
                py={1.5}
                cursor="pointer"
                borderRadius="md"
                fontSize="sm"
                _hover={{ bg: 'gray.100' }}
                onClick={() => handleSelect(false)}
                data-testid="boolean-option-false"
              >
                false
              </Box>
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover.Root>
    </Box>
  );
});
