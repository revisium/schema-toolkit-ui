import { Box, Flex, Icon, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { PiArrowsLeftRightLight } from 'react-icons/pi';
import type { TableIdChangeInfo } from '../../../../model/dialog';
import { Highlight } from '../Highlight';

interface TableIdChangeRowProps {
  change: TableIdChangeInfo;
}

export const TableIdChangeRow: FC<TableIdChangeRowProps> = ({ change }) => {
  return (
    <Box
      borderBottom="1px solid"
      borderColor="gray.100"
      py={4}
      px={5}
      _last={{ borderBottom: 'none' }}
      _hover={{ bg: 'gray.50' }}
    >
      <Flex align="center" gap={1.5}>
        <Icon
          as={PiArrowsLeftRightLight}
          color="gray.400"
          boxSize={4}
          flexShrink={0}
        />
        <Text fontSize="sm" color="gray.600">
          Table renamed from <Highlight>{change.initialTableId}</Highlight> to{' '}
          <Highlight>{change.currentTableId}</Highlight>
        </Text>
      </Flex>
    </Box>
  );
};
