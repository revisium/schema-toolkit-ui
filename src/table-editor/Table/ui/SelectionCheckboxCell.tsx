import { FC } from 'react';
import { Box, Checkbox, Flex } from '@chakra-ui/react';
import { CELL_BORDER_COLOR } from './borderConstants.js';

interface SelectionCheckboxCellProps {
  rowId: string;
  isSelected: boolean;
  onToggleSelection: () => void;
}

export const SelectionCheckboxCell: FC<SelectionCheckboxCellProps> = ({
  rowId,
  isSelected,
  onToggleSelection,
}) => {
  return (
    <Box
      as="td"
      width="40px"
      minWidth="40px"
      maxWidth="40px"
      p={0}
      position="sticky"
      left={0}
      zIndex={1}
      bg="white"
      boxShadow={`inset 0 -1px 0 0 ${CELL_BORDER_COLOR}, inset -1px 0 0 0 ${CELL_BORDER_COLOR}`}
    >
      <Flex alignItems="center" justifyContent="center" height="100%">
        <Checkbox.Root
          checked={isSelected}
          onCheckedChange={() => onToggleSelection()}
          size="sm"
          data-testid={`select-${rowId}`}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control />
        </Checkbox.Root>
      </Flex>
    </Box>
  );
};
