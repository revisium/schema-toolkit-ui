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
    getEditPosition,
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

  const handleCommitEnter = useCallback(
    (localValue: string) => {
      const parsed = Number(localValue);
      if (Number.isNaN(parsed)) {
        cell.commitEditAndMoveDown();
      } else if (String(parsed) !== cell.displayValue) {
        cell.commitEditAndMoveDown(parsed);
      } else {
        cell.commitEditAndMoveDown();
      }
      handleCommitted();
    },
    [cell, handleCommitted],
  );

  const editPosition = cell.isEditing ? getEditPosition() : null;

  return (
    <Box ref={cellRef}>
      <CellWrapper
        cell={cell}
        onDoubleClick={startEditing}
        onStartEdit={handleStartEditFromKeyboard}
        onTypeChar={handleTypeChar}
        onDelete={() => cell.clearToDefault()}
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
      {editPosition && (
        <CellTextareaEditor
          value={cell.displayValue}
          position={editPosition}
          clickOffset={clickOffsetValue}
          appendChar={appendCharValue}
          onCommit={handleCommit}
          onCommitEnter={handleCommitEnter}
          onCancel={handleCancel}
          testId="number-cell-input"
          textAlign="right"
        />
      )}
    </Box>
  );
});
