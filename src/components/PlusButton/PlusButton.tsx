import { IconButton } from '@chakra-ui/react';
import React from 'react';
import { PiPlus } from 'react-icons/pi';
import { Tooltip } from '../Tooltip';

export interface PlusButtonProps {
  onClick?: () => void;
  tooltip?: string;
  disabled?: boolean;
  dataTestId?: string;
}

export const PlusButton: React.FC<PlusButtonProps> = ({
  onClick,
  tooltip,
  disabled,
  dataTestId,
}) => {
  const button = (
    <IconButton
      aria-label={tooltip ?? 'Add'}
      size="xs"
      variant="ghost"
      color="gray.400"
      disabled={disabled}
      focusRing="none"
      _hover={{ bg: 'gray.100', color: 'gray.600' }}
      onClick={onClick}
      data-testid={dataTestId}
    >
      <PiPlus />
    </IconButton>
  );

  if (tooltip) {
    return (
      <Tooltip content={tooltip} openDelay={300}>
        {button}
      </Tooltip>
    );
  }

  return button;
};
