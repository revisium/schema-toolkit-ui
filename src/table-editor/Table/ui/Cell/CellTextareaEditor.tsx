import { Portal, Textarea } from '@chakra-ui/react';
import { FC, useCallback, useLayoutEffect, useRef, useState } from 'react';
import {
  CELL_HEIGHT,
  type CellPosition,
  LINE_HEIGHT,
  resolveCursorPosition,
  VERTICAL_PADDING,
} from './cellEditorUtils.js';

interface CellTextareaEditorProps {
  value: string;
  position: CellPosition;
  clickOffset?: number;
  appendChar?: string;
  autoHeight?: boolean;
  allowShiftEnter?: boolean;
  onCommit: (localValue: string) => void;
  onCommitEnter?: (localValue: string) => void;
  onCancel: () => void;
  testId: string;
  textAlign?: 'left' | 'right';
}

const MAX_VISIBLE_LINES = 3;
const MAX_HEIGHT = MAX_VISIBLE_LINES * LINE_HEIGHT + VERTICAL_PADDING * 2;

export const CellTextareaEditor: FC<CellTextareaEditorProps> = ({
  value,
  position,
  clickOffset,
  appendChar,
  autoHeight = false,
  allowShiftEnter = false,
  onCommit,
  onCommitEnter,
  onCancel,
  testId,
  textAlign = 'left',
}) => {
  const initialValue = appendChar ?? value;
  const [localValue, setLocalValue] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const savedRef = useRef(false);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      const cursorPos = resolveCursorPosition(
        appendChar,
        initialValue.length,
        clickOffset,
        value.length,
      );
      textareaRef.current.setSelectionRange(cursorPos, cursorPos);
    }
  }, [clickOffset, value.length, appendChar, initialValue.length]);

  useLayoutEffect(() => {
    if (autoHeight && textareaRef.current) {
      textareaRef.current.style.height = `${CELL_HEIGHT}px`;
      const scrollHeight = textareaRef.current.scrollHeight;
      if (scrollHeight > CELL_HEIGHT) {
        textareaRef.current.style.height = `${Math.min(scrollHeight, MAX_HEIGHT)}px`;
      }
    }
  }, [autoHeight, localValue]);

  const handleCommit = useCallback(() => {
    if (savedRef.current) {
      return;
    }
    savedRef.current = true;
    onCommit(localValue);
  }, [localValue, onCommit]);

  const handleCommitEnter = useCallback(() => {
    if (savedRef.current) {
      return;
    }
    savedRef.current = true;
    if (onCommitEnter) {
      onCommitEnter(localValue);
    } else {
      onCommit(localValue);
    }
  }, [localValue, onCommit, onCommitEnter]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        savedRef.current = true;
        onCancel();
        return;
      }
      if (e.key === 'Enter') {
        if (allowShiftEnter && e.shiftKey) {
          return;
        }
        e.preventDefault();
        handleCommitEnter();
      }
    },
    [handleCommitEnter, onCancel, allowShiftEnter],
  );

  const handleBlur = useCallback(() => {
    handleCommit();
  }, [handleCommit]);

  return (
    <Portal>
      <Textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        position="fixed"
        top={`${position.top}px`}
        left={`${position.left}px`}
        width={`${position.width}px`}
        minWidth={`${position.width}px`}
        height={`${CELL_HEIGHT}px`}
        minHeight={`${CELL_HEIGHT}px`}
        zIndex={9999}
        bg="white"
        borderRadius="0"
        border="none"
        outline="2px solid"
        outlineColor="blue.500"
        outlineOffset="-2px"
        px="8px"
        py={`${VERTICAL_PADDING}px`}
        m={0}
        fontFamily="inherit"
        fontSize="inherit"
        fontWeight="300"
        textAlign={textAlign}
        lineHeight={`${LINE_HEIGHT}px`}
        resize="both"
        overflow="auto"
        boxShadow="0 4px 12px rgba(0,0,0,0.15)"
        _focus={{
          outline: '2px solid',
          outlineColor: 'blue.500',
          outlineOffset: '-2px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
        data-testid={testId}
      />
    </Portal>
  );
};
