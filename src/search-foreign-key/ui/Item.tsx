import { FC, useCallback } from 'react';
import { Box } from '@chakra-ui/react';

interface ItemProps {
  id: string;
  onSelect: (id: string) => void;
}

export const Item: FC<ItemProps> = ({ id, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(id);
  }, [id, onSelect]);

  return (
    <Box
      px={2}
      py={1.5}
      mr="12px"
      cursor="pointer"
      borderRadius="md"
      fontSize="sm"
      _hover={{ bg: 'gray.100' }}
      onClick={handleClick}
      data-testid={`fk-item-${id}`}
    >
      {id}
    </Box>
  );
};
