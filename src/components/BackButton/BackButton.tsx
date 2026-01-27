import { Button, Icon } from '@chakra-ui/react';
import React from 'react';
import { PiCaretLeft } from 'react-icons/pi';

interface BackButtonProps {
  onClick?: () => void;
  isDisabled?: boolean;
  height?: string;
  dataTestId?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  height = '2.5rem',
  onClick,
  isDisabled,
  dataTestId,
}) => {
  return (
    <Button
      data-testid={dataTestId}
      disabled={isDisabled}
      _hover={{ backgroundColor: 'gray.50' }}
      alignSelf="flex-start"
      height={height}
      variant="ghost"
      onClick={onClick}
    >
      <Icon boxSize={4} color="gray.500">
        <PiCaretLeft />
      </Icon>
    </Button>
  );
};
