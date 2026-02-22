import { type RefObject, useCallback, useRef } from 'react';
import type { CellVM } from '../../model/CellVM.js';
import { type CellPosition, getClickOffset } from './cellEditorUtils.js';

interface TextareaCellState {
  cellRef: RefObject<HTMLDivElement | null>;
  textRef: RefObject<HTMLParagraphElement | null>;
  getEditPosition: () => CellPosition | null;
  clickOffsetValue: number | undefined;
  appendCharValue: string | undefined;
  startEditing: (clientX?: number) => void;
  handleTypeChar: (char: string) => void;
  handleCommit: (localValue: string) => void;
  handleCommitEnter: (localValue: string) => void;
  handleCommitted: () => void;
  handleCancel: () => void;
  handleStartEditFromKeyboard: () => void;
}

export function useTextareaCell(cell: CellVM): TextareaCellState {
  const cellRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  const getEditPosition = useCallback((): CellPosition | null => {
    if (!cellRef.current) {
      return null;
    }
    const rect = cellRef.current.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
    };
  }, []);

  const trigger = cell.editTrigger;
  const clickOffsetValue =
    trigger?.type === 'doubleClick' ? trigger.clickOffset : undefined;
  const appendCharValue = trigger?.type === 'char' ? trigger.char : undefined;

  const startEditing = useCallback(
    (clientX?: number) => {
      if (!cell.isEditable) {
        return;
      }
      const offset =
        clientX === undefined
          ? undefined
          : getClickOffset(textRef.current, cell.displayValue, clientX);
      cell.startEditWithDoubleClick(offset);
    },
    [cell],
  );

  const handleTypeChar = useCallback(
    (char: string) => {
      if (!cell.isEditable) {
        return;
      }
      cell.startEditWithChar(char);
    },
    [cell],
  );

  const handleCommitted = useCallback(() => {}, []);

  const handleCancel = useCallback(() => {
    cell.cancelEdit();
  }, [cell]);

  const handleStartEditFromKeyboard = useCallback(() => {
    if (!cell.isEditable) {
      return;
    }
    cell.startEdit();
  }, [cell]);

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
      if (trimmed === cell.displayValue) {
        cell.cancelEdit();
      } else {
        cell.commitEdit(trimmed);
      }
      handleCommitted();
    },
    [cell, handleCommitted, trimValue],
  );

  const handleCommitEnter = useCallback(
    (localValue: string) => {
      const trimmed = trimValue(localValue);
      if (trimmed === cell.displayValue) {
        cell.commitEditAndMoveDown();
      } else {
        cell.commitEditAndMoveDown(trimmed);
      }
      handleCommitted();
    },
    [cell, handleCommitted, trimValue],
  );

  return {
    cellRef,
    textRef,
    getEditPosition,
    clickOffsetValue,
    appendCharValue,
    startEditing,
    handleTypeChar,
    handleCommit,
    handleCommitEnter,
    handleCommitted,
    handleCancel,
    handleStartEditFromKeyboard,
  };
}
