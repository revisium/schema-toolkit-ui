import { Box, Menu, Portal } from '@chakra-ui/react';
import { FC } from 'react';
import { PiCaretRight } from 'react-icons/pi';

interface UsedByFormulasSubmenuProps {
  formulaDependents: readonly string[];
}

export const UsedByFormulasSubmenu: FC<UsedByFormulasSubmenuProps> = ({
  formulaDependents,
}) => {
  if (formulaDependents.length === 0) {
    return null;
  }

  return (
    <Menu.Root positioning={{ placement: 'right-start', gutter: 2 }}>
      <Menu.TriggerItem>
        <Box w="16px" />
        <Box flex="1">Used by formulas</Box>
        <Box
          color="gray.400"
          fontSize="xs"
          bg="gray.100"
          px="1.5"
          borderRadius="full"
        >
          {formulaDependents.length}
        </Box>
        <PiCaretRight />
      </Menu.TriggerItem>
      <Portal>
        <Menu.Positioner>
          <Menu.Content p="2" minW="240px">
            {formulaDependents.map((nodeId) => (
              <Box
                key={nodeId}
                py="1"
                borderBottomWidth={1}
                borderColor="gray.100"
                _last={{ borderBottomWidth: 0 }}
              >
                <Box fontSize="sm" fontWeight="medium">
                  {nodeId}
                </Box>
              </Box>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
};
