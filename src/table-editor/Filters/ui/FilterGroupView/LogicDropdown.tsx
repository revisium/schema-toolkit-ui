import { observer } from 'mobx-react-lite';
import { Box, Menu } from '@chakra-ui/react';
import { LuChevronDown } from 'react-icons/lu';

interface LogicDropdownProps {
  logic: 'and' | 'or';
  onChange: (logic: 'and' | 'or') => void;
}

export const LogicDropdown = observer(
  ({ logic, onChange }: LogicDropdownProps) => (
    <Menu.Root>
      <Menu.Trigger asChild>
        <Box
          as="button"
          display="flex"
          alignItems="center"
          gap={1}
          px={3}
          h="32px"
          bg="gray.100"
          borderRadius="lg"
          fontWeight="medium"
          fontSize="sm"
          cursor="pointer"
          color="black"
          _hover={{ bg: 'gray.200' }}
          data-testid="logic-select"
        >
          {logic === 'and' ? 'All' : 'Any'}
          <LuChevronDown size={14} />
        </Box>
      </Menu.Trigger>
      <Menu.Positioner>
        <Menu.Content>
          <Menu.Item
            value="and"
            onClick={() => onChange('and')}
            data-testid="logic-and"
          >
            All
          </Menu.Item>
          <Menu.Item
            value="or"
            onClick={() => onChange('or')}
            data-testid="logic-or"
          >
            Any
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Menu.Root>
  ),
);
