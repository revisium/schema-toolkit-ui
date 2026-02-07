import { Button, Flex, Icon, Popover, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { PiArrowCounterClockwiseBold } from 'react-icons/pi';

interface RevertButtonProps {
  onRevert: () => void;
  disabled?: boolean;
}

export const RevertButton: FC<RevertButtonProps> = ({ onRevert, disabled }) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="sm" color="gray.500" disabled={disabled}>
          <Icon as={PiArrowCounterClockwiseBold} />
          Revert All
        </Button>
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content>
          <Popover.Arrow />
          <Popover.Body>
            <Text fontSize="sm" mb={3}>
              This will revert all changes. Are you sure?
            </Text>
            <Flex gap={2} justify="flex-end">
              <Popover.CloseTrigger asChild>
                <Button variant="outline" size="xs">
                  Cancel
                </Button>
              </Popover.CloseTrigger>
              <Popover.CloseTrigger asChild>
                <Button
                  variant="outline"
                  size="xs"
                  colorPalette="red"
                  onClick={onRevert}
                >
                  Revert
                </Button>
              </Popover.CloseTrigger>
            </Flex>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
};
