import { observer } from 'mobx-react-lite';
import { Box, Popover, Portal, Text } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { SearchForeignKey } from '../../../../search-foreign-key/index.js';
import type { SearchForeignKeySearchFn } from '../../../../search-foreign-key/index.js';
import type { CellVM } from '../../model/CellVM.js';
import { CellWrapper } from './CellWrapper.js';
import { usePopoverAnchor } from './usePopoverAnchor.js';

interface ForeignKeyCellProps {
  cell: CellVM;
  onSearchForeignKey?: SearchForeignKeySearchFn;
}

export const ForeignKeyCell = observer(
  ({ cell, onSearchForeignKey }: ForeignKeyCellProps) => {
    const { triggerRef, getAnchorRect } = usePopoverAnchor();
    const [isOpen, setIsOpen] = useState(false);

    const handleDoubleClick = useCallback(() => {
      if (!cell.isEditable || !onSearchForeignKey) {
        return;
      }
      cell.startEdit();
      setIsOpen(true);
    }, [cell, onSearchForeignKey]);

    const handleSelect = useCallback(
      (id: string) => {
        setIsOpen(false);
        cell.commitEdit(id);
      },
      [cell],
    );

    const handleClose = useCallback(() => {
      setIsOpen(false);
      cell.cancelEdit();
    }, [cell]);

    const foreignKeyTableId = cell.foreignKeyTableId;

    return (
      <Box ref={triggerRef}>
        <CellWrapper cell={cell} onDoubleClick={handleDoubleClick}>
          {cell.displayValue ? (
            <Text
              whiteSpace="nowrap"
              textOverflow="ellipsis"
              overflow="hidden"
              fontWeight="300"
              color="blue.500"
              flex={1}
              minWidth={0}
            >
              {cell.displayValue}
            </Text>
          ) : (
            <Text
              whiteSpace="nowrap"
              fontWeight="300"
              color="gray.400"
              flex={1}
              minWidth={0}
            >
              Select...
            </Text>
          )}
        </CellWrapper>
        {foreignKeyTableId && onSearchForeignKey && (
          <Popover.Root
            lazyMount
            unmountOnExit
            open={isOpen}
            onOpenChange={({ open }) => {
              if (!open) {
                handleClose();
              }
            }}
            autoFocus={false}
            closeOnInteractOutside={true}
            modal={false}
            positioning={{
              placement: 'bottom-start',
              getAnchorRect,
            }}
          >
            <Portal>
              <Popover.Positioner>
                <Popover.Content width="320px" p={0}>
                  <SearchForeignKey
                    tableId={foreignKeyTableId}
                    onSearch={onSearchForeignKey}
                    onSelect={handleSelect}
                    onClose={handleClose}
                  />
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        )}
      </Box>
    );
  },
);
