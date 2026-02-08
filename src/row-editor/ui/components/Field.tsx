import { FC } from 'react';
import { Box, Flex, Text } from '@chakra-ui/react';
import { PiFunctionLight } from 'react-icons/pi';
import { Tooltip } from '../../../components/Tooltip';

export interface FieldProps {
  name: string;
  formula?: string;
  description?: string;
  isDeprecated?: boolean;
}

export const Field: FC<FieldProps> = ({
  name,
  formula,
  description,
  isDeprecated,
}) => {
  const getTooltipContent = () => {
    if (formula && description) {
      return (
        <Box>
          <Flex
            alignItems="center"
            gap="4px"
            marginBottom="4px"
            fontWeight="medium"
          >
            <PiFunctionLight size={14} />
            <span>{formula}</span>
          </Flex>
          <Box color="gray.300">{description}</Box>
        </Box>
      );
    }
    if (formula) {
      return (
        <Flex alignItems="center" gap="4px">
          <PiFunctionLight size={14} />
          <span>{formula}</span>
        </Flex>
      );
    }
    if (description) {
      return description;
    }
    return null;
  };

  const tooltipContent = getTooltipContent();

  const fieldContent = (
    <Flex alignItems="center" gap="4px" color="gray.400">
      <Text textDecoration={isDeprecated ? 'line-through' : undefined}>
        {name}:
      </Text>
      {formula && <PiFunctionLight size={14} />}
    </Flex>
  );

  return (
    <Flex height="28px" alignItems="center">
      {tooltipContent ? (
        <Tooltip
          openDelay={350}
          content={tooltipContent}
          positioning={{ placement: 'right-end' }}
          showArrow
        >
          {fieldContent}
        </Tooltip>
      ) : (
        fieldContent
      )}
    </Flex>
  );
};
