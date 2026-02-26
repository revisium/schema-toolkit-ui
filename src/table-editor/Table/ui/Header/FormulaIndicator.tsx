import { Flex } from '@chakra-ui/react';
import { PiFunction } from 'react-icons/pi';
import type { ColumnSpec } from '../../../Columns/model/types.js';

interface FormulaIndicatorProps {
  column: ColumnSpec;
}

export const FormulaIndicator = ({ column }: FormulaIndicatorProps) => {
  if (!column.hasFormula) {
    return null;
  }

  return (
    <Flex
      alignItems="center"
      color="gray.400"
      flexShrink={0}
      data-testid={`formula-indicator-${column.field}`}
    >
      <PiFunction size={12} />
    </Flex>
  );
};
