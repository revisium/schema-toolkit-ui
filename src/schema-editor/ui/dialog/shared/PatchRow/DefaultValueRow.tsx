import { Box, Flex, Text } from '@chakra-ui/react';
import { FC } from 'react';
import type { DefaultValueExample } from '../../../../model/utils';
import { formatDefaultValue } from './helpers';

interface DefaultValueRowProps {
  example: DefaultValueExample;
}

export const DefaultValueRow: FC<DefaultValueRowProps> = ({ example }) => {
  const { value, type, foreignKeyTableId } = example;

  if (foreignKeyTableId) {
    return null;
  }

  const formattedValue = formatDefaultValue(value);
  const isMultiline = formattedValue.includes('\n');

  return (
    <Flex
      align={isMultiline ? 'flex-start' : 'center'}
      gap={2}
      fontSize="xs"
      color="gray.500"
      pl={2}
    >
      <Text color="gray.400">default:</Text>
      <Box
        as="code"
        px={isMultiline ? 2 : 1}
        py={isMultiline ? 1.5 : 0.5}
        bg="gray.100"
        borderRadius="sm"
        fontFamily="mono"
        whiteSpace={isMultiline ? 'pre' : 'nowrap'}
      >
        {formattedValue}
      </Box>
      <Text color="gray.400">({type})</Text>
    </Flex>
  );
};
