import { Flex, Icon, Text } from '@chakra-ui/react';
import { FC } from 'react';
import { PiArrowRight } from 'react-icons/pi';
import { CodeBox } from '../CodeBox';

interface ValueChangeRowProps {
  label: string;
  fromValue: string;
  toValue: string;
}

export const ValueChangeRow: FC<ValueChangeRowProps> = ({
  label,
  fromValue,
  toValue,
}) => (
  <Flex
    align="center"
    gap={2}
    fontSize="xs"
    color="gray.500"
    pl={2}
    flexWrap="wrap"
  >
    <Text color="gray.400">{label}:</Text>
    <CodeBox>{fromValue}</CodeBox>
    <Icon as={PiArrowRight} color="gray.400" flexShrink={0} />
    <CodeBox>{toValue}</CodeBox>
  </Flex>
);
