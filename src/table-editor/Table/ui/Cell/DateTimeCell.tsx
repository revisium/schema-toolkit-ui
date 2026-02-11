import { observer } from 'mobx-react-lite';
import { Text } from '@chakra-ui/react';
import type { CellVM } from '../../model/CellVM.js';
import { CellWrapper } from './CellWrapper.js';

interface DateTimeCellProps {
  cell: CellVM;
}

export const DateTimeCell = observer(({ cell }: DateTimeCellProps) => {
  return (
    <CellWrapper cell={cell}>
      <Text
        whiteSpace="nowrap"
        textOverflow="ellipsis"
        overflow="hidden"
        fontWeight="300"
        color="gray.600"
      >
        {cell.displayValue}
      </Text>
    </CellWrapper>
  );
});
