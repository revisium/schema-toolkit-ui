import { FC } from 'react';
import { HStack, Button } from '@chakra-ui/react';
import { PiMagnifyingGlassBold, PiPlusBold } from 'react-icons/pi';

interface FooterProps {
  onOpenTableSearch?: () => void;
  onCreateAndConnect?: () => void;
}

export const Footer: FC<FooterProps> = ({
  onOpenTableSearch,
  onCreateAndConnect,
}) => {
  const hasActions = onOpenTableSearch || onCreateAndConnect;

  if (!hasActions) {
    return null;
  }

  return (
    <HStack
      mt="4px"
      p="4px"
      gap={2}
      borderTopWidth="1px"
      borderColor="gray.200"
    >
      {onOpenTableSearch && (
        <Button
          size="xs"
          variant="ghost"
          color="gray.500"
          onClick={onOpenTableSearch}
          data-testid="fk-open-table-search"
        >
          <PiMagnifyingGlassBold />
          Open Table Search
        </Button>
      )}
      {onCreateAndConnect && (
        <Button
          size="xs"
          variant="ghost"
          color="gray.500"
          onClick={onCreateAndConnect}
          data-testid="fk-create-and-connect"
        >
          <PiPlusBold />
          Create &amp; Connect
        </Button>
      )}
    </HStack>
  );
};
