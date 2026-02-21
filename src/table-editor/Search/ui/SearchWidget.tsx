import { useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Box, IconButton, Input } from '@chakra-ui/react';
import { PiMagnifyingGlass, PiXBold } from 'react-icons/pi';
import type { SearchModel } from '../model/index.js';

const HEIGHT = '24px';

interface SearchWidgetProps {
  model: SearchModel;
}

export const SearchWidget = observer(({ model }: SearchWidgetProps) => {
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isOpen = expanded || model.query !== '';

  const handleBlur = () => {
    if (model.query === '') {
      setExpanded(false);
    }
  };

  const handleExpand = () => {
    setExpanded(true);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  };

  if (!isOpen) {
    return (
      <IconButton
        aria-label="Search"
        variant="ghost"
        size="xs"
        color="gray.400"
        onClick={handleExpand}
        data-testid="search-trigger"
      >
        <PiMagnifyingGlass />
      </IconButton>
    );
  }

  return (
    <Box position="relative" width="280px" height={HEIGHT}>
      <Box
        position="absolute"
        left="4px"
        top="50%"
        transform="translateY(-50%)"
        color="gray.400"
        zIndex={1}
        display="flex"
        alignItems="center"
      >
        <PiMagnifyingGlass />
      </Box>
      <Input
        ref={inputRef}
        value={model.query}
        onChange={(e) => model.setQuery(e.target.value)}
        onBlur={handleBlur}
        placeholder="Search..."
        variant="flushed"
        height={HEIGHT}
        fontSize="sm"
        pl="24px"
        autoFocus
        data-testid="search-input"
      />
      {model.query !== '' && (
        <IconButton
          aria-label="Clear"
          variant="ghost"
          size="2xs"
          position="absolute"
          right="0"
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
