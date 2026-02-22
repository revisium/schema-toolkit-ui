import { observer } from 'mobx-react-lite';
import { Box, Text } from '@chakra-ui/react';
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
    handleCommit,
    handleCommitEnter,
    handleCancel,
    handleStartEditFromKeyboard,
  } = useTextareaCell(cell);

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
