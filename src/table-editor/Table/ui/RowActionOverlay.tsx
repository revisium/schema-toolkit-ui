import { FC, useState } from 'react';
import { Flex, Icon, Menu, Portal, Text } from '@chakra-ui/react';
import { LuCopy, LuTrash2 } from 'react-icons/lu';
import {
  PiCheckSquare,
  PiDotsThreeVerticalBold,
  PiArrowSquareRightLight,
} from 'react-icons/pi';

interface RowActionOverlayProps {
  rowId: string;
  onOpen?: (rowId: string) => void;
  onSelect?: (rowId: string) => void;
  onDuplicate?: (rowId: string) => void;
  onDelete?: (rowId: string) => void;
}

export const RowActionOverlay: FC<RowActionOverlayProps> = ({
  rowId,
  onOpen,
  onSelect,
  onDuplicate,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <Flex
        position="absolute"
        right="8px"
        top="50%"
        transform="translateY(-50%)"
        alignItems="center"
        opacity={isMenuOpen ? 1 : 0}
        className="row-action-buttons"
        data-testid={`row-action-buttons-${rowId}`}
      >
        <Flex
          alignItems="center"
          height="24px"
          borderRadius="6px"
          bg="white"
          boxShadow="0px 2px 8px rgba(0,0,0,0.16)"
          overflow="hidden"
          data-testid={`row-action-split-${rowId}`}
        >
          {onOpen && (
            <Flex
              alignItems="center"
              justifyContent="center"
              height="100%"
              width="28px"
              minWidth="28px"
              cursor="pointer"
              _hover={{ bg: 'gray.100' }}
              onClick={(e) => {
                e.stopPropagation();
                onOpen(rowId);
              }}
              data-testid={`row-action-open-${rowId}`}
            >
              <Icon
                boxSize="20px"
                color="gray.400"
                as={PiArrowSquareRightLight}
              />
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
                width="18px"
                minWidth="18px"
                cursor="pointer"
                borderLeft={onOpen ? '1px solid' : undefined}
                borderColor="gray.100"
                _hover={{ bg: 'gray.100' }}
                onClick={(e) => e.stopPropagation()}
                data-testid={`row-action-trigger-${rowId}`}
              >
                <Icon
                  as={PiDotsThreeVerticalBold}
                  boxSize="16px"
                  color="gray.300"
                />
              </Flex>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  minW="180px"
                  data-testid={`row-action-menu-${rowId}`}
                >
                  {onOpen && (
                    <Menu.Item
                      value="open"
                      onClick={() => onOpen(rowId)}
                      data-testid={`row-action-menu-open-${rowId}`}
                    >
                      <PiArrowSquareRightLight />
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
                      data-testid={`row-action-select-${rowId}`}
                    >
                      <PiCheckSquare />
                      <Text>Select</Text>
                    </Menu.Item>
                  )}
                  {onDuplicate && (
                    <Menu.Item
                      value="duplicate"
                      onClick={() => onDuplicate(rowId)}
                      data-testid={`row-action-duplicate-${rowId}`}
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
                        data-testid={`row-action-delete-${rowId}`}
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
      </Flex>
    </>
  );
};
