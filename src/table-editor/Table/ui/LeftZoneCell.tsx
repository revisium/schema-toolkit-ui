import { FC, useState } from 'react';
import {
  Box,
  Checkbox,
  Flex,
  Icon,
  Menu,
  Portal,
  Text,
} from '@chakra-ui/react';
import { LuChevronDown, LuCopy, LuTrash2 } from 'react-icons/lu';
import { PiCheckSquare, PiSidebarSimpleBold } from 'react-icons/pi';

interface LeftZoneCellProps {
  rowId: string;
  isSelected: boolean;
  isSelectionMode: boolean;
  onOpen?: (rowId: string) => void;
  onToggleSelection: () => void;
  onSelect?: (rowId: string) => void;
  onDuplicate?: (rowId: string) => void;
  onDelete?: (rowId: string) => void;
}

const SplitButton: FC<{
  rowId: string;
  onOpen?: (rowId: string) => void;
  onSelect?: (rowId: string) => void;
  onDuplicate?: (rowId: string) => void;
  onDelete?: (rowId: string) => void;
}> = ({ rowId, onOpen, onSelect, onDuplicate, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <Flex
      alignItems="center"
      height="24px"
      borderRadius="4px"
      bg="white"
      boxShadow="0 0 0 1px rgba(0,0,0,0.06), 0 1px 1px rgba(0,0,0,0.08)"
      opacity={isMenuOpen ? 1 : 0}
      transition={isMenuOpen ? 'opacity 1s ease 0s' : undefined}
      _groupHover={{
        opacity: 1,
        transition: 'opacity 0.15s ease 0s',
      }}
      overflow="hidden"
      data-testid={`left-zone-split-${rowId}`}
    >
      {onOpen && (
        <Flex
          alignItems="center"
          justifyContent="center"
          height="100%"
          width="20px"
          minWidth="20px"
          cursor="pointer"
          _hover={{ bg: 'gray.100' }}
          onClick={() => onOpen(rowId)}
          data-testid={`left-zone-open-${rowId}`}
        >
          <Icon size="xs" color="gray.500" as={PiSidebarSimpleBold} />
        </Flex>
      )}
      <Menu.Root
        lazyMount
        unmountOnExit
        onOpenChange={({ open }) => setIsMenuOpen(open)}
        positioning={{ placement: 'bottom-start' }}
      >
        <Menu.Trigger asChild>
          <Flex
            alignItems="center"
            justifyContent="center"
            height="100%"
            width="16px"
            minWidth="16px"
            cursor="pointer"
            borderLeft={onOpen ? '1px solid' : undefined}
            borderColor="gray.200"
            _hover={{ bg: 'gray.100' }}
            data-testid={`left-zone-trigger-${rowId}`}
          >
            <Icon as={LuChevronDown} boxSize="10px" color="gray.500" />
          </Flex>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content minW="180px" data-testid={`left-zone-menu-${rowId}`}>
              {onOpen && (
                <Menu.Item
                  value="open"
                  onClick={() => onOpen(rowId)}
                  data-testid={`left-zone-menu-open-${rowId}`}
                >
                  <PiSidebarSimpleBold />
                  <Text>Open</Text>
                </Menu.Item>
              )}
              {onOpen && (onSelect || onDuplicate || onDelete) && (
                <Menu.Separator />
              )}
              {onSelect && (
                <Menu.Item
                  value="select"
                  onClick={() => onSelect(rowId)}
                  data-testid={`left-zone-select-${rowId}`}
                >
                  <PiCheckSquare />
                  <Text>Select</Text>
                </Menu.Item>
              )}
              {onDuplicate && (
                <Menu.Item
                  value="duplicate"
                  onClick={() => onDuplicate(rowId)}
                  data-testid={`left-zone-duplicate-${rowId}`}
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
                    data-testid={`left-zone-delete-${rowId}`}
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
    </Flex>
  );
};

export const LeftZoneCell: FC<LeftZoneCellProps> = ({
  rowId,
  isSelected,
  isSelectionMode,
  onOpen,
  onToggleSelection,
  onSelect,
  onDuplicate,
  onDelete,
}) => {
  if (isSelectionMode) {
    return (
      <Box
        as="td"
        width="40px"
        minWidth="40px"
        maxWidth="40px"
        borderRight="1px solid"
        borderColor="gray.100"
        p={0}
      >
        <Flex alignItems="center" justifyContent="center" height="100%">
          <Checkbox.Root
            checked={isSelected}
            onCheckedChange={() => onToggleSelection()}
            size="sm"
            data-testid={`select-${rowId}`}
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control />
          </Checkbox.Root>
        </Flex>
      </Box>
    );
  }

  return (
    <Box
      as="td"
      width="40px"
      minWidth="40px"
      maxWidth="40px"
      borderRight="1px solid"
      borderColor="gray.100"
      p={0}
    >
      <Flex alignItems="center" justifyContent="center" height="100%">
        <SplitButton
          rowId={rowId}
          onOpen={onOpen}
          onSelect={onSelect}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </Flex>
    </Box>
  );
};
