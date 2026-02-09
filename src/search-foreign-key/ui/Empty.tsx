import { FC } from 'react';
import { Flex, Text } from '@chakra-ui/react';

export const Empty: FC = () => {
  return (
    <Flex
      flex={1}
      justifyContent="center"
      alignItems="center"
      data-testid="fk-empty"
    >
      <Text fontSize="sm" color="gray.500">
        No rows found in this table
      </Text>
    </Flex>
  );
};
