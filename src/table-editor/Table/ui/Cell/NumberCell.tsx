import { observer } from 'mobx-react-lite';
import { Box, Text } from '@chakra-ui/react';
import { useCallback } from 'react';
import type { CellVM } from '../../model/CellVM.js';
import { CellTextareaEditor } from './CellTextareaEditor.js';
import { CellWrapper } from './CellWrapper.js';
import { useTextareaCell } from './useTextareaCell.js';

interface NumberCellProps {
  cell: CellVM;
}

export const NumberCell = observer(({ cell }: NumberCellProps) => {
  const {
    cellRef,
    textRef,
    editPosition,
    clickOffsetValue,
    appendCharValue,
    startEditing,
    handleTypeChar,
    handleCommitted,
    handleCancel,
    handleStartEditFromKeyboard,
  } = useTextareaCell(cell);

  const handleCommit = useCallback(
    (localValue: string) => {
      const parsed = Number(localValue);
      if (Number.isNaN(parsed)) {
        cell.cancelEdit();
      } else if (String(parsed) !== cell.displayValue) {
        cell.commitEdit(parsed);
      } else {
        cell.cancelEdit();
      }
      handleCommitted();
    },
    [cell, handleCommitted],
  );

  return (
    <Box ref={cellRef}>
      <CellWrapper
        cell={cell}
        onDoubleClick={startEditing}
        onStartEdit={handleStartEditFromKeyboard}
        onTypeChar={handleTypeChar}
      >
        <Text
          ref={textRef as React.RefObject<HTMLParagraphElement>}
          whiteSpace="nowrap"
          textOverflow="ellipsis"
          overflow="hidden"
          fontWeight="300"
          textAlign="right"
          flex={1}
          minWidth={0}
        >
          {cell.displayValue}
        </Text>
      </CellWrapper>
      {cell.isEditing && editPosition && (
        <CellTextareaEditor
          value={cell.displayValue}
          position={editPosition}
          clickOffset={clickOffsetValue}
          appendChar={appendCharValue}
          onCommit={handleCommit}
          onCancel={handleCancel}
          testId="number-cell-input"
        />
      )}
    </Box>
  );
});
