import { FC, useMemo } from 'react';
import { Menu, Portal, Text } from '@chakra-ui/react';
import { LuCopy, LuTrash2 } from 'react-icons/lu';
import { PiCheckSquare, PiSidebarSimpleBold } from 'react-icons/pi';

export interface RowContextMenuState {
  rowId: string;
  x: number;
  y: number;
}

interface RowContextMenuProps {
  state: RowContextMenuState | null;
  onClose: () => void;
  onPick?: (rowId: string) => void;
  onOpen?: (rowId: string) => void;
  onSelect?: (rowId: string) => void;
  onDuplicate?: (rowId: string) => void;
  onDelete?: (rowId: string) => void;
}

export const RowContextMenu: FC<RowContextMenuProps> = ({
  state,
  onClose,
  onPick,
  onOpen,
  onSelect,
  onDuplicate,
  onDelete,
}) => {
  const hasItems = Boolean(
    onPick || onOpen || onSelect || onDuplicate || onDelete,
  );

  const getAnchorRect = useMemo(() => {
    if (!state) {
      return undefined;
    }
    return () => ({ x: state.x, y: state.y, width: 0, height: 0 });
  }, [state]);

  if (!hasItems) {
    return null;
  }

  return (
    <Menu.Root
      open={state !== null}
      onOpenChange={({ open }) => {
        if (!open) {
          onClose();
        }
      }}
      positioning={{
        placement: 'bottom-start',
        getAnchorRect,
      }}
      lazyMount
      unmountOnExit
    >
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="160px" data-testid="row-context-menu">
            {onPick && state && (
              <Menu.Item value="pick" onClick={() => onPick(state.rowId)}>
                <PiCheckSquare />
                <Text>Pick</Text>
              </Menu.Item>
            )}
            {onOpen && state && (
              <Menu.Item value="open" onClick={() => onOpen(state.rowId)}>
                <PiSidebarSimpleBold />
                <Text>Open</Text>
              </Menu.Item>
            )}
            {(onPick || onOpen) && (onSelect || onDuplicate || onDelete) && (
              <Menu.Separator />
            )}
            {onSelect && state && (
              <Menu.Item value="select" onClick={() => onSelect(state.rowId)}>
                <PiCheckSquare />
                <Text>Select</Text>
              </Menu.Item>
            )}
            {onDuplicate && state && (
              <Menu.Item
                value="duplicate"
                onClick={() => onDuplicate(state.rowId)}
              >
                <LuCopy />
                <Text>Duplicate</Text>
              </Menu.Item>
            )}
            {onDelete && state && (
              <>
                {(onSelect || onDuplicate) && <Menu.Separator />}
                <Menu.Item value="delete" onClick={() => onDelete(state.rowId)}>
                  <LuTrash2 />
                  <Text color="red.600">Delete</Text>
                </Menu.Item>
              </>
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
