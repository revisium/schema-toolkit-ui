import { FC, useState } from 'react';
import { Flex, Icon, Menu, Portal, Text } from '@chakra-ui/react';
import { LuCopy, LuTrash2 } from 'react-icons/lu';
import { PiCheckSquare, PiDotsThreeVerticalBold } from 'react-icons/pi';

interface RowActionsMenuProps {
  rowId: string;
  onSelect?: (rowId: string) => void;
  onDuplicate?: (rowId: string) => void;
  onDelete?: (rowId: string) => void;
}

export const RowActionsMenu: FC<RowActionsMenuProps> = ({
  rowId,
  onSelect,
  onDuplicate,
  onDelete,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const hasItems = Boolean(onSelect || onDuplicate || onDelete);
  if (!hasItems) {
    return null;
  }

  return (
    <Menu.Root
      lazyMount
      unmountOnExit
      onOpenChange={({ open }) => setIsOpen(open)}
    >
      <Menu.Trigger asChild>
        <Flex
          alignItems="center"
          justifyContent="center"
          height="100%"
          cursor="pointer"
          data-testid={`row-menu-trigger-${rowId}`}
        >
          <Flex
            alignItems="center"
            justifyContent="center"
            height="24px"
            width="24px"
            borderRadius="4px"
            bg="white"
            boxShadow="0 0 0 1px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.08)"
            opacity={isOpen ? 1 : 0}
            transition={isOpen ? 'opacity 1s ease 0s' : undefined}
            _groupHover={{
              opacity: 1,
              transition: 'opacity 0.15s ease 0s',
            }}
            _hover={{
              boxShadow:
                '0 0 0 1px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <Icon size="sm" color="gray.500" as={PiDotsThreeVerticalBold} />
          </Flex>
        </Flex>
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content minW="160px" data-testid={`row-menu-${rowId}`}>
            {onSelect && (
              <Menu.Item
                value="select"
                onClick={() => onSelect(rowId)}
                data-testid={`row-menu-select-${rowId}`}
              >
                <PiCheckSquare />
                <Text>Select</Text>
              </Menu.Item>
            )}
            {onDuplicate && (
              <Menu.Item
                value="duplicate"
                onClick={() => onDuplicate(rowId)}
                data-testid={`row-menu-duplicate-${rowId}`}
              >
                <LuCopy />
                <Text>Duplicate</Text>
              </Menu.Item>
            )}
            {onDelete && (
              <>
                {(onSelect || onDuplicate) && <Menu.Separator />}
                <Menu.Item
                  value="delete"
                  onClick={() => onDelete(rowId)}
                  data-testid={`row-menu-delete-${rowId}`}
                >
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
