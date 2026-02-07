import { Box } from '@chakra-ui/react';
import { FC } from 'react';
import { PiWarningCircle } from 'react-icons/pi';
import { Tooltip } from '../../../../components/Tooltip';

interface ErrorIndicatorProps {
  dataTestId: string;
  errorMessage: string;
}

export const ErrorIndicator: FC<ErrorIndicatorProps> = ({
  dataTestId,
  errorMessage,
}) => (
  <Tooltip
    content={errorMessage}
    positioning={{ placement: 'top' }}
    contentProps={{ maxWidth: '400px' }}
  >
    <Box
      data-testid={`${dataTestId}-error-indicator`}
      color="red.500"
      cursor="default"
      display="flex"
      alignItems="center"
      ml="4px"
    >
      <PiWarningCircle />
    </Box>
  </Tooltip>
);
