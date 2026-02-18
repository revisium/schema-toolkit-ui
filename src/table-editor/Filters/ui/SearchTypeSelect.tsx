import { observer } from 'mobx-react-lite';
import { Box, Menu, Text } from '@chakra-ui/react';
import { PiCaretDownLight } from 'react-icons/pi';
import { SEARCH_TYPES, type SearchType } from '../model/searchTypes.js';

interface SearchTypeSelectProps {
  value: SearchType;
  onChange: (value: SearchType) => void;
}

export const SearchTypeSelect = observer(
  ({ value, onChange }: SearchTypeSelectProps) => {
    const currentLabel =
      SEARCH_TYPES.find((t) => t.value === value)?.label ?? value;

    return (
      <Menu.Root>
        <Menu.Trigger asChild>
          <Box
            display="flex"
            alignItems="center"
            gap={1.5}
            px={3}
            h="40px"
            bg="gray.100"
            borderRadius="lg"
            cursor="pointer"
            minW="80px"
            _hover={{ bg: 'gray.200' }}
            data-testid="search-type-select"
          >
            <Text fontSize="sm" fontWeight="medium" truncate>
              {currentLabel}
            </Text>
            <Box color="gray.400" ml="auto">
              <PiCaretDownLight size={14} />
            </Box>
          </Box>
        </Menu.Trigger>
        <Menu.Positioner>
          <Menu.Content minW="160px">
            {SEARCH_TYPES.map((st) => (
              <Menu.Item
                key={st.value}
                value={st.value}
                onClick={() => onChange(st.value)}
                bg={st.value === value ? 'gray.100' : undefined}
              >
                {st.label}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    );
  },
);
