import { Badge, Flex, Icon, Text, VStack } from '@chakra-ui/react';
import { FC } from 'react';
import { PiArrowRight } from 'react-icons/pi';
import type { TransformationInfo } from '../../../../model/utils';
import { CodeBox } from '../CodeBox';
import { DataLossBadge } from './DataLossBadge';

interface TransformationInfoRowProps {
  info: TransformationInfo;
}

export const TransformationInfoRow: FC<TransformationInfoRowProps> = ({
  info,
}) => {
  return (
    <VStack align="stretch" gap={1} pl={2}>
      <Flex align="center" gap={2} fontSize="xs" flexWrap="wrap">
        {info.steps.map((step, stepIndex) => (
          <Flex key={step.name} align="center" gap={1}>
            {stepIndex > 0 && <Text color="gray.400">+</Text>}
            <Badge size="sm" colorPalette="gray" variant="subtle">
              {step.name}
            </Badge>
          </Flex>
        ))}
        <DataLossBadge severity={info.dataLossSeverity} />
      </Flex>

      <Flex align="center" gap={2} fontSize="xs" color="gray.500">
        <Text color="gray.400">example:</Text>
        <CodeBox>{JSON.stringify(info.example.before)}</CodeBox>
        <Icon as={PiArrowRight} color="gray.400" flexShrink={0} />
        <CodeBox>{JSON.stringify(info.example.after)}</CodeBox>
      </Flex>
    </VStack>
  );
};
