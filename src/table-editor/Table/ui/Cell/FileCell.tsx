import { observer } from 'mobx-react-lite';
import { HStack, Text } from '@chakra-ui/react';
import { PiFileBold } from 'react-icons/pi';
import type { CellVM } from '../../model/CellVM.js';
import { CellWrapper } from './CellWrapper.js';

interface FileCellProps {
  cell: CellVM;
}

export const FileCell = observer(({ cell }: FileCellProps) => {
  return (
    <CellWrapper cell={cell}>
      <HStack gap={1}>
        <PiFileBold />
        <Text
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          overflow="hidden"
          fontWeight="300"
        >
          {cell.displayValue}
        </Text>
      </HStack>
    </CellWrapper>
  );
});
