import { observer } from 'mobx-react-lite';
import { Box, IconButton, Input } from '@chakra-ui/react';
import { PiMagnifyingGlassBold, PiXBold } from 'react-icons/pi';
import type { SearchModel } from '../model/index.js';

interface SearchWidgetProps {
  model: SearchModel;
}

export const SearchWidget = observer(({ model }: SearchWidgetProps) => {
  return (
    <Box position="relative" width="280px">
      <Box
        position="absolute"
        left="10px"
        top="50%"
        transform="translateY(-50%)"
        color="gray.400"
        zIndex={1}
        display="flex"
        alignItems="center"
      >
        <PiMagnifyingGlassBold />
      </Box>
      <Input
        value={model.query}
        onChange={(e) => model.setQuery(e.target.value)}
        placeholder="Search..."
        size="sm"
        pl="32px"
        data-testid="search-input"
      />
      {model.query !== '' && (
        <IconButton
          aria-label="Clear"
          variant="ghost"
          size="2xs"
          position="absolute"
          right="4px"
          top="50%"
          transform="translateY(-50%)"
          onClick={() => model.clear()}
          color="gray.400"
          _hover={{ color: 'black' }}
        >
          <PiXBold />
        </IconButton>
      )}
    </Box>
  );
});
