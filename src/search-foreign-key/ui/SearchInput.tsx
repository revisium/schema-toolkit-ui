import { FC, useCallback } from 'react';
import { Box, Input, IconButton } from '@chakra-ui/react';
import { PiXBold } from 'react-icons/pi';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export const SearchInput: FC<SearchInputProps> = ({ value, onChange }) => {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange],
  );

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <Box px="4px" pb="4px" position="relative">
      <Input
        value={value}
        onChange={handleChange}
        placeholder="Search by ID..."
        size="sm"
        data-testid="fk-search-input"
        autoFocus
      />
      {value && (
        <IconButton
          aria-label="Clear"
          variant="ghost"
          size="2xs"
          position="absolute"
          right="8px"
          top="50%"
          transform="translateY(-50%)"
          onClick={handleClear}
          color="gray.400"
          _hover={{ color: 'black' }}
        >
          <PiXBold />
        </IconButton>
      )}
    </Box>
  );
};
