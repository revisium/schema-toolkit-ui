import { observer } from 'mobx-react-lite';
import { Box, Text } from '@chakra-ui/react';
import { useCallback } from 'react';
import type { CellVM } from '../../model/CellVM.js';
import { CellTextareaEditor } from './CellTextareaEditor.js';
import { CellWrapper } from './CellWrapper.js';
import { useTextareaCell } from './useTextareaCell.js';

interface StringCellProps {
  cell: CellVM;
}

export const StringCell = observer(({ cell }: StringCellProps) => {
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

  const trimValue = useCallback((localValue: string) => {
    let trimmed = localValue;
    while (trimmed.endsWith('\n')) {
      trimmed = trimmed.slice(0, -1);
    }
    return trimmed;
  }, []);

  const handleCommit = useCallback(
    (localValue: string) => {
      const trimmed = trimValue(localValue);
      if (trimmed !== cell.displayValue) {
        cell.commitEdit(trimmed);
      } else {
        cell.cancelEdit();
      }
      handleCommitted();
    },
    [cell, handleCommitted, trimValue],
  );

  const handleCommitEnter = useCallback(
    (localValue: string) => {
      const trimmed = trimValue(localValue);
      if (trimmed !== cell.displayValue) {
        cell.commitEditAndMoveDown(trimmed);
      } else {
        cell.commitEditAndMoveDown();
      }
      handleCommitted();
    },
    [cell, handleCommitted, trimValue],
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
          autoHeight
          allowShiftEnter
          onCommit={handleCommit}
          onCommitEnter={handleCommitEnter}
          onCancel={handleCancel}
          testId="string-cell-input"
        />
      )}
    </Box>
  );
});
