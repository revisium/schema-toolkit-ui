import { Flex, Icon } from '@chakra-ui/react';
import { FC } from 'react';
import { PiDotsSixVerticalBold } from 'react-icons/pi';
import { Tooltip } from '../../../../components/Tooltip';

interface DragHandleProps {
  dataTestId: string;
  hoverClass?: string;
  applyHoverStyles: boolean;
}

export const DragHandle: FC<DragHandleProps> = ({
  dataTestId,
  hoverClass,
  applyHoverStyles,
}) => (
  <Tooltip
    content="Drag to move field to another object"
    positioning={{ placement: 'left' }}
  >
    <Flex
      data-testid={`${dataTestId}-drag-button`}
      className={hoverClass}
      position="absolute"
      left="-34px"
      opacity={applyHoverStyles ? 0 : 1}
      cursor="grab"
      _hover={{ backgroundColor: 'gray.50' }}
      height="100%"
      alignItems="center"
      justifyContent="center"
      borderRadius="4px"
      marginLeft="-6px"
    >
      <Icon as={PiDotsSixVerticalBold} size="md" color="gray.300" />
    </Flex>
  </Tooltip>
);
