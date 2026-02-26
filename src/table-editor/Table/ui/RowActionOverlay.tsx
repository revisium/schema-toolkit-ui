import { FC, useState } from 'react';
import { Flex, Icon, Menu, Portal, Text } from '@chakra-ui/react';
import {
  PiDotsThreeVerticalBold,
  PiArrowSquareRightLight,
  PiCheckSquare,
} from 'react-icons/pi';
import { RowActionMenuItems } from './RowActionMenuItems.js';

interface RowActionOverlayProps {
  rowId: string;
  onOpen?: (rowId: string) => void;
  onPick?: (rowId: string) => void;
  onSelect?: (rowId: string) => void;
  onDuplicate?: (rowId: string) => void;
  onDelete?: (rowId: string) => void;
}

export const RowActionOverlay: FC<RowActionOverlayProps> = ({
  rowId,
  onOpen,
  onPick,
  onSelect,
  onDuplicate,
  onDelete,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const primaryAction = onPick ?? onOpen;
  const primaryIcon = onPick ? PiCheckSquare : PiArrowSquareRightLight;
  const primaryTestId = onPick
    ? `row-action-pick-${rowId}`
    : `row-action-open-${rowId}`;

  const hasOpenInMenu = Boolean(onPick && onOpen);
  const hasMenuItems =
    hasOpenInMenu || Boolean(onSelect || onDuplicate || onDelete);

  return (
    <Flex
      position="absolute"
      right="8px"
      top="50%"
      transform="translateY(-50%)"
      alignItems="center"
      className="row-action-buttons"
      data-menu-open={isMenuOpen || undefined}
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
        {primaryAction && (
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
              primaryAction(rowId);
            }}
            data-testid={primaryTestId}
          >
            <Icon boxSize="20px" color="gray.400" as={primaryIcon} />
          </Flex>
        )}
        {hasMenuItems && (
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
                borderLeft={primaryAction ? '1px solid' : undefined}
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
                  {hasOpenInMenu && (
                    <Menu.Item
                      value="open"
                      onClick={() => onOpen?.(rowId)}
                      data-testid={`row-action-menu-open-${rowId}`}
                    >
                      <PiArrowSquareRightLight />
                      <Text>Open</Text>
                    </Menu.Item>
                  )}
                  {hasOpenInMenu && (onSelect || onDuplicate || onDelete) && (
                    <Menu.Separator />
                  )}
                  <RowActionMenuItems
                    rowId={rowId}
                    testIdPrefix="row-action"
                    onSelect={onSelect}
                    onDuplicate={onDuplicate}
                    onDelete={onDelete}
                  />
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        )}
      </Flex>
    </Flex>
  );
};
