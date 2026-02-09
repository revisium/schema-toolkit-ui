import { FC } from 'react';
import { Flex, Text, IconButton } from '@chakra-ui/react';
import { PiXBold } from 'react-icons/pi';

interface HeaderProps {
  tableId: string;
  onClose?: () => void;
}

export const Header: FC<HeaderProps> = ({ tableId, onClose }) => {
  return (
    <Flex p="4px" alignItems="center" justifyContent="space-between">
      <Text fontSize="xs" color="gray.600" fontWeight="medium">
        Select from &quot;{tableId}&quot;
      </Text>
      {onClose && (
        <IconButton
          aria-label="Close"
          variant="ghost"
          size="2xs"
          color="gray.500"
          _hover={{ color: 'black' }}
          onClick={onClose}
        >
          <PiXBold />
        </IconButton>
      )}
    </Flex>
  );
};
