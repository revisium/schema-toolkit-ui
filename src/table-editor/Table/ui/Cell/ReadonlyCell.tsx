import { observer } from 'mobx-react-lite';
import { Text } from '@chakra-ui/react';
import type { CellVM } from '../../model/CellVM.js';
import { CellWrapper } from './CellWrapper.js';

interface ReadonlyCellProps {
  cell: CellVM;
}

export const ReadonlyCell = observer(({ cell }: ReadonlyCellProps) => {
  return (
    <CellWrapper cell={cell}>
      <Text
        whiteSpace="nowrap"
        textOverflow="ellipsis"
        overflow="hidden"
        fontSize="14px"
        color="text/primary"
      >
        {cell.displayValue}
      </Text>
    </CellWrapper>
  );
});
