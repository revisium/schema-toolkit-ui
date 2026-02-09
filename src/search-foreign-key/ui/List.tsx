import { FC } from 'react';
import { Box } from '@chakra-ui/react';
import { Item } from './Item';

interface ListProps {
  ids: string[];
  onSelect: (id: string) => void;
}

export const List: FC<ListProps> = ({ ids, onSelect }) => {
  return (
    <Box flex={1} overflowY="auto" data-testid="fk-list">
      {ids.map((id) => (
        <Item key={id} id={id} onSelect={onSelect} />
      ))}
    </Box>
  );
};
