import { observer } from 'mobx-react-lite';
import { Box, Menu, Text } from '@chakra-ui/react';
import { PiCaretDownLight } from 'react-icons/pi';
import {
  SEARCH_LANGUAGES,
  type SearchLanguage,
} from '../../model/searchTypes.js';

interface SearchLanguageSelectProps {
  value: SearchLanguage;
  onChange: (value: SearchLanguage) => void;
}

export const SearchLanguageSelect = observer(
  ({ value, onChange }: SearchLanguageSelectProps) => {
    const currentLabel =
      SEARCH_LANGUAGES.find((l) => l.value === value)?.label ?? value;

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
            data-testid="search-language-select"
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
          <Menu.Content maxH="300px" overflow="auto" minW="180px">
            {SEARCH_LANGUAGES.map((lang) => (
              <Menu.Item
                key={lang.value}
                value={lang.value}
                onClick={() => onChange(lang.value)}
                bg={lang.value === value ? 'gray.100' : undefined}
              >
                {lang.label}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>
    );
  },
);
