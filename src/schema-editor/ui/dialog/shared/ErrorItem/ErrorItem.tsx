import { Badge, Box, Flex, Icon, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { PiWarningCircle } from 'react-icons/pi';

export type ErrorType = 'validation' | 'formula' | 'tableId';

interface ErrorItemProps {
  message: string;
  type?: ErrorType;
  fieldPath?: string;
}

export const ErrorItem: FC<ErrorItemProps> = ({ message, type, fieldPath }) => (
  <Box py={2} px={4}>
    <Flex align="center" gap={2}>
      <Icon as={PiWarningCircle} color="gray.400" boxSize={4} flexShrink={0} />
      <Text fontSize="sm" color="gray.600">
        {type === 'formula' && (
          <Badge size="sm" colorPalette="gray" variant="subtle" mr={2}>
            formula
          </Badge>
        )}
        {type === 'tableId' && (
          <Badge size="sm" colorPalette="gray" variant="subtle" mr={2}>
            table name
          </Badge>
        )}
        {fieldPath && (
          <Box as="span" fontWeight="medium">
            {fieldPath}:{' '}
          </Box>
        )}
        {message}
      </Text>
    </Flex>
  </Box>
);
